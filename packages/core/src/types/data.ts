import { JSExpression } from './expression'

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
