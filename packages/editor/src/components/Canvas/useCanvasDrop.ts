import { ref, computed, readonly, nextTick, type Ref } from 'vue'
import { useThrottleFn } from '@vueuse/core'
import type { GridContainerLayout, NodeSchema } from '@vela/core'
import { countTracks } from '@vela/core'
import {
  COMPONENT_REGISTRY,
  getComponentDefinition,
  resolveComponentAlias,
} from '@vela/core/contracts'
import { materialList } from '@vela/materials'
import { useComponent } from '@/stores/component'
import {
  findFirstFitPlacement,
  nodeToPlacement,
  placementToLayoutItem,
  placementToGeometry,
  type GridPlacement,
} from '@/utils/gridPlacement'
import type { CanvasDropData, DropIndicatorState, DropPosition } from './types'

/**
 * 容器类型组件列表
 * 这些组件可以接收子组件
 */
const ROW_CONTAINER_COMPONENTS = new Set(['row', 'flex'])
const COLUMN_CONTAINER_COMPONENTS = new Set(['col'])

const CONTAINER_COMPONENT_SET = new Set<string>()

for (const definition of COMPONENT_REGISTRY) {
  if (!definition.isContainer) continue
  CONTAINER_COMPONENT_SET.add(definition.name)
  CONTAINER_COMPONENT_SET.add(definition.name.toLowerCase())
}

for (const meta of materialList) {
  if (!meta?.isContainer) continue
  if (meta.name) {
    const canonicalName = resolveComponentAlias(meta.name)
    CONTAINER_COMPONENT_SET.add(meta.name)
    CONTAINER_COMPONENT_SET.add(meta.name.toLowerCase())
    CONTAINER_COMPONENT_SET.add(canonicalName)
    CONTAINER_COMPONENT_SET.add(canonicalName.toLowerCase())
  }
  if (meta.componentName) {
    const canonicalName = resolveComponentAlias(meta.componentName)
    CONTAINER_COMPONENT_SET.add(meta.componentName)
    CONTAINER_COMPONENT_SET.add(meta.componentName.toLowerCase())
    CONTAINER_COMPONENT_SET.add(canonicalName)
    CONTAINER_COMPONENT_SET.add(canonicalName.toLowerCase())
  }
}

/**
 * 最大嵌套深度限制
 * 防止过深嵌套导致性能问题
 */
const MAX_NESTING_DEPTH = 10
const DEFAULT_GRID_ITEM_SPAN = { colSpan: 3, rowSpan: 2 }
const DEFAULT_GRID_CONTAINER_SPAN = { colSpan: 6, rowSpan: 4 }

/**
 * 检查节点是否为容器类型
 */
export function isContainerComponentName(name: string): boolean {
  if (!name) return false
  const canonicalName = resolveComponentAlias(name)
  const definition = getComponentDefinition(canonicalName)
  if (definition) {
    return Boolean(definition.isContainer)
  }
  return CONTAINER_COMPONENT_SET.has(name) || CONTAINER_COMPONENT_SET.has(name.toLowerCase())
}

function isContainerNode(node: NodeSchema): boolean {
  const name = node.component || node.componentName || ''
  return isContainerComponentName(name)
}

type FlowDirection = 'row' | 'column'
type EditorLayoutMode = 'grid'

export function inferDropDirectionForParent(node: NodeSchema | null | undefined): FlowDirection {
  if (!node) return 'column'

  const style = node.style || {}
  const display = String(style.display || '').toLowerCase()
  const flexDirection = String(style.flexDirection || '').toLowerCase()
  const name = String(node.component || node.componentName || '').toLowerCase()

  if (display === 'flex') {
    return flexDirection.startsWith('column') ? 'column' : 'row'
  }

  if (ROW_CONTAINER_COMPONENTS.has(name)) {
    return flexDirection.startsWith('column') ? 'column' : 'row'
  }

  if (COLUMN_CONTAINER_COMPONENTS.has(name)) {
    return 'column'
  }

  return 'column'
}

function normalizeLayoutMode(mode: 'grid' | undefined): EditorLayoutMode {
  void mode
  return 'grid'
}

function escapeCssAttrValue(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value)
  }
  return value.replace(/["\\]/g, '\\$&')
}

/**
 * 流式布局拖拽逻辑 Hook
 *
 * 核心功能：
 * 1. 计算拖拽时的插入位置 (before/after/inside)
 * 2. 提供拖拽指示器的状态
 * 3. 处理拖放完成后的组件移动/添加
 * 4. 自动滚动视口
 */
export function useCanvasDrop(viewportRef?: Ref<HTMLElement | null>) {
  const componentStore = useComponent()

  const getRootNode = () => componentStore.rootNode

  // ========== State ==========

  /** 当前正在拖拽的组件 ID (用于排除自身) */
  const draggingId = ref<string | null>(null)

  /** 拖拽指示器状态 */
  const indicatorState = ref<DropIndicatorState>({
    visible: false,
    rect: null,
    position: 'after',
    direction: 'column',
    targetId: null,
    targetParentId: null,
  })

  // ========== Auto Scroll ==========
  const SCROLL_ZONE = 60
  const SCROLL_SPEED = 15

  function handleAutoScroll(mouseY: number) {
    if (!viewportRef || !viewportRef.value) return

    const viewport = viewportRef.value
    const rect = viewport.getBoundingClientRect()

    // Check top edge
    if (mouseY - rect.top < SCROLL_ZONE) {
      viewport.scrollTop -= SCROLL_SPEED
    }
    // Check bottom edge
    else if (rect.bottom - mouseY < SCROLL_ZONE) {
      viewport.scrollTop += SCROLL_SPEED
    }
  }

  // ========== Computed ==========

  /** 只读的指示器状态 */
  const indicator = computed(() => indicatorState.value)

  // ========== Internal Helpers ==========

  /**
   * 计算节点的嵌套深度
   * @param nodeId 节点 ID
   * @returns 嵌套深度（0 表示根节点）
   */
  function getNodeDepth(nodeId: string): number {
    let depth = 0
    let currentId: string | null = nodeId

    while (currentId) {
      const parentId = componentStore.getParentId(currentId)
      if (!parentId) break
      depth++
      currentId = parentId
    }

    return depth
  }

  /**
   * 检查是否可以放入目标容器
   * @param targetId 目标容器 ID
   * @param position 放置位置
   * @returns 是否允许放置
   */
  function canDropIntoTarget(targetId: string, position: DropPosition): boolean {
    // 如果是 inside 位置，检查目标容器深度
    if (position === 'inside') {
      const depth = getNodeDepth(targetId)
      if (depth >= MAX_NESTING_DEPTH - 1) {
        console.warn(`[useCanvasDrop] Nesting depth limit reached: ${depth}`)
        return false
      }
    }
    return true
  }

  /**
   * 检查 targetId 是否为 ancestorId 的后代
   */
  function isDescendantOf(targetId: string, ancestorId: string): boolean {
    let currentParentId = componentStore.getParentId(targetId)
    while (currentParentId) {
      if (currentParentId === ancestorId) {
        return true
      }
      currentParentId = componentStore.getParentId(currentParentId)
    }
    return false
  }

  function resolveLayoutMode(
    rootNode: NodeSchema,
    nodeId: string | null | undefined,
  ): EditorLayoutMode {
    let cursorId: string | null = nodeId ?? rootNode.id
    while (cursorId) {
      const node = componentStore.findNodeById(rootNode, cursorId)
      if (node?.container?.mode) {
        return normalizeLayoutMode(node.container.mode)
      }
      cursorId = componentStore.getParentId(cursorId)
    }
    return normalizeLayoutMode(rootNode.container?.mode)
  }

  function resolveGridColumnCount(node: NodeSchema): number {
    if (node.container?.mode !== 'grid') return 1
    const container = node.container as GridContainerLayout
    if (Array.isArray(container.columnTracks) && container.columnTracks.length > 0) {
      return container.columnTracks.length
    }
    if (container.templateMode === 'autoFit') return 12
    return Math.max(1, countTracks(container.columns || '1fr'))
  }

  function resolveGridRowCount(node: NodeSchema): number {
    if (node.container?.mode !== 'grid') return 1
    const container = node.container as GridContainerLayout
    if (container.templateMode === 'autoFit') return 1
    if (container.rowTracks === 'auto') return 1
    if (Array.isArray(container.rowTracks) && container.rowTracks.length > 0) {
      return container.rowTracks.length
    }
    return Math.max(1, countTracks(container.rows || '1fr'))
  }

  function resolveGridGapPx(node: NodeSchema, axis: 'x' | 'y'): number {
    if (node.container?.mode !== 'grid') return 8
    const container = node.container as GridContainerLayout
    const candidate =
      axis === 'x' ? (container.gapX ?? container.gap ?? 8) : (container.gapY ?? container.gap ?? 8)
    const parsed = Number(candidate)
    if (Number.isFinite(parsed)) {
      return Math.max(0, parsed)
    }
    return 8
  }

  function toDomRect(rect: DropIndicatorState['rect'] | null): DOMRect | null {
    if (!rect) return null
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height,
      x: rect.left,
      y: rect.top,
      toJSON: () => ({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        right: rect.left + rect.width,
        bottom: rect.top + rect.height,
        x: rect.left,
        y: rect.top,
      }),
    } as DOMRect
  }

  function resolveGridParentRect(
    parentId: string,
    fallbackRect: DropIndicatorState['rect'] | null,
  ): DOMRect | null {
    const escapedId = escapeCssAttrValue(parentId)
    const parentEl = document.querySelector(`[data-id="${escapedId}"]`) as HTMLElement | null
    if (parentEl) {
      return parentEl.getBoundingClientRect()
    }
    const rootNode = getRootNode()
    if (rootNode?.id === parentId) {
      const stageEl = document.querySelector('.simulation-page.canvas-stage') as HTMLElement | null
      if (stageEl) {
        return stageEl.getBoundingClientRect()
      }
    }
    return toDomRect(fallbackRect)
  }

  function resolveDefaultGridSpan(
    columnCount: number,
    isContainerComponent: boolean,
  ): { colSpan: number; rowSpan: number } {
    if (!isContainerComponent) {
      return {
        colSpan: Math.min(DEFAULT_GRID_ITEM_SPAN.colSpan, Math.max(1, columnCount)),
        rowSpan: DEFAULT_GRID_ITEM_SPAN.rowSpan,
      }
    }

    return {
      colSpan: Math.max(1, Math.min(columnCount, Math.ceil(columnCount / 2))),
      rowSpan: DEFAULT_GRID_CONTAINER_SPAN.rowSpan,
    }
  }

  function resolveMovingNodeSpan(
    node: NodeSchema,
    colCount: number,
  ): { colSpan: number; rowSpan: number } {
    const isContainerComponent = isContainerNode(node)
    const defaultSpan = resolveDefaultGridSpan(colCount, isContainerComponent)
    const placement = nodeToPlacement(node, colCount, {
      colStart: 1,
      rowStart: 1,
      colSpan: defaultSpan.colSpan,
      rowSpan: defaultSpan.rowSpan,
    })

    return {
      colSpan: placement.colSpan,
      rowSpan: placement.rowSpan,
    }
  }

  function buildGridPointerPlacement(
    parent: NodeSchema,
    nodeRect: DOMRect | null,
    clientX: number,
    clientY: number,
    span: { colSpan: number; rowSpan: number },
  ): GridPlacement {
    const colCount = resolveGridColumnCount(parent)
    const safeColSpan = Math.min(Math.max(1, span.colSpan), colCount)
    const safeRowSpan = Math.min(Math.max(1, span.rowSpan), 48)
    const fallback: GridPlacement = {
      colStart: 1,
      colSpan: safeColSpan,
      rowStart: 1,
      rowSpan: safeRowSpan,
    }

    if (!nodeRect || nodeRect.width <= 0 || nodeRect.height <= 0) {
      return fallback
    }

    const gridContainer =
      parent.container?.mode === 'grid' ? (parent.container as GridContainerLayout) : undefined
    const colGapPx = resolveGridGapPx(parent, 'x')
    const rowGapPx = resolveGridGapPx(parent, 'y')
    const colWidth = Math.max(
      1,
      (nodeRect.width - Math.max(0, colGapPx * (colCount - 1))) / colCount,
    )
    const relX = Math.max(0, clientX - nodeRect.left)
    const relY = Math.max(0, clientY - nodeRect.top)
    const colStep = colWidth + colGapPx
    const colStart = Math.max(
      1,
      Math.min(colCount - safeColSpan + 1, Math.floor(relX / colStep) + 1),
    )
    const rowCount = resolveGridRowCount(parent)
    const rowHeight =
      gridContainer?.templateMode === 'autoFit' || gridContainer?.rowTracks === 'auto'
        ? Math.max(12, Number(gridContainer.autoRowsMin ?? 24))
        : Math.max(
            1,
            (nodeRect.height - Math.max(0, rowGapPx * (rowCount - 1))) / Math.max(1, rowCount),
          )
    const rowStep = rowHeight + rowGapPx
    const rowStart = Math.max(1, Math.floor(relY / rowStep) + 1)

    return {
      colStart,
      colSpan: safeColSpan,
      rowStart,
      rowSpan: safeRowSpan,
    }
  }

  function collectSiblingPlacements(parent: NodeSchema, excludeId?: string): GridPlacement[] {
    const colCount = resolveGridColumnCount(parent)
    const children = parent.children || []
    const placements: GridPlacement[] = []
    for (const child of children) {
      if (excludeId && child.id === excludeId) continue
      const hasGridPlacement = child.layoutItem?.mode === 'grid'
      if (!hasGridPlacement) continue
      placements.push(nodeToPlacement(child, colCount))
    }
    return placements
  }

  function resolveDesiredPlacementFromTarget(
    target: NodeSchema,
    position: DropPosition,
    parentColCount: number,
    span: { colSpan: number; rowSpan: number },
  ): GridPlacement {
    const safeColSpan = Math.min(Math.max(1, span.colSpan), parentColCount)
    const safeRowSpan = Math.min(Math.max(1, span.rowSpan), 48)
    const fallback: GridPlacement = {
      colStart: 1,
      colSpan: safeColSpan,
      rowStart: 1,
      rowSpan: safeRowSpan,
    }
    const targetHasGridPlacement = target.layoutItem?.mode === 'grid'
    if (!targetHasGridPlacement) return fallback
    const targetPlacement = nodeToPlacement(target, parentColCount)
    if (position === 'before') {
      return { ...fallback, colStart: targetPlacement.colStart, rowStart: targetPlacement.rowStart }
    }
    if (position === 'after') {
      return {
        ...fallback,
        colStart: targetPlacement.colStart,
        rowStart: targetPlacement.rowStart + targetPlacement.rowSpan,
      }
    }
    return {
      ...fallback,
      colStart: targetPlacement.colStart,
      rowStart: targetPlacement.rowStart,
      colSpan: Math.min(targetPlacement.colSpan, safeColSpan),
    }
  }

  /**
   * 计算插入位置
   * @param mouseX 鼠标 X 坐标
   * @param mouseY 鼠标 Y 坐标
   * @param rect 目标元素的边界
   * @param node 目标节点
   * @param direction 目标节点在父容器中的排列方向
   * @param isAltPressed 是否按住 Alt 键（强制放入内部）
   * @param isShiftPressed 是否按住 Shift 键（强制同级 before/after）
   */
  function calculateDropPosition(
    mouseX: number,
    mouseY: number,
    rect: DOMRect,
    node: NodeSchema,
    direction: FlowDirection,
    isAltPressed: boolean = false,
    isShiftPressed: boolean = false,
  ): DropPosition {
    const isHorizontal = direction === 'row'
    const edgeSize = isHorizontal ? rect.width : rect.height
    if (edgeSize <= 0) {
      return 'after'
    }

    const relative = isHorizontal ? mouseX - rect.left : mouseY - rect.top

    // 容器特殊处理
    if (isContainerNode(node)) {
      // Shift 键强制同级插入
      if (isShiftPressed) {
        const ratio = relative / edgeSize
        return ratio < 0.5 ? 'before' : 'after'
      }

      // Alt 键强制放入内部
      if (isAltPressed) {
        return 'inside'
      }

      // 空容器默认放入内部
      if (!node.children || node.children.length === 0) {
        return 'inside'
      }

      // 为容器边缘保留固定像素命中区，降低误放入容器内部的概率。
      // 小组件至少 10px，大组件最多 28px。
      const edgeZone = Math.min(28, Math.max(10, edgeSize * 0.18))
      const centerZone = edgeSize - edgeZone * 2
      const ratio = relative / edgeSize

      // 非常小的目标节点，弱化 inside，避免误触发
      if (centerZone < 20) {
        if (ratio >= 0.4 && ratio <= 0.6) {
          return 'inside'
        }
        return ratio < 0.5 ? 'before' : 'after'
      }

      if (relative < edgeZone) {
        return 'before'
      } else if (relative > edgeSize - edgeZone) {
        return 'after'
      } else {
        return 'inside'
      }
    }

    // 非容器组件：只有 before/after
    const ratio = relative / edgeSize
    return ratio < 0.5 ? 'before' : 'after'
  }

  // ========== Public Methods ==========

  /**
   * 设置当前正在拖拽的组件 ID
   * 用于排除拖拽时自身的 dragover 事件
   */
  function setDraggingId(id: string | null) {
    draggingId.value = id
    if (!id) {
      hideIndicator()
    }
  }

  /**
   * 计算并更新指示器状态 (Throttled)
   */
  const updateIndicatorState = useThrottleFn(
    (
      mouseX: number,
      mouseY: number,
      node: NodeSchema,
      element: HTMLElement,
      isAltPressed: boolean,
      isShiftPressed: boolean,
    ) => {
      const rect = element.getBoundingClientRect()

      // Auto scroll
      handleAutoScroll(mouseY)

      // 计算父节点 ID
      let targetParentId: string | null = null
      let direction: FlowDirection = 'column'
      const rootNode = getRootNode()
      if (rootNode) {
        const parent = componentStore.findParentNode(rootNode, node.id)
        targetParentId = parent?.id || null
        direction = inferDropDirectionForParent(parent || rootNode)
      }

      const position = calculateDropPosition(
        mouseX,
        mouseY,
        rect,
        node,
        direction,
        isAltPressed,
        isShiftPressed,
      )

      if (!canDropIntoTarget(node.id, position)) {
        hideIndicator()
        return
      }

      // 更新指示器状态
      indicatorState.value = {
        visible: true,
        rect: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        },
        position,
        direction,
        targetId: node.id,
        targetParentId,
      }
    },
    16, // 16ms throttle (~60fps)
  )

  /**
   * 处理 dragover 事件
   * 核心算法：根据鼠标位置计算插入位置
   */
  function handleDragOver(e: DragEvent, node: NodeSchema, element: HTMLElement) {
    // 忽略拖拽到自身
    if (draggingId.value && node.id === draggingId.value) {
      hideIndicator()
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'none'
      }
      return
    }

    // 检查是否拖拽到自己的子节点（防止循环嵌套）
    if (draggingId.value && isDescendantOf(node.id, draggingId.value)) {
      // 拖拽到自己的子节点，忽略
      hideIndicator()
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'none'
      }
      return
    }

    // 允许拖放
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move'
    }

    updateIndicatorState(e.clientX, e.clientY, node, element, e.altKey, e.shiftKey)
  }

  /**
   * 处理 dragleave 事件
   */
  function handleDragLeave(e: DragEvent) {
    // 检查是否真的离开了元素（避免子元素触发 dragleave）
    const relatedTarget = e.relatedTarget as HTMLElement | null
    const currentTarget = e.currentTarget as HTMLElement

    if (relatedTarget && currentTarget.contains(relatedTarget)) {
      return
    }

    // 隐藏指示器
    indicatorState.value = {
      ...indicatorState.value,
      visible: false,
    }
  }

  /**
   * 处理 drop 事件
   * 根据指示器状态执行组件移动或添加
   */
  function handleDrop(e: DragEvent): boolean {
    e.preventDefault()
    e.stopPropagation()

    const state = indicatorState.value
    const clientX = e.clientX
    const clientY = e.clientY

    // 隐藏指示器
    indicatorState.value = {
      visible: false,
      rect: null,
      position: 'after',
      direction: 'column',
      targetId: null,
      targetParentId: null,
    }

    // 验证状态
    const rootNode = getRootNode()
    if (!state.targetId || !rootNode) {
      console.warn('[useCanvasDrop] Invalid drop state')
      return false
    }

    // 获取拖拽数据
    const dataStr = e.dataTransfer?.getData('application/x-vela') || '{}'
    let dropData: CanvasDropData

    try {
      dropData = JSON.parse(dataStr) as CanvasDropData
    } catch {
      console.warn('[useCanvasDrop] Invalid drop data')
      return false
    }

    // 判断是移动还是新增
    const isMove = !!dropData.nodeId && draggingId.value === dropData.nodeId
    const targetNode = componentStore.findNodeById(rootNode, state.targetId)

    if (!targetNode) {
      console.warn('[useCanvasDrop] Target node not found')
      return false
    }

    // 检查嵌套深度
    if (!canDropIntoTarget(state.targetId, state.position)) {
      console.warn('[useCanvasDrop] Nesting depth limit exceeded')
      return false
    }

    if (isMove) {
      // 移动现有组件
      return handleMoveComponent(dropData.nodeId!, state, clientX, clientY)
    } else {
      // 添加新组件
      return handleAddComponent(dropData, state, clientX, clientY)
    }
  }

  /**
   * 处理组件移动
   */
  function handleMoveComponent(
    nodeId: string,
    state: DropIndicatorState,
    clientX: number,
    clientY: number,
  ): boolean {
    const rootNode = getRootNode()
    if (!rootNode || !state.targetId) return false

    const { position, targetId, targetParentId } = state
    const movingNode = componentStore.findNodeById(rootNode, nodeId)
    if (!movingNode) {
      console.warn('[useCanvasDrop] Moving node not found')
      return false
    }

    // 计算新的父节点和索引
    let newParentId: string
    let newIndex: number

    if (position === 'inside') {
      // 放入目标容器内部
      newParentId = targetId
      const targetNode = componentStore.findNodeById(rootNode, targetId)
      newIndex = targetNode?.children?.length || 0
    } else {
      // 放在目标的前面或后面
      newParentId = targetParentId || rootNode.id
      const parent = componentStore.findNodeById(rootNode, newParentId)

      if (!parent?.children) {
        console.warn('[useCanvasDrop] Parent has no children array')
        return false
      }

      const targetIndex = parent.children.findIndex((c) => c.id === targetId)
      if (targetIndex < 0) {
        console.warn('[useCanvasDrop] Target index not found in parent')
        return false
      }
      newIndex = position === 'before' ? targetIndex : targetIndex + 1

      // 如果是同一个父节点内的移动，需要调整索引
      const oldParent = componentStore.findParentNode(rootNode, nodeId)
      if (oldParent?.id === newParentId) {
        const oldIndex = oldParent.children?.findIndex((c) => c.id === nodeId) ?? -1
        if (oldIndex !== -1 && oldIndex < newIndex) {
          newIndex -= 1
        }
      }
    }

    const newParentNode = componentStore.findNodeById(rootNode, newParentId)
    const newParentMode = resolveLayoutMode(rootNode, newParentId)
    if (newParentMode === 'grid' && newParentNode) {
      if (newParentNode.container?.mode !== 'grid') {
        componentStore.updateContainerLayout(newParentNode.id, 'grid')
      }

      const colCount = resolveGridColumnCount(newParentNode)
      const movingSpan = resolveMovingNodeSpan(movingNode, colCount)
      const targetNode = componentStore.findNodeById(rootNode, targetId)
      const desiredFromTarget = resolveDesiredPlacementFromTarget(
        targetNode || newParentNode,
        position,
        colCount,
        movingSpan,
      )
      const parentRect = resolveGridParentRect(newParentNode.id, state.rect)
      const desiredFromPointer = buildGridPointerPlacement(
        newParentNode,
        parentRect,
        clientX,
        clientY,
        movingSpan,
      )
      const desiredPlacement = parentRect ? desiredFromPointer : desiredFromTarget
      const existingPlacements = collectSiblingPlacements(newParentNode, nodeId)
      const resolvedPlacement = findFirstFitPlacement(
        existingPlacements,
        desiredPlacement,
        colCount,
      )

      const oldParentId = componentStore.getParentId(nodeId)
      const oldParentNode = oldParentId ? componentStore.findNodeById(rootNode, oldParentId) : null
      const oldIndex = oldParentNode?.children?.findIndex((c) => c.id === nodeId) ?? -1
      const nextGeometry = placementToGeometry(
        resolvedPlacement,
        movingNode.geometry?.mode === 'grid' ? movingNode.geometry : undefined,
      )
      if (oldParentId !== newParentId || oldIndex !== newIndex) {
        componentStore.moveComponentWithGeometry(nodeId, newParentId, newIndex, nextGeometry)
      } else {
        componentStore.updateGeometry(nodeId, nextGeometry)
      }
      return true
    }

    console.log(`[useCanvasDrop] Moving ${nodeId} to ${newParentId} at index ${newIndex}`)
    componentStore.moveComponent(nodeId, newParentId, newIndex)

    return true
  }

  /**
   * 处理新组件添加
   */
  function handleAddComponent(
    dropData: CanvasDropData,
    state: DropIndicatorState,
    clientX: number,
    clientY: number,
  ): boolean {
    const rootNode = getRootNode()
    if (!rootNode || !state.targetId) return false

    const { position, targetId, targetParentId } = state
    const effectiveParentId = position === 'inside' ? targetId : targetParentId || rootNode.id
    const effectiveParent = componentStore.findNodeById(rootNode, effectiveParentId)
    const effectiveParentMode = resolveLayoutMode(rootNode, effectiveParentId)

    const componentName = dropData.component || dropData.componentName
    if (!componentName) {
      console.warn('[useCanvasDrop] Missing component name in drop payload')
      return false
    }
    const isContainerComponent = isContainerNode({ component: componentName } as NodeSchema)

    // Check if the effective parent is a grid container
    const gridParentId = effectiveParentId === rootNode.id ? null : effectiveParentId
    const gridParentNode = effectiveParent || rootNode
    const isGridParent = effectiveParentMode === 'grid'

    if (isGridParent && gridParentNode) {
      if (gridParentNode.container?.mode !== 'grid') {
        componentStore.updateContainerLayout(gridParentNode.id, 'grid')
      }
      const colCount = resolveGridColumnCount(gridParentNode)
      const defaultSpan = resolveDefaultGridSpan(colCount, isContainerComponent)
      const targetNode = componentStore.findNodeById(rootNode, targetId)
      const desiredFromTarget = resolveDesiredPlacementFromTarget(
        targetNode || gridParentNode,
        position,
        colCount,
        defaultSpan,
      )
      const parentRect = resolveGridParentRect(gridParentNode.id, state.rect)
      const desiredFromPointer = buildGridPointerPlacement(
        gridParentNode,
        parentRect,
        clientX,
        clientY,
        defaultSpan,
      )
      const desiredPlacement = parentRect ? desiredFromPointer : desiredFromTarget
      const existingPlacements = collectSiblingPlacements(gridParentNode)
      const firstContainerPlacement =
        isContainerComponent && existingPlacements.length === 0
          ? {
              ...desiredPlacement,
              colStart: 1,
              colSpan: colCount,
              rowStart: 1,
              rowSpan: Math.max(desiredPlacement.rowSpan, DEFAULT_GRID_CONTAINER_SPAN.rowSpan),
            }
          : desiredPlacement
      const resolvedPlacement = findFirstFitPlacement(
        existingPlacements,
        desiredPlacement,
        colCount,
      )
      const finalPlacement =
        isContainerComponent && existingPlacements.length === 0
          ? findFirstFitPlacement(existingPlacements, firstContainerPlacement, colCount)
          : resolvedPlacement

      const newComponent: NodeSchema = {
        id: `comp_${crypto.randomUUID()}`,
        component: componentName,
        props: dropData.props ?? {},
        style: { ...(dropData.style || {}) },
        layoutItem: placementToLayoutItem(finalPlacement),
        geometry: placementToGeometry(finalPlacement),
        children: isContainerComponent ? [] : undefined,
      }

      const parentForAdd: string | null = gridParentId
      let insertIdx: number | undefined
      if (position !== 'inside' && gridParentNode.children) {
        const tIdx = gridParentNode.children.findIndex((c: NodeSchema) => c.id === targetId)
        insertIdx = position === 'before' ? tIdx : tIdx + 1
      }

      const newId = componentStore.addComponent(parentForAdd, newComponent, insertIdx)
      if (newId) {
        nextTick(() => {
          componentStore.selectComponent(newId)
        })
        return true
      }
      return false
    }

    return false
  }

  /**
   * 隐藏指示器
   */
  function hideIndicator() {
    indicatorState.value = {
      visible: false,
      rect: null,
      position: 'after',
      direction: 'column',
      targetId: null,
      targetParentId: null,
    }
  }

  /**
   * 处理拖拽到根容器（空白区域）
   */
  function handleDropOnRoot(e: DragEvent): boolean {
    e.preventDefault()
    e.stopPropagation()

    hideIndicator()

    const dataStr = e.dataTransfer?.getData('application/x-vela') || '{}'
    let dropData: CanvasDropData

    try {
      dropData = JSON.parse(dataStr) as CanvasDropData
    } catch {
      return false
    }

    const componentName = dropData.component || dropData.componentName
    if (!componentName) {
      return false
    }
    const isContainerComponent = isContainerNode({ component: componentName } as NodeSchema)

    const rootNode = getRootNode()
    const rootLayoutMode = normalizeLayoutMode(rootNode?.container?.mode)

    if (rootLayoutMode === 'grid' && rootNode) {
      const colCount = resolveGridColumnCount(rootNode)
      const defaultSpan = resolveDefaultGridSpan(colCount, isContainerComponent)
      const target = e.currentTarget as HTMLElement | null
      const rootRect = target?.getBoundingClientRect() || null

      if (dropData.nodeId && draggingId.value === dropData.nodeId) {
        const movingNode = componentStore.findNodeById(rootNode, dropData.nodeId)
        if (!movingNode) return false

        const movingSpan = resolveMovingNodeSpan(movingNode, colCount)
        const desired = buildGridPointerPlacement(
          rootNode,
          rootRect,
          e.clientX,
          e.clientY,
          movingSpan,
        )
        const existingPlacements = collectSiblingPlacements(rootNode, dropData.nodeId)
        const resolvedPlacement = findFirstFitPlacement(existingPlacements, desired, colCount)
        const currentParentId = componentStore.getParentId(dropData.nodeId)
        const nextGeometry = placementToGeometry(
          resolvedPlacement,
          movingNode.geometry?.mode === 'grid' ? movingNode.geometry : undefined,
        )
        if (currentParentId !== rootNode.id) {
          componentStore.moveComponentWithGeometry(
            dropData.nodeId,
            rootNode.id,
            rootNode.children?.length || 0,
            nextGeometry,
          )
        } else {
          componentStore.updateGeometry(dropData.nodeId, nextGeometry)
        }
        return true
      }

      const desired = buildGridPointerPlacement(
        rootNode,
        rootRect,
        e.clientX,
        e.clientY,
        defaultSpan,
      )
      const existingPlacements = collectSiblingPlacements(rootNode)
      const firstContainerPlacement =
        isContainerComponent && existingPlacements.length === 0
          ? {
              ...desired,
              colStart: 1,
              colSpan: colCount,
              rowStart: 1,
              rowSpan: Math.max(desired.rowSpan, DEFAULT_GRID_CONTAINER_SPAN.rowSpan),
            }
          : desired
      const resolvedPlacement = findFirstFitPlacement(
        existingPlacements,
        firstContainerPlacement,
        colCount,
      )

      const newComponent: NodeSchema = {
        id: `comp_${crypto.randomUUID()}`,
        component: componentName,
        props: dropData.props ?? {},
        style: { ...(dropData.style || {}) },
        layoutItem: placementToLayoutItem(resolvedPlacement),
        geometry: placementToGeometry(resolvedPlacement),
        children: isContainerComponent ? [] : undefined,
      }

      const newId = componentStore.addComponent(null, newComponent)
      if (newId) {
        nextTick(() => {
          componentStore.selectComponent(newId)
        })
        return true
      }
      return false
    }

    return false
  }

  return {
    // State
    indicator: readonly(indicator),
    draggingId: readonly(draggingId),

    // Methods
    setDraggingId,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDropOnRoot,
    hideIndicator,

    // Utilities
    isContainerNode,
    getNodeDepth,
    canDropIntoTarget,
    isDescendantOf,

    // Constants
    MAX_NESTING_DEPTH,
  }
}

export type UseCanvasDropReturn = ReturnType<typeof useCanvasDrop>
