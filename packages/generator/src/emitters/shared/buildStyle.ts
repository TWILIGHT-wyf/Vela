/**
 * Shared style builder for code generation emitters.
 *
 * Provides a single `buildNodeStyleFromIR` that both Vue3 and React emitters
 * use so that layout → CSS logic is not duplicated.
 *
 * NOTE: The React emitter embeds a copy of the style builder inside the
 * *generated* runtime code (template string). When modifying this logic,
 * you MUST also update the inline `buildNodeStyle` inside
 * `emitters/react/emitProject.ts → createNodeRendererRuntime()`.
 */

import type { IRNode } from '../../pipeline/ir/ir'

function normalizeGapValue(value: unknown): string | number | undefined {
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

function applyContainerStyle(node: IRNode, style: Record<string, string | number>): void {
  const container = node.container
  if (!container) {
    return
  }

  if (container.mode === 'grid') {
    if (style.display === undefined) {
      style.display = 'grid'
    }
    if (style.gridTemplateColumns === undefined && container.columns) {
      style.gridTemplateColumns = container.columns
    }
    if (style.gridTemplateRows === undefined && container.rows) {
      style.gridTemplateRows = container.rows
    }

    const gap = normalizeGapValue(container.gap)
    if (style.gap === undefined && gap !== undefined) {
      style.gap = gap
    }
    return
  }

  if (container.mode === 'flow') {
    if (style.display === undefined) {
      style.display = 'flex'
    }
    if (style.flexDirection === undefined && container.direction) {
      style.flexDirection = container.direction
    }
    if (style.flexWrap === undefined && container.wrap) {
      style.flexWrap = container.wrap
    }
    if (style.justifyContent === undefined && container.justify) {
      style.justifyContent = container.justify
    }
    if (style.alignItems === undefined && container.align) {
      style.alignItems = container.align
    }
    if (style.alignContent === undefined && container.alignContent) {
      style.alignContent = container.alignContent
    }

    const gap = normalizeGapValue(container.gap)
    if (style.gap === undefined && gap !== undefined) {
      style.gap = gap
    }
  }
}

/**
 * Build a flat style object from an IRNode's `style` and `layout` fields.
 *
 * The returned object uses CSS property names (kebab-case can be converted
 * by each emitter as needed).
 */
export function buildNodeStyleFromIR(node: IRNode): Record<string, string | number> {
  const style: Record<string, string | number> = {}
  const rawStyle = node.style as Record<string, unknown> | undefined

  // 1. Copy raw visual styles (string or number values only)
  if (rawStyle) {
    for (const [key, value] of Object.entries(rawStyle)) {
      if (typeof value === 'string' || typeof value === 'number') {
        style[key] = value
      }
    }
  }

  // 1.5. Overlay container semantics so emitted runtime keeps editor container behavior.
  applyContainerStyle(node, style)

  const hasMargin =
    style.margin !== undefined ||
    style.marginTop !== undefined ||
    style.marginRight !== undefined ||
    style.marginBottom !== undefined ||
    style.marginLeft !== undefined

  // 2. Overlay layout properties
  if (node.layout.mode === 'free') {
    style.position = 'absolute'
    style.left = `${node.layout.x}px`
    style.top = `${node.layout.y}px`
    if (style.width === undefined && node.layout.width !== undefined) {
      style.width = node.layout.width
    }
    if (style.height === undefined && node.layout.height !== undefined) {
      style.height = node.layout.height
    }
    if (style.zIndex === undefined) {
      style.zIndex = node.layout.zIndex
    }
  } else if (node.layout.mode === 'grid') {
    const hasGridPlacement =
      Number.isFinite(node.layout.gridColumnStart) &&
      Number.isFinite(node.layout.gridColumnEnd) &&
      Number.isFinite(node.layout.gridRowStart) &&
      Number.isFinite(node.layout.gridRowEnd)

    if (hasGridPlacement) {
      style.gridColumn = `${node.layout.gridColumnStart} / ${node.layout.gridColumnEnd}`
      style.gridRow = `${node.layout.gridRowStart} / ${node.layout.gridRowEnd}`
    }

    // Let CSS grid stretch fill the cell unless margin is explicitly configured.
    if (!hasMargin) {
      if (style.width === undefined) {
        style.width = '100%'
      }
      if (style.height === undefined) {
        style.height = '100%'
      }
    }
  } else {
    // Flow mode
    if (style.width === undefined && node.layout.width !== undefined) {
      style.width = node.layout.width
    }
    if (style.height === undefined && node.layout.height !== undefined) {
      style.height = node.layout.height
    }
    if (style.order === undefined && node.layout.order !== undefined) {
      style.order = node.layout.order
    }
  }

  // 3. Handle rotation
  if (node.layout.rotate !== 0) {
    const existingTransform = typeof style.transform === 'string' ? style.transform : ''
    if (existingTransform.includes('rotate(')) {
      style.transform = existingTransform
    } else if (existingTransform) {
      style.transform = `${existingTransform} rotate(${node.layout.rotate}deg)`
    } else {
      style.transform = `rotate(${node.layout.rotate}deg)`
    }
  }

  return style
}
