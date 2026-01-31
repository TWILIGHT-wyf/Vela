import { PropValue, JSExpression } from './expression'
import { ActionSchema } from './action'
import { I18nString } from './i18n'

/**
 * 布局模式
 * - free: 自由布局 (Absolute Position)
 * - flex: 弹性布局 (Flexbox)
 * - grid: 网格布局 (CSS Grid)
 * - flow: 文档流布局 (Normal Flow)
 */
export type LayoutMode = 'free' | 'flex' | 'grid' | 'flow'

/**
 * 数据绑定配置
 * 用于在组件之间建立属性联动关系
 */
export interface DataBinding {
  /** 数据源组件ID */
  sourceId: string
  /** 数据源属性路径 (e.g., 'props.value') */
  sourcePath: string
  /** 目标属性路径 (e.g., 'props.text') */
  targetPath: string
  /** 数据转换器 (表达式或模板字符串) */
  transformer?: string
  /** 转换器类型 */
  transformerType?: 'expression' | 'template'
}

/**
 * 数据源配置
 */
export interface DataSourceConfig {
  enabled?: boolean
  url?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  body?: string
  interval?: number // 轮询间隔（秒）
  // 数据路径映射
  dataPath?: string
  xAxisPath?: string
  seriesNamePath?: string
  labelsPath?: string
  valuePath?: string
  namePath?: string
  minPath?: string
  maxPath?: string
  nodesPath?: string
  linksPath?: string
}

/**
 * 统一的节点样式类型
 */
export interface NodeStyle {
  // === 位置与尺寸 (Layout) ===
  // 推荐使用数值
  x?: number
  y?: number
  width?: number | string
  height?: number | string

  // 兼容旧格式
  /** @deprecated Use 'x' instead */
  left?: string
  /** @deprecated Use 'y' instead */
  top?: string

  // === 变换 (Transform) ===
  rotate?: number
  transform?: string

  // === 层级 (Z-Index) ===
  zIndex?: number

  // === Flex 容器属性 (当自身作为 Flex Container 时) ===
  display?: string
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around'
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch'
  gap?: number | string

  // === Flex 子项属性 (当自身作为 Flex Item 时) ===
  flexGrow?: number
  flexShrink?: number
  flexBasis?: string | number
  alignSelf?: 'auto' | 'flex-start' | 'center' | 'flex-end' | 'stretch'
  margin?: string
  padding?: number | string

  // === 视觉样式 (Visual) ===
  locked?: boolean
  color?: string
  fontSize?: string | number
  fontWeight?: string | number
  fontFamily?: string
  textAlign?: string
  lineHeight?: string | number
  position?: string
  backgroundColor?: string
  borderRadius?: string | number
  opacity?: number
  overflow?: string
  boxShadow?: string
  border?: string

  // 允许任意其他属性 (兼容性)
  [key: string]: unknown
}

/**
 * 核心节点协议：描述页面上的一个组件实例
 * V2.0 架构：支持递归、多布局模式、AST 生成
 */
export interface NodeSchema<P = Record<string, PropValue>> {
  id: string
  componentName: string // 对应 MaterialMeta.componentName
  title?: I18nString // User-defined display name
  props?: P
  style?: NodeStyle

  // 布局模式 (决定 children 的排列方式)
  layoutMode?: LayoutMode

  // 代码生成专用：插槽配置
  slotName?: string // 属于父组件的哪个插槽
  slotScope?: string // 作用域插槽参数名

  // 数据源配置
  dataSource?: DataSourceConfig

  // 子节点
  children?: NodeSchema[]

  // 动态指令
  condition?: boolean | JSExpression // v-if
  loop?: {
    // v-for
    data: unknown[] | JSExpression
    itemArg?: string
    indexArg?: string
  }

  // 事件交互
  events?: Record<string, ActionSchema[]>

  // 数据联动绑定
  dataBindings?: DataBinding[]

  // 动画配置
  animation?: {
    name: string
    class: string
    duration: number
    delay: number
    iterationCount: number | string
    timingFunction: string
    trigger: 'load' | 'hover' | 'click'
  }
}
