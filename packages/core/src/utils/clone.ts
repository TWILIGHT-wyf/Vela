import { NodeSchema } from '../types/schema'
import { generateId } from './id'

export interface CloneOptions {
  generateNewId?: boolean
  idGenerator?: () => string
}

/**
 * 深度克隆 (使用原生 structuredClone，带错误降级)
 * structuredClone 不支持: 函数、DOM 节点、Symbol、WeakMap/WeakSet 等
 */
export function deepClone<T>(val: T): T {
  // 1. 处理基本类型和 null/undefined
  if (val === null || val === undefined) return val
  if (typeof val !== 'object') return val

  // 2. 尝试使用 structuredClone（最高效）
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(val)
    } catch {
      // structuredClone 失败（如对象包含函数），使用 JSON 降级
    }
  }

  // 3. JSON 降级方案（不支持函数、循环引用等）
  try {
    return JSON.parse(JSON.stringify(val))
  } catch {
    // JSON 也失败（如循环引用），使用手动浅克隆
    console.warn('[deepClone] Failed to clone object, returning shallow copy')
    if (Array.isArray(val)) {
      return [...val] as T
    }
    return { ...val }
  }
}

/**
 * 智能复制节点
 */
export function cloneNode(node: NodeSchema, options: CloneOptions = {}): NodeSchema {
  const { generateNewId = true, idGenerator = () => generateId() } = options

  const clone = deepClone(node)

  if (generateNewId) {
    regenerateIds(clone, idGenerator)
  }

  return clone
}

function regenerateIds(node: NodeSchema, genId: () => string) {
  node.id = genId()
  if (node.children) {
    node.children.forEach((child) => regenerateIds(child, genId))
  }
}
