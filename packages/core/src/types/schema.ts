import { PropValue, JSExpression } from './expression'
import { ActionSchema } from './action'

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
 *
 * 设计原则：
 * - 位置使用数值 (x, y)，不带单位
 * - 尺寸使用数值 (width, height)，不带单位
 * - 旋转使用数值 (rotate)，单位为度
 * - 其他 CSS 属性保持字符串格式
 *
 * 兼容性：
 * - 同时支持旧格式 (left/top 带 px) 和新格式 (x/y 数值)
 * - ShapeWrapper 会自动处理两种格式
 */
export interface NodeStyle {
  // 位置（推荐使用数值）
  x?: number
  y?: number
  // 兼容旧格式
  /** @deprecated Use 'x' instead */
  left?: string
  /** @deprecated Use 'y' instead */
  top?: string

  // 尺寸（推荐使用数值）
  width?: number | string
  height?: number | string

  // 变换
  rotate?: number
  transform?: string

  // 层级
  zIndex?: number

  // 锁定状态
  locked?: boolean

  // 常用文本属性
  color?: string
  fontSize?: string | number
  fontWeight?: string | number
  fontFamily?: string
  textAlign?: string
  lineHeight?: string | number

  // 其他 CSS 属性
  position?: string
  backgroundColor?: string
  borderRadius?: string | number
  opacity?: number
  overflow?: string
  boxShadow?: string
  border?: string

  // 允许任意其他属性
  [key: string]: unknown
}

/**
 * 核心节点协议：描述页面上的一个组件实例
 * V1.5 架构：递归树形结构
 */
export interface NodeSchema<P = Record<string, PropValue>> {
  id: string
  componentName: string // 对应 MaterialMeta.componentName
  props?: P
  style?: NodeStyle

  // 数据源配置
  dataSource?: DataSourceConfig

  /**
   * 核心变更：递归子节点
   * 只有容器组件该字段才有效
   */
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
