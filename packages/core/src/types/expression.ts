// ============================================================================
// 表达式类型定义 (框架无关)
// ============================================================================

/**
 * 表达式类型
 * - expression: 取值或计算表达式，如 state.count + 1
 * - template: 模板字符串，如 Hello, ${state.name}
 * - function: 函数体，如 (item) => item.id
 */
export type ExpressionType = 'expression' | 'template' | 'function'

/**
 * 表达式返回值类型
 */
export type ExpressionReturnType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'object'
  | 'void'
  | 'any'

/**
 * 表达式定义
 * 框架无关的动态值描述，由 Generator 转换为框架特定语法
 *
 * @example
 * // 取值表达式
 * { type: 'expression', value: 'state.user.name' }
 *
 * // 计算表达式
 * { type: 'expression', value: 'state.count + 1', mock: 0 }
 *
 * // 模板字符串
 * { type: 'template', value: 'Hello, ${state.name}', mock: 'Hello, World' }
 *
 * // 函数表达式
 * { type: 'function', value: '(item) => item.id' }
 */
export interface Expression {
  /** 表达式类型 */
  type: ExpressionType
  /** 表达式内容 */
  value: string
  /** 模拟值 (编辑器预览用) */
  mock?: unknown
  /** 预期返回类型 (代码生成提示) */
  returnType?: ExpressionReturnType
}

/**
 * 允许直接传入表达式字符串 (兼容旧数据)
 */
export type ExpressionInput = Expression | string

/**
 * 值或表达式
 */
export type ValueOrExpression<T> = T | Expression

// ============================================================================
// 属性值类型
// ============================================================================

/**
 * 属性值类型
 * 支持静态值和动态表达式
 */
export type PropValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Expression
  | PropValue[]
  | { [key: string]: PropValue }

/**
 * 可持久化的属性值 (排除 undefined)
 */
export type PersistedPropValue = Exclude<PropValue, undefined>

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 创建取值/计算表达式
 * @param value 表达式字符串
 * @param mock 模拟值 (编辑器预览用)
 */
export function expr(value: string, mock?: unknown): Expression {
  return { type: 'expression', value, mock }
}

/**
 * 创建模板字符串表达式
 * @param value 模板字符串
 * @param mock 模拟值 (编辑器预览用)
 */
export function template(value: string, mock?: unknown): Expression {
  return { type: 'template', value, mock }
}

/**
 * 创建函数表达式
 * @param value 函数体
 */
export function fn(value: string): Expression {
  return { type: 'function', value }
}

/**
 * 标准化 ExpressionInput
 * - string -> expression 类型
 * - Expression -> 原样返回
 */
export function normalizeExpressionInput(input: ExpressionInput): Expression {
  if (typeof input === 'string') {
    return expr(input)
  }
  return input
}

/**
 * 判断是否为表达式
 */
export function isExpression(value: unknown): value is Expression {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'value' in value &&
    ['expression', 'template', 'function'].includes((value as Expression).type)
  )
}

/**
 * 将 PropValue 转换为可持久化的值
 * - undefined → null
 * - 递归处理对象和数组
 */
export function toPersisted(value: PropValue): PersistedPropValue {
  if (value === undefined) return null
  if (value === null) return null
  if (Array.isArray(value)) {
    return value.map(toPersisted) as PersistedPropValue[]
  }
  if (typeof value === 'object' && !isExpression(value)) {
    const result: Record<string, PersistedPropValue> = {}
    for (const [k, v] of Object.entries(value as Record<string, PropValue>)) {
      result[k] = toPersisted(v)
    }
    return result
  }
  return value as PersistedPropValue
}

// ============================================================================
// 兼容旧版本
// ============================================================================

/**
 * @deprecated Use Expression instead
 */
export interface JSExpression {
  type: 'JSExpression'
  value: string
}

/**
 * 判断是否为旧版 JSExpression
 * @deprecated
 */
export function isJSExpression(value: unknown): value is JSExpression {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    (value as JSExpression).type === 'JSExpression'
  )
}

/**
 * 将旧版 JSExpression 转换为新版 Expression
 */
export function migrateJSExpression(old: JSExpression): Expression {
  return {
    type: 'expression',
    value: old.value,
  }
}
