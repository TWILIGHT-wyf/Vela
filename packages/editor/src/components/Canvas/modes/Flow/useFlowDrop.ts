import { ref, computed, readonly, nextTick, type Ref } from 'vue'
import { useThrottleFn } from '@vueuse/core'
import type { NodeSchema, GridNodeGeometry } from '@vela/core'
import { countTracks } from '@vela/core'
import { useComponent } from '@/stores/component'
import { useCanvasContext } from '../../composables/useCanvasContext'
import type { DropIndicatorState, DropPosition, FlowDropData } from './types'

/**
 * 容器类型组件列表
 * 这些组件可以接收子组件
 */
const CONTAINER_COMPONENTS = [
  'Container',
  'Group',
  'Row',
  'Col',
  'Flex',
  'Grid',
  'row',
  'col',
  'flex',
  'grid',
  'panel',
  'tabs',
  'modal',
  'Panel',
  'Card',
  'Tabs',
  'TabPane',
  'Modal',
  'Page',
]

/**
 * 最大嵌套深度限制
 * 防止过深嵌套导致性能问题
 */
const MAX_NESTING_DEPTH = 10

/**
 * 检查节点是否为容器类型
 */
function isContainerNode(node: NodeSchema): boolean {
  const name = node.component || node.componentName || ''
  return CONTAINER_COMPONENTS.includes(name) || CONTAINER_COMPONENTS.includes(name.toLowerCase())
}

type FlowDirection = 'row' | 'column'
type EditorLayoutMode = 'free' | 'grid'

function normalizeLayoutMode(mode: 'free' | 'flow' | 'grid' | undefined): EditorLayoutMode {
  return mode === 'free' ? 'free' : 'grid'
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
export function useFlowDrop(viewportRef?: Ref<HTMLElement | null>) {
  const componentStore = useComponent()
  const { scale: canvasScale } = useCanvasContext()

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
        console.warn(`[useFlowDrop] Nesting depth limit reached: ${depth}`)
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

  /**
   * 计算插入位置
   * @param mouseX 鼠标 X 坐标
   * @param mouseY 鼠标 Y 坐标
   * @param rect 目标元素的边界
   * @param node 目标节点
   * @param direction 目标节点在父容器中的排列方向
   * @param isAltPressed 是否按住 Alt 键（强制放入内部）
   */
  function calculateDropPosition(
    mouseX: number,
    mouseY: number,
    rect: DOMRect,
    node: NodeSchema,
    direction: FlowDirection,
    isAltPressed: boolean = false,
  ): DropPosition {
    const isHorizontal = direction === 'row'
    const edgeSize = isHorizontal ? rect.width : rect.height
    if (edgeSize <= 0) {
      return 'after'
    }

    const relative = isHorizontal ? mouseX - rect.left : mouseY - rect.top
    const ratio = relative / edgeSize

    // 容器特殊处理
    if (isContainerNode(node)) {
      // Alt 键强制放入内部
      if (isAltPressed) {
        return 'inside'
      }

      // 空容器默认放入内部
      if (!node.children || node.children.length === 0) {
        return 'inside'
      }

      // 鼠标在容器边缘 (上下 20% 区域) 时为 before/after
      // 鼠标在中间区域时为 inside
      const edgeThreshold = 0.2

      if (ratio < edgeThreshold) {
        return 'before'
      } else if (ratio > 1 - edgeThreshold) {
        return 'after'
      } else {
        return 'inside'
      }
    }

    // 非容器组件：只有 before/after
    return ratio < 0.5 ? 'before' : 'after'
  }

  // ========== Public Methods ==========

  /**
   * 设置当前正在拖拽的组件 ID
   * 用于排除拖拽时自身的 dragover 事件
   */
  function setDraggingId(id: string | null) {
    draggingId.value = id
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
    ) => {
      const rect = element.getBoundingClientRect()

      // Auto scroll
      handleAutoScroll(mouseY)

      // 计算父节点 ID
      let targetParentId: string | null = null
      const direction: FlowDirection = 'column'
      const rootNode = getRootNode()
      if (rootNode) {
        const parent = componentStore.findParentNode(rootNode, node.id)
        targetParentId = parent?.id || null
      }

      const position = calculateDropPosition(mouseX, mouseY, rect, node, direction, isAltPressed)

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
      return
    }

    // 检查是否拖拽到自己的子节点（防止循环嵌套）
    if (draggingId.value && isDescendantOf(node.id, draggingId.value)) {
      // 拖拽到自己的子节点，忽略
      return
    }

    // 允许拖放
    e.preventDefault()
    e.stopPropagation()

    updateIndicatorState(e.clientX, e.clientY, node, element, e.altKey)
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
      console.warn('[useFlowDrop] Invalid drop state')
      return false
    }

    // 获取拖拽数据
    const dataStr = e.dataTransfer?.getData('application/x-vela') || '{}'
    let dropData: FlowDropData

    try {
      dropData = JSON.parse(dataStr) as FlowDropData
    } catch {
      console.warn('[useFlowDrop] Invalid drop data')
      return false
    }

    // 判断是移动还是新增
    const isMove = !!dropData.nodeId && draggingId.value === dropData.nodeId
    const targetNode = componentStore.findNodeById(rootNode, state.targetId)

    if (!targetNode) {
      console.warn('[useFlowDrop] Target node not found')
      return false
    }

    // 检查嵌套深度
    if (!canDropIntoTarget(state.targetId, state.position)) {
      console.warn('[useFlowDrop] Nesting depth limit exceeded')
      return false
    }

    if (isMove) {
      // 移动现有组件
      return handleMoveComponent(dropData.nodeId!, state)
    } else {
      // 添加新组件
      return handleAddComponent(dropData, state, clientX, clientY)
    }
  }

  /**
   * 处理组件移动
   */
  function handleMoveComponent(nodeId: string, state: DropIndicatorState): boolean {
    const rootNode = getRootNode()
    if (!rootNode || !state.targetId) return false

    const { position, targetId, targetParentId } = state

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
        console.warn('[useFlowDrop] Parent has no children array')
        return false
      }

      const targetIndex = parent.children.findIndex((c) => c.id === targetId)
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

    console.log(`[useFlowDrop] Moving ${nodeId} to ${newParentId} at index ${newIndex}`)
    componentStore.moveComponent(nodeId, newParentId, newIndex)

    return true
  }

  /**
   * 处理新组件添加
   */
  function handleAddComponent(
    dropData: FlowDropData,
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
    const isFreeContainer = position === 'inside' && effectiveParentMode === 'free'

    const componentName = dropData.component || dropData.componentName
    if (!componentName) {
      console.warn('[useFlowDrop] Missing component name in drop payload')
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
      const gridContainer = gridParentNode.container as { columns?: string }
      const colCount = countTracks(gridContainer.columns || '1fr')

      const newComponent: NodeSchema = {
        id: `comp_${crypto.randomUUID()}`,
        component: componentName,
        props: dropData.props ?? {},
        style: { ...(dropData.style || {}), width: '100%', height: '100%' },
        geometry: {
          mode: 'grid',
          gridColumnStart: 1,
          gridColumnEnd: colCount + 1,
          gridRowStart: 1,
          gridRowEnd: 2,
        } as GridNodeGeometry,
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

    // Apply scale compensation for free containers
    const s = canvasScale.value || 1
    let x = 0
    let y = 0
    if (isFreeContainer && state.rect) {
      x = Math.max(0, Math.round((clientX - state.rect.left) / s))
      y = Math.max(0, Math.round((clientY - state.rect.top) / s))
    }

    // Resolve numeric dimensions for free-mode geometry
    const defaultW =
      dropData.width ?? (typeof dropData.style?.width === 'number' ? dropData.style.width : 120)
    const defaultH =
      dropData.height ?? (typeof dropData.style?.height === 'number' ? dropData.style.height : 80)

    // 创建新组件
    const newComponent: NodeSchema = {
      id: `comp_${crypto.randomUUID()}`,
      component: componentName,
      props: dropData.props ?? {},
      style: {
        width: isFreeContainer ? defaultW : '100%',
        minHeight: isFreeContainer ? undefined : '100%',
        height: isFreeContainer ? defaultH : undefined,
        gridColumn:
          !isFreeContainer && (dropData.style?.gridColumn as string | undefined) === undefined
            ? 'span 3'
            : (dropData.style?.gridColumn as string | undefined),
        gridRow:
          !isFreeContainer && (dropData.style?.gridRow as string | undefined) === undefined
            ? 'span 4'
            : (dropData.style?.gridRow as string | undefined),
        ...(dropData.style || {}),
      },
      geometry: isFreeContainer
        ? {
            mode: 'free' as const,
            x,
            y,
            width: defaultW,
            height: defaultH,
          }
        : undefined,
      children: isContainerComponent ? [] : undefined,
    }

    // 计算父节点和索引
    let parentId: string | null
    let index: number | undefined

    if (position === 'inside') {
      parentId = targetId
      index = undefined // 添加到末尾
    } else {
      parentId = targetParentId
      const parent = parentId ? componentStore.findNodeById(rootNode, parentId) : rootNode

      if (parent?.children) {
        const targetIndex = parent.children.findIndex((c: NodeSchema) => c.id === targetId)
        index = position === 'before' ? targetIndex : targetIndex + 1
      }
    }

    console.log(`[useFlowDrop] Adding ${newComponent.component} to ${parentId} at index ${index}`)
    const newId = componentStore.addComponent(parentId, newComponent, index)

    if (newId) {
      // 使用 nextTick 确保 DOM 渲染完成后再选中，避免选中框与渲染层不同步
      nextTick(() => {
        componentStore.selectComponent(newId)
      })
      return true
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
    let dropData: FlowDropData

    try {
      dropData = JSON.parse(dataStr) as FlowDropData
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
    // Apply scale compensation for free layout drop coordinates
    const s = canvasScale.value || 1
    let x = 0
    let y = 0
    if (rootLayoutMode === 'free') {
      const target = e.currentTarget as HTMLElement | null
      const rect = target?.getBoundingClientRect()
      if (rect) {
        x = Math.max(0, Math.round((e.clientX - rect.left) / s))
        y = Math.max(0, Math.round((e.clientY - rect.top) / s))
      }
    }

    // Grid composition mode: rely on tree-level normalization for row assignment
    if (rootLayoutMode === 'grid' && rootNode) {
      const gridContainer = rootNode.container as { columns?: string } | undefined
      const colCount = countTracks(gridContainer?.columns || '1fr')

      if (dropData.nodeId && draggingId.value === dropData.nodeId) {
        componentStore.moveComponent(dropData.nodeId, rootNode.id, rootNode.children?.length || 0)
        return true
      }

      const newComponent: NodeSchema = {
        id: `comp_${crypto.randomUUID()}`,
        component: componentName,
        props: dropData.props ?? {},
        style: { ...(dropData.style || {}), width: '100%', height: '100%' },
        geometry: {
          mode: 'grid',
          gridColumnStart: 1,
          gridColumnEnd: colCount + 1,
          gridRowStart: 1,
          gridRowEnd: 2,
        } as GridNodeGeometry,
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

    // 如果是移动操作
    if (dropData.nodeId && draggingId.value === dropData.nodeId && rootNode) {
      componentStore.moveComponent(dropData.nodeId, rootNode.id, rootNode.children?.length || 0)
      return true
    }

    // 添加新组件到根节点
    // Resolve numeric dimensions for free-mode geometry
    const defaultW =
      dropData.width ?? (typeof dropData.style?.width === 'number' ? dropData.style.width : 120)
    const defaultH =
      dropData.height ?? (typeof dropData.style?.height === 'number' ? dropData.style.height : 80)

    const newComponent: NodeSchema = {
      id: `comp_${crypto.randomUUID()}`,
      component: componentName,
      props: dropData.props ?? {},
      style: {
        width: rootLayoutMode === 'free' ? defaultW : '100%',
        minHeight: rootLayoutMode === 'free' ? undefined : '100%',
        height: rootLayoutMode === 'free' ? defaultH : undefined,
        gridColumn: dropData.style?.gridColumn as string | undefined,
        gridRow: dropData.style?.gridRow as string | undefined,
        ...(dropData.style || {}),
      },
      geometry:
        rootLayoutMode === 'free'
          ? {
              mode: 'free' as const,
              x,
              y,
              width: defaultW,
              height: defaultH,
            }
          : undefined,
      children: isContainerComponent ? [] : undefined,
    }

    const newId = componentStore.addComponent(null, newComponent)
    if (newId) {
      // 使用 nextTick 确保 DOM 渲染完成后再选中，避免选中框与渲染层不同步
      nextTick(() => {
        componentStore.selectComponent(newId)
      })
      return true
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

export type UseFlowDropReturn = ReturnType<typeof useFlowDrop>
