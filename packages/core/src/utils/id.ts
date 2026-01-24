/**
 * 自研高性能 ID 生成器 (替换 nanoid)
 *
 * 设计目标：
 * 1. 零外部依赖
 * 2. 生成速度快 (Math.random)
 * 3. 包含时间戳信息 (大致有序，利于排序和调试)
 * 4. URL 安全
 */

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

/**
 * 生成唯一 ID
 * 格式: [prefix]_[timestamp(base36)][random(6)]
 * 示例: btn_lfc2q9z5x9a2
 */
export function generateId(prefix?: string): string {
  // 1. 时间戳部分 (Base36)
  // Date.now() 约 13 位数字，转 Base36 约 8 位字符
  // 足以保证毫秒级的时间顺序
  const timestamp = Date.now().toString(36)

  // 2. 随机部分 (6字符)
  // 62^6 = 568亿组合，配合时间戳，单机冲突概率极低
  let random = ''
  for (let i = 0; i < 6; i++) {
    // 使用位运算取整比 Math.floor 略快
    random += ALPHABET[(Math.random() * 62) | 0]
  }

  const id = `${timestamp}${random}`

  if (prefix) {
    // 简单的清洗，只保留字母数字
    const cleanPrefix = prefix.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
    return `${cleanPrefix}_${id}`
  }

  return id
}

/**
 * 生成简短 ID (用于某些对长度敏感的场景，如 CSS Class)
 * 长度: 8 字符纯随机
 */
export function generateShortId(): string {
  let id = ''
  for (let i = 0; i < 8; i++) {
    id += ALPHABET[(Math.random() * 62) | 0]
  }
  return id
}
