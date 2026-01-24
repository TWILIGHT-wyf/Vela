/**
 * 安全序列化器
 * 解决 JSON.stringify 不支持的类型 (Date, RegExp, Map, Set, Error)
 * 以及特殊结构 JSExpression 的处理
 * 支持循环引用检测
 */

// 序列化后的特殊对象标记
interface SerializedValue {
  __type: 'Date' | 'RegExp' | 'Map' | 'Set' | 'Error' | 'CircularRef'
  value: unknown
}

// 循环引用标记
const CIRCULAR_REF_MARKER = '__type'

/**
 * 序列化 (Object -> JSON-safe Object)
 * @param data 要序列化的数据
 * @param seen 已访问对象集合（用于检测循环引用）
 */
export function serialize<T>(data: T, seen = new WeakSet<object>()): unknown {
  if (data === null || data === undefined) return data

  if (typeof data !== 'object') return data

  // 循环引用检测
  if (seen.has(data as object)) {
    console.warn('[Serializer] Circular reference detected, replacing with null')
    return { __type: 'CircularRef', value: null } as SerializedValue
  }

  // 将当前对象加入已访问集合
  seen.add(data as object)

  try {
    if (data instanceof Date) {
      return { __type: 'Date', value: data.toISOString() } as SerializedValue
    }

    if (data instanceof RegExp) {
      return {
        __type: 'RegExp',
        value: { source: data.source, flags: data.flags },
      } as SerializedValue
    }

    if (data instanceof Map) {
      const entries = Array.from(data.entries()).map(([k, v]) => [
        serialize(k, seen),
        serialize(v, seen),
      ])
      return { __type: 'Map', value: entries } as SerializedValue
    }

    if (data instanceof Set) {
      const values = Array.from(data.values()).map((v) => serialize(v, seen))
      return { __type: 'Set', value: values } as SerializedValue
    }

    if (data instanceof Error) {
      return {
        __type: 'Error',
        value: { message: data.message, stack: data.stack },
      } as SerializedValue
    }

    if (Array.isArray(data)) {
      return data.map((item) => serialize(item, seen))
    }

    // 普通对象递归
    const result: Record<string, unknown> = {}
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = serialize((data as Record<string, unknown>)[key], seen)
      }
    }
    return result
  } finally {
    // 处理完后从集合中移除（允许同一对象在不同分支出现）
    seen.delete(data as object)
  }
}

/**
 * 反序列化 (JSON-safe Object -> Object)
 */
export function deserialize<T>(data: unknown): T {
  if (data === null || data === undefined) return data as T

  if (typeof data !== 'object') return data as T

  const obj = data as Record<string, unknown>

  if (CIRCULAR_REF_MARKER in obj && 'value' in obj) {
    const sv = obj as unknown as SerializedValue
    switch (sv.__type) {
      case 'Date':
        return new Date(sv.value as string) as T
      case 'RegExp': {
        const regVal = sv.value as { source: string; flags: string }
        return new RegExp(regVal.source, regVal.flags) as T
      }
      case 'Map': {
        const mapVal = sv.value as [unknown, unknown][]
        return new Map(mapVal.map(([k, v]) => [deserialize(k), deserialize(v)])) as T
      }
      case 'Set': {
        const setVal = sv.value as unknown[]
        return new Set(setVal.map((v) => deserialize(v))) as T
      }
      case 'Error': {
        const errVal = sv.value as { message: string; stack?: string }
        const err = new Error(errVal.message)
        err.stack = errVal.stack
        return err as T
      }
      case 'CircularRef':
        return null as T
    }
  }

  if (Array.isArray(data)) {
    return data.map((item) => deserialize(item)) as T
  }

  const result: Record<string, unknown> = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = deserialize(obj[key])
    }
  }
  return result as T
}

/**
 * JSON Stringify 包装器 (带序列化和循环引用检测)
 */
export function stringify(data: unknown, space?: number): string {
  return JSON.stringify(serialize(data), null, space)
}

/**
 * JSON Parse 包装器 (带反序列化)
 */
export function parse<T>(json: string): T {
  return deserialize(JSON.parse(json))
}
