/**
 * 自适应网格 fr 模板工具函数
 * 纯函数，无 Vue 依赖
 */

/**
 * 解析 fr 模板字符串为数值数组
 * '1fr 2fr 1fr' → [1, 2, 1]
 */
export function parseFrTemplate(template: string): number[] {
  if (!template || !template.trim()) return [1]
  return template
    .trim()
    .split(/\s+/)
    .map((part) => {
      const match = part.match(/^([\d.]+)fr$/)
      return match ? parseFloat(match[1]) || 1 : 1
    })
}

/**
 * 将数值数组构建为 fr 模板字符串
 * [1, 2, 1] → '1fr 2fr 1fr'
 */
export function buildFrTemplate(values: number[]): string {
  if (!values.length) return '1fr'
  return values.map((v) => `${Math.round(Math.max(0.1, v) * 100) / 100}fr`).join(' ')
}

/**
 * 获取 fr 模板中的轨道数量
 */
export function countTracks(template: string): number {
  return parseFrTemplate(template).length
}

/**
 * 在 fr 模板末尾追加一条轨道
 */
export function addTrack(template: string, fr: number = 1): string {
  const values = parseFrTemplate(template)
  values.push(fr)
  return buildFrTemplate(values)
}

/**
 * 从 fr 模板中移除指定索引的轨道
 */
export function removeTrack(template: string, index: number): string {
  const values = parseFrTemplate(template)
  if (index < 0 || index >= values.length || values.length <= 1) return template
  values.splice(index, 1)
  return buildFrTemplate(values)
}
