import { JSExpression } from './expression'
import { NodeSchema } from './schema'

export type { JSExpression } from './expression'
export type { PropValue } from './expression'

/**
 * 变量类型定义
 */
export interface VariableSchema {
  key: string // 变量名，如 "userInfo"
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  defaultValue?: any
  description?: string
}

/**
 * 数据源定义 (API)
 */
export interface ApiSchema {
  id: string
  name: string
  url: string // 支持表达式
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string | JSExpression>
  params?: Record<string, string | JSExpression>
  data?: Record<string, unknown | JSExpression>

  /**
   * 自动加载
   * true: 页面加载时自动请求
   * false: 需要手动调用动作触发
   */
  autoLoad?: boolean

  /** 数据处理函数 (过滤器) */
  dataHandler?: string // "(res) => res.data.list"

  /** 成功回调动作ID */
  onSuccess?: string

  /** 失败回调动作ID */
  onError?: string
}

/**
 * 页面配置接口
 */
export interface PageConfig {
  /** 页面布局模式: 'free' 自由布局(绝对定位) | 'flow' 流式布局(文档流) */
  layout: 'free' | 'flow'
  theme?: string
  [key: string]: unknown
}

/**
 * 页面全局配置 (完整定义)
 */
export interface PageSchema {
  id: string
  name: string // 页面名称
  path?: string // 路由路径
  title?: string // 页面标题

  /** 页面配置 */
  config?: PageConfig

  /** 页面根节点 (通常是一个名为 'Page' 的容器) */
  children: NodeSchema

  /** ================= Data Protocol ================= */

  // 全局变量
  state: VariableSchema[]

  // API 数据源
  apis: ApiSchema[]

  // 页面生命周期
  lifecycle?: {
    onLoad?: string // Action ID
    onUnload?: string // Action ID
  }
}
