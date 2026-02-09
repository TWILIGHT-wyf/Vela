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

export interface ResolveLayoutParams {
  node: Pick<NodeSchema, 'geometry' | 'container' | 'style'>
  parentChildMode: LayoutMode
  pageDefaultMode: LayoutMode
}

export function resolveLayout(params: ResolveLayoutParams): NormalizedNodeLayout {
  const inheritedMode = params.parentChildMode || params.pageDefaultMode
  const nodeMode = params.node.geometry?.mode ?? inheritedMode
  const childMode = params.node.container?.mode ?? nodeMode
  const style = params.node.style
  const geometry = params.node.geometry

  const x =
    nodeMode === 'free'
      ? geometry?.mode === 'free'
        ? (geometry.x ?? parseNumber(style?.left, 0))
        : parseNumber(style?.left, 0)
      : 0
  const y =
    nodeMode === 'free'
      ? geometry?.mode === 'free'
        ? (geometry.y ?? parseNumber(style?.top, 0))
        : parseNumber(style?.top, 0)
      : 0

  const width =
    normalizeLengthValue(geometry?.width ?? style?.width) ?? (nodeMode === 'free' ? 100 : undefined)
  const height =
    normalizeLengthValue(geometry?.height ?? style?.height) ??
    (nodeMode === 'free' ? 100 : undefined)

  const zIndex =
    geometry?.mode === 'free'
      ? (geometry.zIndex ?? parseNumber(style?.zIndex, 0))
      : parseNumber(style?.zIndex, 0)

  const rotate =
    geometry?.mode === 'free'
      ? (geometry.rotate ?? parseRotationFromTransform(style))
      : parseRotationFromTransform(style)

  return {
    mode: nodeMode,
    childMode,
    x,
    y,
    width,
    height,
    zIndex,
    rotate,
    order: geometry?.mode === 'flow' ? geometry.order : undefined,
  }
}
