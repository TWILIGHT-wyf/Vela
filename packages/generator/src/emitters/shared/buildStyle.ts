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
