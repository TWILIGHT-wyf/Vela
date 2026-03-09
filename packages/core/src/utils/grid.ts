/**
 * 自适应网格 fr 模板工具函数
 * 纯函数，无 Vue 依赖
 */

import type { GridTrack } from '../types/layout'

// ─── 轨道 token 解析 ────────────────────────────────────────────────

/**
 * 将模板字符串拆分为独立轨道 token，正确处理 minmax()/repeat() 括号。
 *
 *   'repeat(3, 1fr) 200px auto minmax(100px, 1fr)'
 *   → ['repeat(3, 1fr)', '200px', 'auto', 'minmax(100px, 1fr)']
 */
export function splitTrackTokens(template: string): string[] {
  if (!template || !template.trim()) return []
  const tokens: string[] = []
  let depth = 0
  let current = ''
  for (const ch of template.trim()) {
    if (ch === '(') {
      depth++
      current += ch
    } else if (ch === ')') {
      depth = Math.max(0, depth - 1)
      current += ch
    } else if (/\s/.test(ch) && depth === 0) {
      if (current.length > 0) {
        tokens.push(current)
        current = ''
      }
    } else {
      current += ch
    }
  }
  if (current.length > 0) tokens.push(current)
  return tokens
}

/**
 * 将单个轨道 token 解析为 GridTrack
 *
 * 支持格式:
 *   - '1fr', '2.5fr'    → { unit: 'fr', value: 2.5 }
 *   - '200px'           → { unit: 'px', value: 200 }
 *   - 'auto'            → { unit: 'auto' }
 *   - 'minmax(100px, 1fr)' → { unit: 'minmax', min: 100, max: 'auto' }
 *   - 'repeat(3, 1fr)'  → 展开为 3 条 { unit: 'fr', value: 1 }（由 parseTrackTemplate 处理）
 */
export function parseTrackToken(token: string): GridTrack {
  const trimmed = token.trim()

  // fr
  const frMatch = trimmed.match(/^([\d.]+)fr$/)
  if (frMatch) return { unit: 'fr', value: parseFloat(frMatch[1]) || 1 }

  // px
  const pxMatch = trimmed.match(/^([\d.]+)px$/)
  if (pxMatch) return { unit: 'px', value: parseFloat(pxMatch[1]) || 0 }

  // auto
  if (trimmed === 'auto') return { unit: 'auto' }

  // minmax(min, max)
  const minmaxMatch = trimmed.match(/^minmax\(\s*(.+?)\s*,\s*(.+?)\s*\)$/)
  if (minmaxMatch) {
    const parseMinMax = (val: string): number | 'auto' => {
      if (val === 'auto') return 'auto'
      const n = parseFloat(val)
      return Number.isFinite(n) ? n : 'auto'
    }
    return { unit: 'minmax', min: parseMinMax(minmaxMatch[1]), max: parseMinMax(minmaxMatch[2]) }
  }

  // fallback: 尝试作为纯数字 → px，否则 → 1fr
  const num = parseFloat(trimmed)
  if (Number.isFinite(num)) return { unit: 'px', value: num }
  return { unit: 'fr', value: 1 }
}

/**
 * 解析完整模板字符串为 GridTrack[] — 支持 repeat() 展开
 *
 *   'repeat(3, 1fr) 200px auto' → 5 条 track
 */
export function parseTrackTemplate(template: string): GridTrack[] {
  if (!template || !template.trim()) return [{ unit: 'fr', value: 1 }]

  const tokens = splitTrackTokens(template)
  const tracks: GridTrack[] = []

  for (const token of tokens) {
    // repeat(N, track)
    const repeatMatch = token.match(/^repeat\(\s*(\d+)\s*,\s*(.+?)\s*\)$/)
    if (repeatMatch) {
      const count = Math.max(1, Math.min(48, parseInt(repeatMatch[1], 10)))
      const inner = parseTrackToken(repeatMatch[2])
      for (let i = 0; i < count; i++) tracks.push({ ...inner })
      continue
    }
    // repeat(auto-fit/auto-fill, ...) → 算作 1 条 minmax track
    const autoRepeatMatch = token.match(/^repeat\(\s*auto-(?:fit|fill)\s*,\s*(.+?)\s*\)$/)
    if (autoRepeatMatch) {
      tracks.push(parseTrackToken(autoRepeatMatch[1]))
      continue
    }
    tracks.push(parseTrackToken(token))
  }

  return tracks.length ? tracks : [{ unit: 'fr', value: 1 }]
}

// ─── 传统 fr-only API（保持向后兼容）──────────────────────────────

/**
 * 解析 fr 模板字符串为数值数组（仅提取 fr 值）
 * '1fr 2fr 1fr' → [1, 2, 1]
 *
 * 注意：非 fr 单位（auto, px 等）会被当作 1fr 处理。
 * 需要完整轨道信息请使用 `parseTrackTemplate`。
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
 * 将 GridTrack 数组序列化为 CSS grid-template 字符串
 *
 *   [{ unit: 'fr', value: 1 }, { unit: 'px', value: 200 }]
 *   → '1fr 200px'
 */
export function buildTrackTemplate(tracks: GridTrack[]): string {
  if (!tracks.length) return '1fr'
  return tracks
    .map((t) => {
      switch (t.unit) {
        case 'fr':
          return `${Math.round(Math.max(0.1, t.value ?? 1) * 100) / 100}fr`
        case 'px':
          return `${Math.round(t.value ?? 0)}px`
        case 'auto':
          return 'auto'
        case 'minmax': {
          const fmtVal = (v: number | 'auto' | undefined) =>
            v === 'auto' || v === undefined ? 'auto' : `${v}px`
          return `minmax(${fmtVal(t.min)}, ${fmtVal(t.max)})`
        }
        default:
          return '1fr'
      }
    })
    .join(' ')
}

/**
 * 获取轨道数量 — 同时支持 fr-only 和混合模板
 */
export function countTracks(template: string): number {
  // 快速路径：如果不含括号，按空格分割
  if (!template.includes('(')) {
    return parseFrTemplate(template).length
  }
  return splitTrackTokens(template).length
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
