import type { I18nString } from './i18n'
export type { I18nString } from './i18n'

// ============================================================================
// 属性设置器
// ============================================================================

/**
 * 属性设置器类型
 *
 * 基础类型：StringSetter, NumberSetter, BooleanSetter 等
 * 复合类型：ObjectSetter (语义分组), ArraySetter (列表配置)
 */
export type SetterType =
  | 'StringSetter'
  | 'NumberSetter'
  | 'BooleanSetter'
  | 'SelectSetter'
  | 'ColorSetter'
  | 'JsonSetter'
  | 'ExpressionSetter'
  | 'ImageSetter'
  | 'RadioSetter'
  | 'SliderSetter'
  // V2: 复合设置器 - 用于语义分组和列表配置
  | 'ObjectSetter'
  | 'ArraySetter'

/**
 * 导入类型
 */
export type ImportType = 'default' | 'named' | 'namespace' | 'side-effect'

/**
 * 组件导入源定义
 */
export interface ComponentImportSpec {
  package: string
  exportName: string
  type?: ImportType
  async?: boolean
}

/**
 * 属性定义
 *
 * V2 扩展：支持嵌套属性定义
 * - properties: 用于 ObjectSetter，定义对象的子属性
 * - items: 用于 ArraySetter，定义数组元素的 Schema
 */
export interface PropSchema {
  name: string
  label: string // 原 title
  title?: string // 兼容 title
  setter: SetterType
  defaultValue?: unknown
  setterProps?: Record<string, unknown>
  visible?: string | ((props: Record<string, unknown>) => boolean)
  description?: string
  group?: string
  required?: boolean
  schemaKey?: string
  validationMessage?: string

  /**
   * V2: ObjectSetter 的子属性定义
   * 当 setter 为 'ObjectSetter' 时，用于定义对象内部的属性结构
   */
  properties?: Record<string, PropSchema>

  /**
   * V2: ArraySetter 的元素 Schema
   * 当 setter 为 'ArraySetter' 时，用于定义数组中每个元素的结构
   */
  items?: PropSchema

  /**
   * V2: 是否在编辑器中折叠显示（用于 ObjectSetter/ArraySetter）
   */
  collapsed?: boolean
}

// 兼容别名
export type PropConfig = PropSchema

/**
 * 物料协议
 */
export interface MaterialMeta {
  name: string
  componentName?: string // 兼容旧代码，指向 name
  title: I18nString
  version: string
  category: string
  screenshot?: string

  isContainer?: boolean

  assets?: {
    js: string
    css?: string
    library?: string
  }

  props: PropSchema[] | Record<string, PropSchema>

  // 兼容旧的 styles 配置 (如果是分开定义的)
  styles?: Record<string, PropSchema>

  events?: string[]

  defaultSize?: { width: number; height: number }

  importSpec?: ComponentImportSpec
}
