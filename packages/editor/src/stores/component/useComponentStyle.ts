import { ref, computed } from 'vue'
import type { NodeSchema, NodeStyle } from '@vela/core'
import type { ComponentIndexContext } from './useComponentIndex'

/**
 * 组件样式和属性管理
 */
export function useComponentStyle(
  indexCtx: ComponentIndexContext,
  syncToProjectStore: () => void,
) {
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

    node.style = {
      ...(node.style || {}),
      ...style,
    }

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
      ...props,
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
        const _v = styleVersion.value[id]
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
    updateStyle: (id: string, style: Record<string, unknown>) => void,
  ): import('vue').WritableComputedRef<T> {
    return computed({
      get: () => {
        // 订阅版本号变化以触发响应式更新
        const _v = styleVersion.value[id]
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
    updateStyle: (id: string, style: Record<string, unknown>) => void,
  ): Record<string, import('vue').WritableComputedRef<unknown>> {
    const refs: Record<string, import('vue').WritableComputedRef<unknown>> = {}
    for (const config of styleConfigs) {
      refs[config.name] = createStyleRef(id, config.name, config.defaultValue, updateStyle)
    }
    return refs
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

    // Ref Factories
    createPropRef,
    createStyleRef,
    createPropRefs,
    createStyleRefs,
  }
}

export type ComponentStyleContext = ReturnType<typeof useComponentStyle>
