/**
 * 物料描述协议：描述组件在"编辑器"中的表现
 * 编辑器根据这个协议自动生成属性面板 (Property Panel)
 */
export interface MaterialMeta {
  componentName: string // 对应 @vela/ui 的导出名
  title: string // 显示名称 (e.g. '文本')
  category: string // 分类 (e.g. '基础', '图表')
  screenshot?: string // 缩略图 URL

  // 容器标识：标记组件是否可以容纳子组件（用于 Flow 模式判断）
  isContainer?: boolean

  // 属性配置器：定义右侧面板如何渲染（真正的组件 props）
  props?: {
    [propName: string]: PropConfig
  }

  // 样式配置器：定义组件支持的样式属性（会映射到 node.style）
  styles?: {
    [styleName: string]: PropConfig
  }

  // 组件支持的事件
  events?: string[] // e.g. ['onClick', 'onHover']
}

export interface PropConfig {
  title: string // 属性名
  // 设置器：描述用什么控件来编辑这个属性
  setter:
    | 'StringSetter'
    | 'NumberSetter'
    | 'BooleanSetter'
    | 'SelectSetter'
    | 'ColorSetter'
    | 'JsonSetter'
    | 'ArraySetter'
    | 'SliderSetter'
    | 'TextareaSetter'
    | 'ImageSetter'
    | string
  // 传递给设置器的参数 (如 Select 的 options)
  setterProps?: Record<string, unknown>
  defaultValue?: unknown
  description?: string // 属性说明
  group?: string // 属性分组（用于折叠面板）

  // ===== V2: Schema 驱动扩展 =====
  /**
   * Zod schema 引用键，用于运行时校验
   * 格式: "{componentName}.{propName}" (e.g., "vLineChart.data")
   * 如果设置，Command Store 会在更新前校验值
   */
  schemaKey?: string

  /**
   * 校验失败时的自定义错误消息
   */
  validationMessage?: string

  /**
   * 是否必填
   */
  required?: boolean
}
