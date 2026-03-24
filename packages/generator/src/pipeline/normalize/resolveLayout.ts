import type { LayoutMode, LengthValue, NodeSchema, NodeStyle } from '@vela/core'
import type { NormalizedNodeLayout } from './types'

function parseNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number') {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    if (!Number.isNaN(parsed)) {
      return parsed
    }
  }
  return fallback
}

function normalizeLengthValue(value: LengthValue | undefined): LengthValue | undefined {
  if (value === undefined) {
    return undefined
  }
  if (typeof value === 'number') {
    return value
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed) {
      return trimmed
    }
  }
  return undefined
}

function parseRotationFromTransform(style: NodeStyle | undefined): number {
  const transform = style?.transform
  if (!transform || typeof transform !== 'string') {
    return 0
  }
  const match = transform.match(/rotate\(([-\d.]+)deg\)/)
  if (!match) {
    return 0
  }
  return parseNumber(match[1], 0)
}

interface GridPlacement {
  start: number
  end: number
}

function normalizeGridPlacement(start: number, end: number): GridPlacement {
  const normalizedStart = Math.max(1, Math.round(start))
  const normalizedEnd = Math.max(normalizedStart + 1, Math.round(end))
  return {
    start: normalizedStart,
    end: normalizedEnd,
  }
}

function parseGridPlacement(value: unknown): GridPlacement | undefined {
  if (typeof value === 'number') {
    const start = Math.max(1, Math.round(value))
    return { start, end: start + 1 }
  }

  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = value.trim()
  if (!normalized) {
    return undefined
  }

  const spanMatch = normalized.match(/^span\s+(\d+)$/i)
  if (spanMatch) {
    const span = Math.max(1, Number.parseInt(spanMatch[1] || '1', 10) || 1)
    return { start: 1, end: 1 + span }
  }

  const [startRaw, endRaw] = normalized.split('/').map((segment) => segment.trim())
  if (!startRaw || !endRaw) {
    return undefined
  }

  const start = parseNumber(startRaw, Number.NaN)
  const end = parseNumber(endRaw, Number.NaN)
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return undefined
  }

  return normalizeGridPlacement(start, end)
}

export interface ResolveLayoutParams {
  node: Pick<NodeSchema, 'geometry' | 'layoutItem' | 'container' | 'style'>
  parentChildMode: LayoutMode
  pageDefaultMode: LayoutMode
}

export function resolveLayout(params: ResolveLayoutParams): NormalizedNodeLayout {
  const inheritedMode = params.parentChildMode || params.pageDefaultMode
  const nodeMode = params.node.geometry?.mode ?? inheritedMode
  const childMode = params.node.container?.mode ?? nodeMode
  const style = params.node.style
  const geometry = params.node.geometry
  const layoutItem = params.node.layoutItem

  const width = normalizeLengthValue(geometry?.width ?? style?.width)
  const height = normalizeLengthValue(geometry?.height ?? style?.height)

  const zIndex = parseNumber(style?.zIndex, 0)

  const rotate = parseRotationFromTransform(style)

  const gridColumnPlacement =
    layoutItem?.mode === 'grid'
      ? normalizeGridPlacement(
          layoutItem.placement.colStart ?? 1,
          (layoutItem.placement.colStart ?? 1) + Math.max(1, layoutItem.placement.colSpan),
        )
      : geometry?.mode === 'grid'
        ? normalizeGridPlacement(geometry.gridColumnStart, geometry.gridColumnEnd)
        : parseGridPlacement(style?.gridColumn)
  const gridRowPlacement =
    layoutItem?.mode === 'grid'
      ? normalizeGridPlacement(
          layoutItem.placement.rowStart ?? 1,
          (layoutItem.placement.rowStart ?? 1) + Math.max(1, layoutItem.placement.rowSpan),
        )
      : geometry?.mode === 'grid'
        ? normalizeGridPlacement(geometry.gridRowStart, geometry.gridRowEnd)
        : parseGridPlacement(style?.gridRow)

  return {
    mode: nodeMode,
    childMode,
    width,
    height,
    zIndex,
    rotate,
    gridColumnStart: gridColumnPlacement?.start,
    gridColumnEnd: gridColumnPlacement?.end,
    gridRowStart: gridRowPlacement?.start,
    gridRowEnd: gridRowPlacement?.end,
  }
}
