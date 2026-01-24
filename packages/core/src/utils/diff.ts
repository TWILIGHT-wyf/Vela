import { UpdateOp } from '../types/operation'
import { generateId } from './id'

/**
 * 比较两个值是否相等 (深度比较)
 */
export function isEqual(a: any, b: any): boolean {
  if (a === b) return true

  if (a && b && typeof a === 'object' && typeof b === 'object') {
    if (a.constructor !== b.constructor) return false

    if (a instanceof Date) {
      return a.getTime() === (b as Date).getTime()
    }

    if (Array.isArray(a)) {
      if (a.length !== b.length) return false
      for (let i = 0; i < a.length; i++) {
        if (!isEqual(a[i], b[i])) return false
      }
      return true
    }

    const keysA = Object.keys(a)
    const keysB = Object.keys(b)

    if (keysA.length !== keysB.length) return false

    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false
      if (!isEqual(a[key], b[key])) return false
    }

    return true
  }

  return a !== a && b !== b // NaN check
}

/**
 * 计算两个对象的差异，返回一组 UpdateOps
 * @param original 旧对象
 * @param modified 新对象
 * @param nodeId 关联的节点ID
 * @param basePath 基础路径
 */
export function diff(
  original: Record<string, any>,
  modified: Record<string, any>,
  nodeId: string,
  basePath: string = 'props',
): UpdateOp[] {
  const ops: UpdateOp[] = []

  const keys = new Set([...Object.keys(original), ...Object.keys(modified)])

  keys.forEach((key) => {
    const path = `${basePath}.${key}`
    const valA = original[key]
    const valB = modified[key]

    if (isEqual(valA, valB)) return

    // 如果是对象且不是数组，递归 Diff
    if (
      valA &&
      valB &&
      typeof valA === 'object' &&
      typeof valB === 'object' &&
      !Array.isArray(valA) &&
      !Array.isArray(valB) &&
      !(valA instanceof Date)
    ) {
      ops.push(...diff(valA, valB, nodeId, path))
    } else {
      // 否则直接生成 Update 操作
      ops.push({
        id: generateId(),
        type: 'update',
        timestamp: Date.now(),
        nodeId,
        path,
        value: valB,
        oldValue: valA,
      })
    }
  })

  return ops
}
