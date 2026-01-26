import { computed, type WritableComputedRef, type Ref, watch } from 'vue'
import type { NodeSchema } from '@vela/core'
import type { PropConfig } from '@vela/core/types/material'
import { useComponent } from '@/stores/component'

/**
 * 创建节点属性的响应式双向绑定
 *
 * 这个 composable 提供了一种简洁的方式来实现属性面板和画布组件之间的双向绑定。
 * 通过 computed getter/setter 模式，消除了手动同步和 watch 的复杂性。
 *
 * @example
 * ```vue
 * <script setup>
 * const { propModels } = useNodeProps(toRef(props, 'node'), metaProps)
 *
 * // 在模板中直接使用
 * // <StringSetter v-model="propModels.text" />
 * </script>
 * ```
 */

export interface PropModelConfig {
  name: string
  defaultValue?: unknown
}

export interface UseNodePropsReturn {
  /**
   * 响应式属性模型映射
   * key 为属性名，value 为 WritableComputedRef
   */
  propModels: Ref<Record<string, WritableComputedRef<unknown>>>

  /**
   * 获取单个属性的响应式引用
   */
  getPropModel: <T = unknown>(propName: string, defaultValue?: T) => WritableComputedRef<T>

  /**
   * 当前节点 ID
   */
  nodeId: Ref<string | null>
}

/**
 * 创建节点属性的响应式双向绑定
 *
 * @param nodeRef 节点引用（响应式）
 * @param metaPropsRef 属性元数据配置（响应式）
 * @returns 响应式属性模型和工具函数
 */
export function useNodeProps(
  nodeRef: Ref<NodeSchema | null | undefined>,
  metaPropsRef: Ref<PropModelConfig[]>,
): UseNodePropsReturn {
  const componentStore = useComponent()

  // 当前节点 ID（响应式）
  const nodeId = computed(() => nodeRef.value?.id ?? null)

  /**
   * 获取单个属性的响应式引用
   */
  function getPropModel<T = unknown>(
    propName: string,
    defaultValue?: T,
  ): WritableComputedRef<T> {
    return computed({
      get: () => {
        const id = nodeId.value
        if (!id) return defaultValue as T

        // 订阅版本号以触发响应式更新
        const _v = componentStore.styleVersion[id]
        const node = componentStore.findNodeById(null, id)
        const value = node?.props?.[propName]
        return (value !== undefined ? value : defaultValue) as T
      },
      set: (value: T) => {
        const id = nodeId.value
        if (!id) return
        componentStore.updateProps(id, { [propName]: value })
      },
    })
  }

  /**
   * 批量创建所有属性的响应式模型
   * 当节点或元数据变化时自动重建
   */
  const propModels = computed(() => {
    const models: Record<string, WritableComputedRef<unknown>> = {}
    const id = nodeId.value
    if (!id) return models

    for (const config of metaPropsRef.value) {
      models[config.name] = computed({
        get: () => {
          // 订阅版本号以触发响应式更新
          const _v = componentStore.styleVersion[id]
          const node = componentStore.findNodeById(null, id)
          const value = node?.props?.[config.name]
          return value !== undefined ? value : config.defaultValue
        },
        set: (value: unknown) => {
          componentStore.updateProps(id, { [config.name]: value })
        },
      })
    }

    return models
  })

  return {
    propModels,
    getPropModel,
    nodeId,
  }
}

/**
 * 创建节点样式的响应式双向绑定
 */
export interface UseNodeStylesReturn {
  /**
   * 响应式样式模型映射
   */
  styleModels: Ref<Record<string, WritableComputedRef<unknown>>>

  /**
   * 获取单个样式属性的响应式引用
   */
  getStyleModel: <T = unknown>(styleName: string, defaultValue?: T) => WritableComputedRef<T>

  /**
   * 当前节点 ID
   */
  nodeId: Ref<string | null>
}

/**
 * 创建节点样式的响应式双向绑定
 *
 * @param nodeRef 节点引用（响应式）
 * @param styleConfigsRef 样式配置（响应式）
 * @returns 响应式样式模型和工具函数
 */
export function useNodeStyles(
  nodeRef: Ref<NodeSchema | null | undefined>,
  styleConfigsRef: Ref<PropModelConfig[]>,
): UseNodeStylesReturn {
  const componentStore = useComponent()

  const nodeId = computed(() => nodeRef.value?.id ?? null)

  function getStyleModel<T = unknown>(
    styleName: string,
    defaultValue?: T,
  ): WritableComputedRef<T> {
    return computed({
      get: () => {
        const id = nodeId.value
        if (!id) return defaultValue as T

        const _v = componentStore.styleVersion[id]
        const node = componentStore.findNodeById(null, id)
        const value = node?.style?.[styleName as keyof typeof node.style]
        return (value !== undefined ? value : defaultValue) as T
      },
      set: (value: T) => {
        const id = nodeId.value
        if (!id) return
        componentStore.updateStyle(id, { [styleName]: value })
      },
    })
  }

  const styleModels = computed(() => {
    const models: Record<string, WritableComputedRef<unknown>> = {}
    const id = nodeId.value
    if (!id) return models

    for (const config of styleConfigsRef.value) {
      models[config.name] = computed({
        get: () => {
          const _v = componentStore.styleVersion[id]
          const node = componentStore.findNodeById(null, id)
          const value = node?.style?.[config.name as keyof typeof node.style]
          return value !== undefined ? value : config.defaultValue
        },
        set: (value: unknown) => {
          componentStore.updateStyle(id, { [config.name]: value })
        },
      })
    }

    return models
  })

  return {
    styleModels,
    getStyleModel,
    nodeId,
  }
}
