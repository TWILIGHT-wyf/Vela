import { ref, computed } from 'vue'
import {
  countTracks,
  type GridNodeGeometry,
  type NodeGeometry,
  type NodeSchema,
  type NodeStyle,
} from '@vela/core'
import type { PropValue } from '@vela/core/types/expression'
import type { ComponentIndexContext } from './useComponentIndex'

/**
 * 组件样式和属性管理
 */
export function useComponentStyle(indexCtx: ComponentIndexContext, syncToProjectStore: () => void) {
  const { nodeIndex } = indexCtx

  /**
   * 节点样式版本号：id -> version
   * 用于触发特定节点的响应式更新，避免全树重渲染
   */
  const styleVersion = ref<Record<string, number>>({})

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

  /**
   * [Raw] 更新样式 - 不记录历史
   */
  function updateStyleRaw(id: string, style: Partial<NodeStyle>): void {
    const node = nodeIndex.get(id)
    if (!node) return

    const nextStyle: Record<string, unknown> = {
      ...(node.style || {}),
      ...style,
    }

    for (const [key, value] of Object.entries(style)) {
      if (value === undefined) {
        delete nextStyle[key]
      }
    }

    node.style = nextStyle as NodeStyle

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

    node.dataSource = { ...node.dataSource, ...dataSource }
    syncToProjectStore()
  }

  /**
   * [Raw] 更新几何信息 - 不记录历史
   */
  function updateGeometryRaw(id: string, geometry: Partial<NodeGeometry>): void {
    const node = nodeIndex.get(id)
    if (!node) return

    node.geometry = {
      ...(node.geometry || { mode: 'free' }),
      ...geometry,
    } as NodeGeometry

    incrementVersion(id)
    syncToProjectStore()
  }

  /**
   * [Raw] 更新布局模式 - 不记录历史
   */
  function updateContainerLayoutRaw(id: string, layoutMode: 'free' | 'flow' | 'grid'): void {
    const node = nodeIndex.get(id)
    if (!node) return

    node.container = {
      ...(node.container || {}),
      mode: layoutMode,
    } as NodeSchema['container']

    if (layoutMode === 'grid') {
      const container = node.container as unknown as Record<string, unknown>
      const normalizedColumns =
        typeof container.columns === 'string' && container.columns.trim().length > 0
          ? container.columns
          : '1fr'
      const colCount = Math.max(1, countTracks(String(normalizedColumns)))
      const children = node.children || []
      const rowCount = Math.max(children.length, 1)

      container.columns = normalizedColumns
      if (typeof container.rows !== 'string' || container.rows.trim().length === 0) {
        container.rows = Array(rowCount).fill('1fr').join(' ')
      }
      if (container.gap === undefined) {
        container.gap = 8
      }

      children.forEach((child, index) => {
        const geometry =
          child.geometry?.mode === 'grid' ? (child.geometry as GridNodeGeometry) : undefined
        child.geometry = {
          ...(geometry || {}),
          mode: 'grid',
          gridColumnStart: geometry?.gridColumnStart ?? 1,
          gridColumnEnd: geometry?.gridColumnEnd ?? colCount + 1,
          gridRowStart: index + 1,
          gridRowEnd: index + 2,
        } as GridNodeGeometry
      })
    }

    incrementVersion(id)
    syncToProjectStore()
  }

  /**
   * [Raw] 更新自适应网格模板 - 不记录历史
   */
  function updateGridTemplateRaw(id: string, columns: string, rows: string): void {
    const node = nodeIndex.get(id)
    if (!node || node.container?.mode !== 'grid') return

    const container = node.container as unknown as Record<string, unknown>
    container.columns = columns
    container.rows = rows
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

    // Getters
    getStyleVersion,

    // Raw Actions
    updateStyleRaw,
    updatePropsRaw,
    updateDataSourceRaw,
    updateGeometryRaw,
    updateEventsRaw,
    updateContainerLayoutRaw,
    updateGridTemplateRaw,
    updateResponsiveStyleRaw,

    // Ref Factories
    createPropRef,
    createStyleRef,
    createPropRefs,
    createStyleRefs,
  }
}

export type ComponentStyleContext = ReturnType<typeof useComponentStyle>
