import { I18nString } from './i18n'

/**
 * 属性设置器类型
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
 */
export interface PropSchema {
  name: string
  label: I18nString // 原 title
  title?: I18nString // 兼容 title
  setter: SetterType
  defaultValue?: unknown
  setterProps?: Record<string, unknown>
  visible?: string | ((props: any) => boolean)
  description?: string
  group?: string
  required?: boolean
  schemaKey?: string
  validationMessage?: string
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
