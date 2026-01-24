/**
 * 解析路径部分，支持数组索引
 * 'children.0.props' -> ['children', '0', 'props']
 * 'items[0].name' -> ['items', '0', 'name']
 */
function parsePath(path: string): string[] {
  // 支持 dot notation 和 bracket notation
  // 'a.b.c' -> ['a', 'b', 'c']
  // 'a[0].b' -> ['a', '0', 'b']
  // 'a.0.b' -> ['a', '0', 'b']
  return path
    .replace(/\[(\d+)\]/g, '.$1') // 将 [0] 转换为 .0
    .split('.')
    .filter(Boolean)
}

/**
 * 路径解析辅助函数
 * 支持数组索引访问：'children.0.props' 或 'children[0].props'
 */
export function getValueByPath(obj: unknown, path: string): unknown {
  if (obj === null || obj === undefined || !path) return undefined

  const parts = parsePath(path)
  let current: unknown = obj

  for (const part of parts) {
    if (current === null || current === undefined) return undefined

    if (Array.isArray(current)) {
      const index = parseInt(part, 10)
      if (isNaN(index)) return undefined
      current = current[index]
    } else if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[part]
    } else {
      return undefined
    }
  }

  return current
}

/**
 * 按路径设置值
 * 会自动创建路径上缺失的对象/数组
 * 支持数组索引：'children.0.props' 或 'children[0].props'
 */
export function setValueByPath(obj: unknown, path: string, value: unknown): void {
  if (obj === null || obj === undefined || !path) return

  const parts = parsePath(path)
  const last = parts.pop()
  if (!last) return

  let current: unknown = obj

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    if (current === null || current === undefined) return

    const nextPart = parts[i + 1] || last
    const nextIsArrayIndex = /^\d+$/.test(nextPart)

    if (Array.isArray(current)) {
      const index = parseInt(part, 10)
      if (isNaN(index)) return
      if (current[index] === undefined) {
        current[index] = nextIsArrayIndex ? [] : {}
      }
      current = current[index]
    } else if (typeof current === 'object') {
      const record = current as Record<string, unknown>
      if (record[part] === undefined) {
        record[part] = nextIsArrayIndex ? [] : {}
      }
      current = record[part]
    } else {
      return
    }
  }

  if (current !== null && current !== undefined && typeof current === 'object') {
    if (Array.isArray(current)) {
      const index = parseInt(last, 10)
      if (!isNaN(index)) {
        current[index] = value
      }
    } else {
      ;(current as Record<string, unknown>)[last] = value
    }
  }
}
