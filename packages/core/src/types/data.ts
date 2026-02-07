import type { Expression, ExpressionInput } from './expression'
import type { ActionCallbackRef } from './action'

// 重新导出表达式相关类型
export type { Expression, ExpressionInput, ExpressionReturnType, PropValue, ExpressionType } from './expression'
export { expr, template, fn, isExpression, normalizeExpressionInput } from './expression'

/**
 * @deprecated Use Expression instead
 * Kept for backward compatibility with generator package
 */
export type { JSExpression } from './expression'
export { isJSExpression, migrateJSExpression } from './expression'

// ============================================================================
// 变量类型
// ============================================================================

/**
 * 基础变量类型
 */
export type VariableBaseType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any'

/**
 * 原始变量类型
 */
export type VariablePrimitiveType = Exclude<VariableBaseType, 'object' | 'array'>

/**
 * 变量来源
 */
export type VariableSource =
  | 'manual'    // 手动定义
  | 'api'       // API 响应派生
  | 'computed'  // 计算属性
  | 'route'     // 路由参数
  | 'storage'   // 持久化存储

// ============================================================================
// 验证规则
// ============================================================================

/**
 * 验证规则
 */
export interface ValidationRule {
  /** 是否必填 */
  required?: boolean
  /** 最小值 (number) / 最小长度 (string/array) */
  min?: number
  /** 最大值 (number) / 最大长度 (string/array) */
  max?: number
  /** 正则表达式 (string) */
  pattern?: string
  /** 枚举值列表 */
  enum?: unknown[]
  /** 自定义验证函数 */
  validator?: string
  /** 验证失败提示信息 */
  message?: string
}

// ============================================================================
// 变量定义
// ============================================================================

/**
 * 变量基础字段
 */
interface VariableSchemaBase {
  /** 变量键名 */
  key: string
  /** 默认值 */
  defaultValue?: unknown
  /** 变量说明 */
  description?: string

  // ========== 扩展配置 ==========

  /** 变量来源 */
  source?: VariableSource
  /** 变量分组 (便于管理) */
  group?: string
  /** 验证规则 */
  validation?: ValidationRule
  /** 是否持久化存储 */
  persist?: boolean
  /** 是否只读 */
  readonly?: boolean
}

/**
 * 非计算变量基础定义
 */
interface PlainVariableSchemaBase extends VariableSchemaBase {
  /** 变量来源 */
  source?: Exclude<VariableSource, 'computed'>
  /** 计算表达式仅在 computed 变量有效 */
  expression?: never
  /** 依赖仅在 computed 变量有效 */
  dependencies?: never
}

/**
 * 计算变量基础定义
 */
interface ComputedVariableSchemaBase extends VariableSchemaBase {
  /** 变量来源 */
  source: 'computed'
  /** 计算表达式 */
  expression: ExpressionInput
  /** 依赖的变量 (用于优化更新) */
  dependencies?: string[]
}

/**
 * 原始类型变量
 */
export interface PrimitiveVariableSchema extends PlainVariableSchemaBase {
  type: VariablePrimitiveType
  properties?: never
  required?: never
  items?: never
}

/**
 * 对象类型变量
 */
export interface ObjectVariableSchema extends PlainVariableSchemaBase {
  type: 'object'

  /**
   * 对象子字段 (type: 'object')
   * key 为字段名，value 为字段定义
   * 注：子字段的 key 属性应与 Record 的 key 一致
   */
  properties?: Record<string, VariableSchema>

  /** 必填字段列表 (type: 'object') */
  required?: string[]

  items?: never
}

/**
 * 数组类型变量
 */
export interface ArrayVariableSchema extends PlainVariableSchemaBase {
  type: 'array'
  properties?: never
  required?: never
  /** 数组元素结构 (type: 'array') */
  items?: VariableSchema
}

/**
 * 原始类型计算变量
 */
export interface ComputedPrimitiveVariableSchema extends ComputedVariableSchemaBase {
  type: VariablePrimitiveType
  properties?: never
  required?: never
  items?: never
}

/**
 * 对象类型计算变量
 */
export interface ComputedObjectVariableSchema extends ComputedVariableSchemaBase {
  type: 'object'
  properties?: Record<string, VariableSchema>
  required?: string[]
  items?: never
}

/**
 * 数组类型计算变量
 */
export interface ComputedArrayVariableSchema extends ComputedVariableSchemaBase {
  type: 'array'
  properties?: never
  required?: never
  items?: VariableSchema
}

/**
 * 计算变量定义
 */
export type ComputedVariableSchema =
  | ComputedPrimitiveVariableSchema
  | ComputedObjectVariableSchema
  | ComputedArrayVariableSchema

/**
 * 变量定义 (判别联合)
 */
export type VariableSchema =
  | PrimitiveVariableSchema
  | ObjectVariableSchema
  | ArrayVariableSchema
  | ComputedVariableSchema

// ============================================================================
// API 请求配置
// ============================================================================

/**
 * HTTP 请求方法
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'

/**
 * 请求体类型
 */
export type ContentType = 'json' | 'form' | 'formdata' | 'raw' | 'none'

/**
 * 缓存策略
 */
export type ApiCacheStrategy = 'memory' | 'session' | 'persistent'

/**
 * 重试退避策略
 */
export type RetryBackoff = 'fixed' | 'exponential' | 'linear'

// ============================================================================
// API 子配置
// ============================================================================

/**
 * 轮询配置
 */
export interface ApiPollingConfig {
  /** 是否启用轮询 */
  enabled: boolean
  /** 轮询间隔 (ms) */
  interval: number
  /** 遇到错误时停止轮询 */
  stopOnError?: boolean
  /** 最大轮询次数 (0 表示无限) */
  maxCount?: number
}

/**
 * 缓存配置
 */
export interface ApiCacheConfig {
  /** 是否启用缓存 */
  enabled: boolean
  /** 缓存过期时间 (秒) */
  ttl?: number
  /** 缓存策略 */
  strategy?: ApiCacheStrategy
  /** 缓存键 (默认使用 url + params) */
  cacheKey?: string
}

/**
 * 重试配置
 */
export interface ApiRetryConfig {
  /** 重试次数 */
  count: number
  /** 重试延迟 (ms) */
  delay?: number
  /** 退避策略 */
  backoff?: RetryBackoff
  /** 仅对特定状态码重试 */
  statusCodes?: number[]
}

/**
 * Mock 配置 (开发环境)
 */
export interface ApiMockConfig {
  /** 是否启用 Mock */
  enabled: boolean
  /** Mock 数据 */
  data?: unknown
  /** 模拟延迟 (ms) */
  delay?: number
  /** Mock 数据生成函数 */
  handler?: string
}

/**
 * 状态绑定配置
 */
export interface ApiStateBinding {
  /** 响应数据绑定路径 (如 'users' 将响应存入 state.users) */
  dataPath?: string
  /** Loading 状态绑定路径 */
  loadingPath?: string
  /** Error 状态绑定路径 */
  errorPath?: string
  /** 响应数据转换器 (从响应中提取数据) */
  dataExtractor?: string
}

// ============================================================================
// API 定义
// ============================================================================

/**
 * API 定义
 */
export interface ApiSchema {
  /** API 唯一标识 */
  id: string
  /** API 名称 */
  name: string
  /** API 说明 */
  description?: string
  /** API 分组 */
  group?: string

  // ========== 请求配置 ==========

  /** 请求 URL (支持表达式) */
  url: string | Expression
  /** 请求方法 */
  method: HttpMethod
  /** 请求体类型 */
  contentType?: ContentType
  /** 请求头 */
  headers?: Record<string, string | Expression>
  /** URL 查询参数 */
  params?: Record<string, unknown | Expression>
  /** 请求体数据 */
  body?: Record<string, unknown | Expression> | string | Expression
  /** 请求超时 (ms) */
  timeout?: number
  /** 是否携带凭证 */
  withCredentials?: boolean

  // ========== 状态绑定 ==========

  /** 状态绑定配置 */
  stateBinding?: ApiStateBinding

  // ========== 自动加载 ==========

  /**
   * 自动加载
   * true: 页面加载时自动请求
   * false: 需要手动调用动作触发
   */
  autoLoad?: boolean

  /**
   * 自动加载依赖
   * 当这些状态变化时重新请求
   */
  dependencies?: string[]

  // ========== 高级配置 ==========

  /** 轮询配置 */
  polling?: ApiPollingConfig

  /** 缓存配置 */
  cache?: ApiCacheConfig

  /** 重试配置 */
  retry?: ApiRetryConfig

  /** Mock 配置 (开发环境) */
  mock?: ApiMockConfig

  // ========== 响应处理 ==========

  /** 响应数据处理函数 */
  dataHandler?: string

  /** 成功回调 (支持单个动作或动作列表) */
  onSuccess?: ActionCallbackRef

  /** 失败回调 (支持单个动作或动作列表) */
  onError?: ActionCallbackRef

  /** 请求完成回调 (无论成功失败，支持单个动作或动作列表) */
  onComplete?: ActionCallbackRef
}

// ============================================================================
// 工厂函数
// ============================================================================

/**
 * 创建变量定义
 */
export function createVariable(
  key: string,
  type: VariableBaseType,
  defaultValue?: unknown
): VariableSchema {
  return { key, type, defaultValue, source: 'manual' }
}

/**
 * 创建计算属性
 */
export function createComputed(
  key: string,
  expression: ExpressionInput,
  dependencies?: string[],
  type: VariableBaseType = 'any'
): ComputedVariableSchema {
  return {
    key,
    type,
    source: 'computed',
    expression,
    dependencies,
  }
}

/**
 * 判断是否为计算变量
 */
export function isComputedVariable(variable: VariableSchema): variable is ComputedVariableSchema {
  return variable.source === 'computed'
}

/**
 * 判断是否为对象变量
 */
export function isObjectVariable(
  variable: VariableSchema
): variable is ObjectVariableSchema | ComputedObjectVariableSchema {
  return variable.type === 'object'
}

/**
 * 判断是否为数组变量
 */
export function isArrayVariable(
  variable: VariableSchema
): variable is ArrayVariableSchema | ComputedArrayVariableSchema {
  return variable.type === 'array'
}

/**
 * 创建 API 定义
 */
export function createApi(
  id: string,
  name: string,
  url: string,
  method: HttpMethod = 'GET'
): ApiSchema {
  return { id, name, url, method }
}
