/**
 * 生成唯一的组件ID
 * @param componentName 组件名称
 * @returns 唯一ID，格式：{componentName}_{timestamp}_{random}
 */
import { customAlphabet } from 'nanoid'

// 使用 URL 安全的字符集，移除易混淆字符 (l, 1, I, O, 0)
const nanoid = customAlphabet('abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8)

/**
 * 生成语义化的唯一组件 ID
 *
 * @param prefix 组件前缀 (如 'btn', 'table')，建议不超过 10 字符
 * @returns 格式: {prefix}_{8位随机码} (例如: btn_x9d2k3m1)
 */
export function generateId(prefix: string = 'node'): string {
  // 过滤前缀中的非字母数字字符，保持 ID 纯净
  const cleanPrefix = prefix.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
  return `${cleanPrefix}_${nanoid()}`
}
