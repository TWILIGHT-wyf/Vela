import {
  defineComponent,
  h,
  type Component,
  type PropType,
  computed,
  onErrorCaptured,
  ref,
  toRef,
} from 'vue'
import { useDataSource, type DataSource } from '@vela/ui'

/**
 * Material 定义选项
 */
export interface DefineMaterialOptions {
  /**
   * 组件名称（用于调试和 DevTools）
   */
  name?: string

  /**
   * 是否启用数据源连接
   * 启用后会自动注入 useDataSource 能力，并将 data, loading, error 传递给组件
   */
  connectData?: boolean

  /**
   * 是否启用事件执行器连接
   * 启用后会自动处理低代码事件系统
   */
  connectEvent?: boolean

  /**
   * 是否启用错误边界
   * 启用后组件渲染错误不会导致整个页面崩溃
   * @default true
   */
  errorBoundary?: boolean

  /**
   * 是否填满父容器
   * 启用后包裹一个 100% width/height 的容器
   * @default true
   */
  fillContainer?: boolean

  /**
   * 自定义 Props 转换器
   * 用于将旧的扁平 Props 转换为新的分组结构（向后兼容）
   */
  propsAdapter?: (props: Record<string, unknown>) => Record<string, unknown>

  /**
   * 额外的 Props 定义（会合并到组件 Props 中）
   */
  extraProps?: Record<string, unknown>
}

/**
 * 错误边界回退组件
 */
const ErrorFallback = defineComponent({
  name: 'MaterialErrorFallback',
  props: {
    error: {
      type: Object as PropType<Error>,
      default: null,
    },
    componentName: {
      type: String,
      default: 'Unknown',
    },
  },
  setup(props) {
    return () =>
      h(
        'div',
        {
          style: {
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 77, 79, 0.1)',
            border: '1px dashed #ff4d4f',
            borderRadius: '4px',
            padding: '16px',
            boxSizing: 'border-box',
            color: '#ff4d4f',
            fontSize: '12px',
          },
        },
        [
          h(
            'div',
            { style: { fontWeight: 'bold', marginBottom: '8px' } },
            `Component Error: ${props.componentName}`,
          ),
          h(
            'div',
            { style: { color: '#999', wordBreak: 'break-all' } },
            props.error?.message || 'Unknown error',
          ),
        ],
      )
  },
})

/**
 * 定义一个 Material 物料组件
 *
 * 这是一个高阶函数 (HOC)，用于统一处理：
 * - 样式外壳（统一布局）
 * - 数据源连接
 * - 事件系统连接
 * - 错误边界
 * - Props 适配（向后兼容）
 *
 * @example
 * ```ts
 * // 基础用法
 * export default defineMaterial(UiButton, {
 *   name: 'Button',
 *   connectEvent: true,
 * })
 *
 * // 带 Props 适配器（兼容旧数据）
 * export default defineMaterial(UiChart, {
 *   name: 'BarChart',
 *   propsAdapter: (props) => {
 *     // 将旧的扁平属性转换为新的分组结构
 *     if (props.barColor && !props.config) {
 *       return {
 *         ...props,
 *         config: { style: { color: props.barColor } }
 *       }
 *     }
 *     return props
 *   }
 * })
 * ```
 */
export function defineMaterial<T extends Component>(
  WrappedComponent: T,
  options: DefineMaterialOptions = {},
): Component {
  const {
    name = 'Material',
    connectData = false,
    connectEvent = false,
    errorBoundary = true,
    fillContainer = true,
    propsAdapter,
    extraProps = {},
  } = options

  return defineComponent({
    name: `Material${name}`,

    // 禁用属性继承，由内部组件接收
    inheritAttrs: false,

    props: {
      // 组件 ID（用于 Store 查找）
      id: {
        type: String,
        default: '',
      },
      // 数据源配置（当 connectData 为 true 时使用）
      dataSource: {
        type: Object as PropType<DataSource>,
        default: undefined,
      },
      ...extraProps,
    },

    setup(props, { attrs, slots }) {
      // 错误状态
      const hasError = ref(false)
      const error = ref<Error | null>(null)

      // 错误边界处理
      if (errorBoundary) {
        onErrorCaptured((err) => {
          console.error(`[Material:${name}] Render error:`, err)
          hasError.value = true
          error.value = err as Error
          return false // 阻止错误继续传播
        })
      }

      // Props 适配（向后兼容）
      const adaptedProps = computed(() => {
        const rawProps = { ...props, ...attrs }
        if (propsAdapter) {
          return propsAdapter(rawProps as Record<string, unknown>)
        }
        return rawProps
      })

      // 数据源连接
      let dataState = {
        data: ref<unknown>(null),
        loading: ref(false),
        error: ref<string | null>(null),
        fetchData: async () => {},
      }

      if (connectData) {
        // 将 props.dataSource 转为 Ref 传递给 hook
        const dataSourceRef = toRef(props, 'dataSource')
        const { data, loading, error: dsError, fetchData } = useDataSource(dataSourceRef)
        dataState = { data, loading, error: dsError, fetchData }
      }

      // 事件处理器增强（占位，实际实现需要 useEventExecutor）
      const enhancedAttrs = computed(() => {
        // 基础 Props
        const base = { ...adaptedProps.value }

        // 注入数据源状态
        if (connectData) {
          Object.assign(base, {
            data: dataState.data.value,
            loading: dataState.loading.value,
            error: dataState.error.value,
            // 允许组件手动刷新
            onRefresh: dataState.fetchData,
          })
        }

        if (!connectEvent) return base

        // TODO: 集成 useEventExecutor
        // 拦截 onClick 等事件，转发到低代码事件系统

        return base
      })

      return () => {
        // 错误边界回退
        if (hasError.value && errorBoundary) {
          return h(ErrorFallback, {
            error: error.value ?? undefined,
            componentName: name,
          })
        }

        // 包装容器
        // 注意：必须解构 slots，否则可能会因为 Proxy 导致 slot 传递失败或渲染错误
        const wrappedContent = h(WrappedComponent, enhancedAttrs.value, { ...slots })

        if (fillContainer) {
          return h(
            'div',
            {
              class: 'material-wrapper',
              style: {
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'stretch',
                // 确保容器本身不干扰 flex 布局
                flexDirection: 'column',
              },
            },
            [wrappedContent],
          )
        }

        return wrappedContent
      }
    },
  })
}

/**
 * 创建 Props 适配器的工具函数
 *
 * 用于将旧的扁平 Props 映射到新的分组结构
 *
 * @example
 * ```ts
 * const adapter = createPropsAdapter({
 *   'barColor': 'config.style.color',
 *   'barWidth': 'config.style.width',
 *   'showLegend': 'config.legend.show',
 * })
 * ```
 */
export function createPropsAdapter(
  mapping: Record<string, string>,
): (props: Record<string, unknown>) => Record<string, unknown> {
  return (props: Record<string, unknown>) => {
    const result: Record<string, unknown> = { ...props }

    for (const [oldKey, newPath] of Object.entries(mapping)) {
      if (oldKey in props && props[oldKey] !== undefined) {
        // 解析路径并设置值
        const pathParts = newPath.split('.')
        let current: Record<string, unknown> = result

        for (let i = 0; i < pathParts.length - 1; i++) {
          const part = pathParts[i]
          if (!(part in current) || typeof current[part] !== 'object') {
            current[part] = {}
          }
          current = current[part] as Record<string, unknown>
        }

        current[pathParts[pathParts.length - 1]] = props[oldKey]

        // 删除旧的扁平属性
        delete result[oldKey]
      }
    }

    return result
  }
}

export default defineMaterial
