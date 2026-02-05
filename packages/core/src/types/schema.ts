import type { PropValue, JSExpression } from './expression'
import type { ActionSchema } from './action'
import type { VariableSchema } from './data'

// ============================================================================
// 表达式类型
// ============================================================================

/**
 * 表达式
 * 用于动态值绑定，由 Generator 转换为框架特定语法
 */
export type Expression = boolean | string | number | JSExpression

// ============================================================================
// 渲染控制
// ============================================================================

/**
 * 列表渲染配置
 * 框架无关的循环渲染描述
 *
 * @example
 * // Schema
 * { source: { $expr: 'state.users' }, itemAlias: 'user', indexAlias: 'i' }
 *
 * // → Vue: v-for="(user, i) in state.users"
 * // → React: state.users.map((user, i) => ...)
 */
export interface RepeatConfig {
  /** 数据源表达式 */
  source: Expression
  /** 唯一键字段 (用于优化渲染) */
  itemKey?: string
  /** 迭代项变量名，默认 'item' */
  itemAlias?: string
  /** 索引变量名，默认 'index' */
  indexAlias?: string
}

// ============================================================================
// 动画配置
// ============================================================================

/**
 * 动画触发方式
 */
export type AnimationTrigger = 'init' | 'hover' | 'click' | 'visible'

/**
 * 动画配置
 */
export interface AnimationConfig {
  /** 动画名称 (CSS animation-name 或预设名) */
  name: string
  /** CSS 类名 */
  className?: string
  /** 持续时间 (ms) */
  duration?: number
  /** 延迟时间 (ms) */
  delay?: number
  /** 迭代次数 ('infinite' 或数字) */
  iterations?: number | 'infinite'
  /** 缓动函数 */
  easing?: string
  /** 触发方式 */
  trigger?: AnimationTrigger
}

// ============================================================================
// 节点样式 (框架无关，纯 CSS)
// ============================================================================

/**
 * 节点样式
 * 框架无关的 CSS 样式描述
 */
export interface NodeStyle {
  // === 定位与尺寸 ===
  x?: number
  y?: number
  width?: number | string
  height?: number | string
  minWidth?: number | string
  maxWidth?: number | string
  minHeight?: number | string
  maxHeight?: number | string

  // === CSS 定位 ===
  position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky'
  top?: number | string
  right?: number | string
  bottom?: number | string
  left?: number | string
  zIndex?: number

  // === 变换 ===
  rotate?: number
  scale?: number
  transform?: string
  transformOrigin?: string

  // === 布局 (Flex) ===
  display?: 'block' | 'inline' | 'inline-block' | 'flex' | 'inline-flex' | 'grid' | 'none'
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly'
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline'
  alignContent?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'space-between' | 'space-around'
  gap?: number | string
  rowGap?: number | string
  columnGap?: number | string

  // === 布局 (Flex Item) ===
  flexGrow?: number
  flexShrink?: number
  flexBasis?: number | string
  alignSelf?: 'auto' | 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline'
  order?: number

  // === 布局 (Grid) ===
  gridTemplateColumns?: string
  gridTemplateRows?: string
  gridColumn?: string
  gridRow?: string

  // === 间距 ===
  margin?: number | string
  marginTop?: number | string
  marginRight?: number | string
  marginBottom?: number | string
  marginLeft?: number | string
  padding?: number | string
  paddingTop?: number | string
  paddingRight?: number | string
  paddingBottom?: number | string
  paddingLeft?: number | string

  // === 视觉 ===
  color?: string
  backgroundColor?: string
  backgroundImage?: string
  backgroundSize?: string
  backgroundPosition?: string
  backgroundRepeat?: string
  opacity?: number
  visibility?: 'visible' | 'hidden'
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto'
  overflowX?: 'visible' | 'hidden' | 'scroll' | 'auto'
  overflowY?: 'visible' | 'hidden' | 'scroll' | 'auto'

  // === 边框 ===
  border?: string
  borderWidth?: number | string
  borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted'
  borderColor?: string
  borderRadius?: number | string
  borderTop?: string
  borderRight?: string
  borderBottom?: string
  borderLeft?: string

  // === 阴影 ===
  boxShadow?: string
  textShadow?: string

  // === 文字 ===
  fontSize?: number | string
  fontWeight?: number | string
  fontFamily?: string
  fontStyle?: 'normal' | 'italic' | 'oblique'
  lineHeight?: number | string
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  textDecoration?: string
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  letterSpacing?: number | string
  whiteSpace?: 'normal' | 'nowrap' | 'pre' | 'pre-wrap' | 'pre-line'
  wordBreak?: 'normal' | 'break-all' | 'keep-all' | 'break-word'

  // === 交互 ===
  cursor?: string
  pointerEvents?: 'auto' | 'none'
  userSelect?: 'auto' | 'none' | 'text' | 'all'

  // === 过渡 ===
  transition?: string

  // === 扩展 ===
  [key: string]: unknown
}

// ============================================================================
// 节点协议 (框架无关)
// ============================================================================

/**
 * 节点协议 - 框架无关的组件实例描述
 *
 * 设计原则：
 * 1. 框架无关：不使用 Vue/React 特有术语
 * 2. 声明式：描述"是什么"而非"怎么做"
 * 3. 可转换：能被 Generator 转换为任意框架代码
 *
 * @example
 * // 一个按钮组件
 * {
 *   id: 'btn_1',
 *   component: 'Button',
 *   props: {
 *     label: { $expr: 'state.buttonText' },
 *     disabled: false
 *   },
 *   renderIf: { $expr: 'state.showButton' },
 *   events: {
 *     click: [{ type: 'updateState', payload: { count: { $expr: 'state.count + 1' } } }]
 *   }
 * }
 */
export interface NodeSchema<P = Record<string, PropValue>> {
  /** 节点唯一标识 */
  id: string

  /**
   * 组件标识
   * 映射到物料注册表中的组件
   */
  component: string

  /** 节点显示名称 (编辑器中显示) */
  title?: string

  // ========== 属性 ==========
  /**
   * 组件属性
   * 支持字面量或表达式绑定
   */
  props?: P

  // ========== 样式 ==========
  /** 节点样式 */
  style?: NodeStyle

  // ========== 子节点 ==========
  /** 子节点列表 */
  children?: NodeSchema[]

  // ========== 局部状态 ==========
  /**
   * 组件局部状态
   * 用于不需要共享的内部 UI 状态
   */
  state?: VariableSchema[]

  // ========== 渲染控制 ==========
  /**
   * 条件渲染
   * 当表达式为 falsy 时不渲染该节点
   *
   * Vue: v-if
   * React: {condition && <Component />}
   */
  renderIf?: Expression

  /**
   * 列表渲染
   * 根据数据源重复渲染该节点
   *
   * Vue: v-for
   * React: array.map()
   */
  repeat?: RepeatConfig

  // ========== 事件 ==========
  /**
   * 事件绑定
   * key 为事件名 (click, change, input 等)
   * value 为触发的动作列表
   */
  events?: Record<string, ActionSchema[]>

  // ========== 插槽 ==========
  /**
   * 所属插槽名称
   * 指定该节点渲染到父组件的哪个插槽
   */
  slot?: string

  /**
   * 作用域插槽参数名
   * 接收父组件传递的插槽数据
   */
  slotProps?: string

  // ========== 动画 ==========
  /** 动画配置 */
  animation?: AnimationConfig

  // ========== 引用 ==========
  /**
   * 组件引用名
   * 用于在代码中获取组件实例
   *
   * Vue: ref="xxx"
   * React: useRef()
   */
  ref?: string
}

// ============================================================================
// 兼容导出 (向后兼容)
// ============================================================================

/**
 * 布局模式
 * @deprecated 布局应通过 style.display 控制，此类型仅用于兼容
 */
export type LayoutMode = 'free' | 'flex' | 'grid' | 'flow'

/**
 * 数据绑定配置
 * @deprecated 使用表达式绑定替代组件间直接绑定
 */
export interface DataBinding {
  sourceId: string
  sourcePath: string
  targetPath: string
  transformer?: string
  transformerType?: 'expression' | 'template'
}

/**
 * 数据源配置
 * @deprecated 数据获取应在页面级 apis 中定义
 */
export interface DataSourceConfig {
  enabled?: boolean
  url?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  body?: string
  interval?: number
  dataPath?: string
}
