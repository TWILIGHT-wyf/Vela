import { ref, computed } from 'vue'
import {
  normalizeGridContainerFields,
  syncRowsTemplate,
  type GridContainerLayout,
  type NodeGeometry,
  type NodeSchema,
  type NodeStyle,
} from '@vela/core'
import type { PropValue } from '@vela/core/types/expression'
import {
  maxOccupiedRow,
  nodeToPlacement,
  placementToLayoutItem,
  resolveGridPlacements,
  writePlacementToNode,
} from '@/utils/gridPlacement'
import type { ComponentIndexContext } from './useComponentIndex'

/**
 * 组件样式和属性管理
 */
export function useComponentStyle(indexCtx: ComponentIndexContext, syncToProjectStore: () => void) {
  const { nodeIndex, parentIndex } = indexCtx

  type InteractionDraft = {
    style?: Partial<NodeStyle>
    geometry?: Partial<NodeGeometry>
  }

  /**
   * 节点样式版本号：id -> version
   * 用于触发特定节点的响应式更新，避免全树重渲染
   */
  const styleVersion = ref<Record<string, number>>({})
  const interactionDrafts = ref<Record<string, InteractionDraft>>({})

  /**
   * 获取节点样式的版本号（用于触发响应式更新）
   */
  function getStyleVersion(id: string): number {
    return styleVersion.value[id] || 0
  }

  /**
   * 递增样式版本号
   */
  function incrementVersion(id: string) {
    styleVersion.value = {
      ...styleVersion.value,
      [id]: (styleVersion.value[id] || 0) + 1,
    }
  }

  function applyStylePatch(
    baseStyle: Partial<NodeStyle> | undefined,
    patch: Partial<NodeStyle> | undefined,
  ): NodeStyle {
    const nextStyle: Record<string, unknown> = {
      ...(baseStyle || {}),
      ...(patch || {}),
    }

    if (patch) {
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined) {
          delete nextStyle[key]
        }
      }
    }

    return nextStyle as NodeStyle
  }

  function resolveBaseGeometry(baseGeometry?: Partial<NodeGeometry>): NodeGeometry {
    return {
      mode: 'grid',
      gridColumnStart: 1,
      gridColumnEnd: 4,
      gridRowStart: 1,
      gridRowEnd: 3,
      ...(baseGeometry || {}),
    } as NodeGeometry
  }

  function getInteractionDraft(id: string): InteractionDraft | null {
    return interactionDrafts.value[id] || null
  }

  function getResolvedStyle(id: string, baseStyle?: Partial<NodeStyle>): NodeStyle {
    const draft = interactionDrafts.value[id]?.style
    if (!draft) return applyStylePatch(baseStyle, undefined)
    return applyStylePatch(baseStyle, draft)
  }

  function getResolvedGeometry(
    id: string,
    baseGeometry?: Partial<NodeGeometry>,
  ): NodeGeometry | undefined {
    const draft = interactionDrafts.value[id]?.geometry
    if (!draft) {
      return baseGeometry ? resolveBaseGeometry(baseGeometry) : undefined
    }
    return {
      ...resolveBaseGeometry(baseGeometry),
      ...draft,
    } as NodeGeometry
  }

  function updateInteractionDraft(id: string, draftPatch: InteractionDraft) {
    const currentDraft = interactionDrafts.value[id] || {}
    const nextDraft: InteractionDraft = {
      style: draftPatch.style ? { ...(currentDraft.style || {}), ...draftPatch.style } : currentDraft.style,
      geometry: draftPatch.geometry
        ? { ...(currentDraft.geometry || {}), ...draftPatch.geometry }
        : currentDraft.geometry,
    }

    interactionDrafts.value = {
      ...interactionDrafts.value,
      [id]: nextDraft,
    }
    incrementVersion(id)
  }

  function previewStyle(id: string, style: Partial<NodeStyle>) {
    updateInteractionDraft(id, { style })
  }

  function previewGeometry(id: string, geometry: Partial<NodeGeometry>) {
    updateInteractionDraft(id, { geometry })
  }

  function clearInteractionDraft(id: string, kind?: keyof InteractionDraft) {
    const currentDraft = interactionDrafts.value[id]
    if (!currentDraft) return

    if (!kind) {
      const { [id]: _removed, ...rest } = interactionDrafts.value
      interactionDrafts.value = rest
      incrementVersion(id)
      return
    }

    const nextDraft: InteractionDraft = { ...currentDraft }
    delete nextDraft[kind]

    if (!nextDraft.style && !nextDraft.geometry) {
      const { [id]: _removed, ...rest } = interactionDrafts.value
      interactionDrafts.value = rest
    } else {
      interactionDrafts.value = {
        ...interactionDrafts.value,
        [id]: nextDraft,
      }
    }
    incrementVersion(id)
  }

  function clearAllInteractionDrafts() {
    if (Object.keys(interactionDrafts.value).length === 0) return
    interactionDrafts.value = {}
    styleVersion.value = { ...styleVersion.value }
  }

  function ensureParentGridRowsForNode(id: string) {
    const parentId = parentIndex.get(id)
    if (!parentId) return

    const parentNode = nodeIndex.get(parentId)
    if (!parentNode || parentNode.container?.mode !== 'grid') return

    const container = parentNode.container as GridContainerLayout
    const { colCount } = normalizeGridContainerFields(container)

    let occupied = 1
    for (const child of parentNode.children || []) {
      const placement = nodeToPlacement(child, colCount)
      const rowEnd = placement.rowStart + placement.rowSpan
      occupied = Math.max(occupied, rowEnd - 1)
    }

    syncRowsTemplate(container, occupied)
  }

  /**
   * [Raw] 更新样式 - 不记录历史
   */
  function updateStyleRaw(id: string, style: Partial<NodeStyle>): void {
    const node = nodeIndex.get(id)
    if (!node) return

    node.style = applyStylePatch(node.style, style)

    incrementVersion(id)
    syncToProjectStore()
  }

  /**
   * [Raw] 更新属性 - 不记录历史
   */
  function updatePropsRaw(id: string, props: Record<string, unknown>): void {
    const node = nodeIndex.get(id)
    if (!node) return

    node.props = {
      ...(node.props || {}),
      ...(props as Record<string, PropValue>),
    }

    incrementVersion(id)
    syncToProjectStore()
  }

  /**
   * [Raw] 更新数据源 - 不记录历史
   */
  function updateDataSourceRaw(id: string, dataSource: Record<string, unknown>): void {
    const node = nodeIndex.get(id)
    if (!node) return

    const nextDataSource: Record<string, unknown> = {
      ...(node.dataSource || {}),
      ...dataSource,
    }

    for (const [key, value] of Object.entries(dataSource)) {
      if (value === undefined) {
        delete nextDataSource[key]
      }
    }

    if (Object.keys(nextDataSource).length === 0) {
      delete node.dataSource
    } else {
      node.dataSource = nextDataSource
    }

    incrementVersion(id)
    syncToProjectStore()
  }

  /**
   * [Raw] 更新几何信息 - 不记录历史
   */
  function updateGeometryRaw(id: string, geometry: Partial<NodeGeometry>): void {
    const node = nodeIndex.get(id)
    if (!node) return

    const nextGeometry = {
      ...resolveBaseGeometry(node.geometry),
      ...geometry,
    } as NodeGeometry
    node.geometry = nextGeometry

    if (nextGeometry.mode === 'grid') {
      const colSpan = Math.max(1, nextGeometry.gridColumnEnd - nextGeometry.gridColumnStart)
      const rowSpan = Math.max(1, nextGeometry.gridRowEnd - nextGeometry.gridRowStart)
      const fixedWidth =
        typeof nextGeometry.width === 'number' && Number.isFinite(nextGeometry.width)
          ? nextGeometry.width
          : undefined
      const fixedHeight =
        typeof nextGeometry.height === 'number' && Number.isFinite(nextGeometry.height)
          ? nextGeometry.height
          : undefined
      node.layoutItem = placementToLayoutItem(
        {
          colStart: nextGeometry.gridColumnStart,
          colSpan,
          rowStart: nextGeometry.gridRowStart,
          rowSpan,
        },
        {
          ...(node.layoutItem?.mode === 'grid' ? node.layoutItem : undefined),
          sizeModeX: fixedWidth !== undefined ? 'fixed' : node.layoutItem?.sizeModeX || 'stretch',
          sizeModeY: fixedHeight !== undefined ? 'fixed' : node.layoutItem?.sizeModeY || 'stretch',
          fixedWidth: fixedWidth ?? node.layoutItem?.fixedWidth,
          fixedHeight: fixedHeight ?? node.layoutItem?.fixedHeight,
        },
      )
    }

    ensureParentGridRowsForNode(id)

    incrementVersion(id)
    syncToProjectStore()
  }

  /**
   * [Raw] 统一设置为网格编排 - 不记录历史
   */
  function updateContainerLayoutRaw(id: string, layoutMode: 'grid' | undefined): void {
    const node = nodeIndex.get(id)
    if (!node) return

    const normalizedMode: 'grid' = layoutMode === 'grid' ? 'grid' : 'grid'

    node.container = {
      ...(node.container || {}),
      mode: normalizedMode,
    } as NodeSchema['container']

    const container = node.container as GridContainerLayout
    const { templateMode, colCount } = normalizeGridContainerFields(container)
    const children = node.children || []

    const placementMap = resolveGridPlacements(
      children.map((child, index) => {
        const hasExplicitPlacement =
          child.layoutItem?.mode === 'grid' || child.geometry?.mode === 'grid'
        return {
          id: child.id,
          explicit: hasExplicitPlacement,
          placement: hasExplicitPlacement
            ? nodeToPlacement(child, colCount)
            : {
                colStart: 1,
                colSpan: child.container?.mode === 'grid' && templateMode === 'autoFit' ? 1 : 3,
                rowStart: index + 1,
                rowSpan: 2,
              },
        }
      }),
      colCount,
    )

    children.forEach((child) => {
      const placement = placementMap.get(child.id)
      if (!placement) return
      writePlacementToNode(child, placement)
    })

    syncRowsTemplate(container, maxOccupiedRow(placementMap.values()))

    incrementVersion(id)
    syncToProjectStore()
  }

  /**
   * [Raw] 更新自适应网格模板 - 不记录历史
   */
  function updateGridTemplateRaw(id: string, columns: string, rows: string): void {
    const node = nodeIndex.get(id)
    if (!node || node.container?.mode !== 'grid') return

    const container = node.container as GridContainerLayout
    container.columns = columns
    container.rows = rows
    // 重新规范化容器字段（会检测 templateMode、更新 tracks 等）
    normalizeGridContainerFields(container)
    incrementVersion(id)
    syncToProjectStore()
  }

  /**
   * 创建单个属性的响应式双向绑定引用
   * @param id 节点 ID
   * @param propName 属性名
   * @param defaultValue 默认值
   * @param updateProps 更新函数（带历史记录）
   */
  function createPropRef<T = unknown>(
    id: string,
    propName: string,
    defaultValue: T | undefined,
    updateProps: (id: string, props: Record<string, unknown>) => void,
  ): import('vue').WritableComputedRef<T> {
    return computed({
      get: () => {
        // 订阅版本号变化以触发响应式更新
        void styleVersion.value[id]
        const node = nodeIndex.get(id)
        const value = node?.props?.[propName]
        return (value !== undefined ? value : defaultValue) as T
      },
      set: (value: T) => {
        updateProps(id, { [propName]: value })
      },
    })
  }

  /**
   * 创建单个样式属性的响应式双向绑定引用
   * @param id 节点 ID
   * @param styleName 样式属性名
   * @param defaultValue 默认值
   * @param updateStyle 更新函数（带历史记录）
   */
  function createStyleRef<T = unknown>(
    id: string,
    styleName: string,
    defaultValue: T | undefined,
    updateStyle: (id: string, style: Partial<NodeStyle>) => void,
  ): import('vue').WritableComputedRef<T> {
    return computed({
      get: () => {
        // 订阅版本号变化以触发响应式更新
        void styleVersion.value[id]
        const node = nodeIndex.get(id)
        const value = node?.style?.[styleName as keyof typeof node.style]
        return (value !== undefined ? value : defaultValue) as T
      },
      set: (value: T) => {
        updateStyle(id, { [styleName]: value })
      },
    })
  }

  /**
   * 批量创建属性的响应式引用映射
   */
  function createPropRefs(
    id: string,
    propConfigs: Array<{ name: string; defaultValue?: unknown }>,
    updateProps: (id: string, props: Record<string, unknown>) => void,
  ): Record<string, import('vue').WritableComputedRef<unknown>> {
    const refs: Record<string, import('vue').WritableComputedRef<unknown>> = {}
    for (const config of propConfigs) {
      refs[config.name] = createPropRef(id, config.name, config.defaultValue, updateProps)
    }
    return refs
  }

  /**
   * 批量创建样式属性的响应式引用映射
   */
  function createStyleRefs(
    id: string,
    styleConfigs: Array<{ name: string; defaultValue?: unknown }>,
    updateStyle: (id: string, style: Partial<NodeStyle>) => void,
  ): Record<string, import('vue').WritableComputedRef<unknown>> {
    const refs: Record<string, import('vue').WritableComputedRef<unknown>> = {}
    for (const config of styleConfigs) {
      refs[config.name] = createStyleRef(id, config.name, config.defaultValue, updateStyle)
    }
    return refs
  }

  /**
   * [Raw] 更新事件配置 - 不记录历史
   */
  function updateEventsRaw(id: string, events: Record<string, unknown[]>): void {
    const node = nodeIndex.get(id)
    if (!node) return

    node.events = events as NodeSchema['events']
    incrementVersion(id)
    syncToProjectStore()
  }

  /**
   * [Raw] 更新响应式断点样式覆盖 - 不记录历史
   * Writes to node.responsive[breakpoint] instead of node.style
   */
  function updateResponsiveStyleRaw(
    id: string,
    breakpoint: string,
    style: Partial<NodeStyle>,
  ): void {
    const node = nodeIndex.get(id)
    if (!node) return

    if (!node.responsive) {
      node.responsive = {}
    }
    node.responsive[breakpoint] = {
      ...(node.responsive[breakpoint] || {}),
      ...style,
    }

    incrementVersion(id)
    syncToProjectStore()
  }

  return {
    // State
    styleVersion,
    interactionDrafts,

    // Getters
    getStyleVersion,
    getInteractionDraft,
    getResolvedStyle,
    getResolvedGeometry,

    // Raw Actions
    updateStyleRaw,
    updatePropsRaw,
    updateDataSourceRaw,
    updateGeometryRaw,
    updateEventsRaw,
    updateContainerLayoutRaw,
    updateGridTemplateRaw,
    updateResponsiveStyleRaw,
    previewStyle,
    previewGeometry,
    clearInteractionDraft,
    clearAllInteractionDrafts,

    // Ref Factories
    createPropRef,
    createStyleRef,
    createPropRefs,
    createStyleRefs,
  }
}

export type ComponentStyleContext = ReturnType<typeof useComponentStyle>
