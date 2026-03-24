import type { NodeSchema, NodeStyle } from '../types/schema'
import type { LayoutMode, NodeGeometry } from '../types/layout'

/**
 * CSS 样式类型（不依赖 Vue）
 * 使用 Record 类型保持 core 包的纯净性
 */
export type ComponentCSSStyle = Record<string, string | number | undefined>

export interface AnimationStyle {
  animationName?: string
  animationDuration?: string
  animationDelay?: string
  animationIterationCount?: number | string
  animationTimingFunction?: string
  animationFillMode?: string
}

function toCssLength(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value === 'number') return `${value}px`
  return String(value)
}

/**
 * Parse a style value to a number
 */
export function parseStyleValue(value: unknown, defaultValue: number): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? defaultValue : parsed
  }
  return defaultValue
}

/**
 * Extract size from NodeStyle
 */
export function extractSize(
  style: NodeStyle | undefined,
  geometry?: NodeGeometry,
): { width: number; height: number } {
  if (!style && !geometry) return { width: 100, height: 100 }

  const width = geometry?.width ?? style?.width
  const height = geometry?.height ?? style?.height

  return {
    width: parseStyleValue(width, 100),
    height: parseStyleValue(height, 100),
  }
}

/**
 * Extract rotation from NodeStyle
 */
export function extractRotation(style: NodeStyle | undefined, geometry?: NodeGeometry): number {
  if (typeof geometry?.rotate === 'number') {
    return geometry.rotate
  }
  if (!style) return 0

  const transform = style.transform || ''
  const match = transform.match(/rotate\(([-\d.]+)deg\)/)
  return match ? parseFloat(match[1]) : 0
}

/**
 * Extract z-index from NodeStyle
 */
export function extractZIndex(style: NodeStyle | undefined): number {
  if (!style) return 0

  const z = style.zIndex
  if (typeof z === 'number') return z
  return parseInt(String(z || '0')) || 0
}

/**
 * Check if node is locked
 */
export function isNodeLocked(_style: NodeStyle | undefined, geometry?: NodeGeometry): boolean {
  return geometry?.locked === true
}

/**
 * Check if node is visible
 */
export function isNodeVisible(style: NodeStyle | undefined, geometry?: NodeGeometry): boolean {
  if (geometry?.hidden === true) {
    return false
  }
  if (!style) return true
  if (style.visibility === 'hidden') {
    return false
  }
  return true
}

/**
 * Generate layout CSS from NodeStyle
 */
export function generateLayoutCSS(
  style: NodeStyle | undefined,
  mode: LayoutMode = 'grid',
  geometry?: NodeGeometry,
): ComponentCSSStyle {
  // Grid layout (single mode)
  if (mode === 'grid') {
    const css: ComponentCSSStyle = {}

    if (geometry?.mode === 'grid') {
      css.gridColumn = `${geometry.gridColumnStart} / ${geometry.gridColumnEnd}`
      css.gridRow = `${geometry.gridRowStart} / ${geometry.gridRowEnd}`
    } else {
      if (style?.gridColumn !== undefined) css.gridColumn = style.gridColumn
      if (style?.gridRow !== undefined) css.gridRow = style.gridRow
    }

    const explicitWidth = toCssLength(geometry?.width ?? style?.width)
    const explicitHeight = toCssLength(geometry?.height ?? style?.height)
    const minWidth = toCssLength(geometry?.minWidth ?? style?.minWidth)
    const maxWidth = toCssLength(geometry?.maxWidth ?? style?.maxWidth)
    const minHeight = toCssLength(geometry?.minHeight ?? style?.minHeight)
    const maxHeight = toCssLength(geometry?.maxHeight ?? style?.maxHeight)

    // Keep grid item sizing consistent between editor and runtime:
    // 1) explicit width/height (fixed mode) wins
    // 2) otherwise fill cell only when no outer margin exists
    const hasMargin =
      style?.margin !== undefined ||
      style?.marginTop !== undefined ||
      style?.marginRight !== undefined ||
      style?.marginBottom !== undefined ||
      style?.marginLeft !== undefined

    if (explicitWidth !== undefined) {
      css.width = explicitWidth
    } else if (!hasMargin) {
      css.width = '100%'
    }

    if (explicitHeight !== undefined) {
      css.height = explicitHeight
    } else if (!hasMargin) {
      css.height = '100%'
    }

    if (minWidth !== undefined) css.minWidth = minWidth
    if (maxWidth !== undefined) css.maxWidth = maxWidth
    if (minHeight !== undefined) css.minHeight = minHeight
    if (maxHeight !== undefined) css.maxHeight = maxHeight

    const margin = toCssLength(style?.margin)
    if (margin !== undefined) css.margin = margin
    const marginTop = toCssLength(style?.marginTop)
    if (marginTop !== undefined) css.marginTop = marginTop
    const marginRight = toCssLength(style?.marginRight)
    if (marginRight !== undefined) css.marginRight = marginRight
    const marginBottom = toCssLength(style?.marginBottom)
    if (marginBottom !== undefined) css.marginBottom = marginBottom
    const marginLeft = toCssLength(style?.marginLeft)
    if (marginLeft !== undefined) css.marginLeft = marginLeft

    return css
  }

  return {}
}

/**
 * Generate visual CSS from NodeStyle (non-layout properties)
 */
export function generateVisualCSS(style: NodeStyle | undefined): ComponentCSSStyle {
  if (!style) return {}

  const css: ComponentCSSStyle = {}

  // Opacity
  if (style.opacity !== undefined) {
    const opacity =
      typeof style.opacity === 'number' ? style.opacity : parseFloat(String(style.opacity))
    css.opacity = opacity > 1 ? opacity / 100 : opacity
  }

  // Visibility
  if (style.visibility === 'hidden') {
    css.visibility = 'hidden'
  }

  // Background
  if (style.backgroundColor) css.backgroundColor = String(style.backgroundColor)

  // Border
  if (style.borderRadius !== undefined) {
    css.borderRadius =
      typeof style.borderRadius === 'number'
        ? `${style.borderRadius}px`
        : String(style.borderRadius)
  }
  if (style.border) css.border = String(style.border)

  // Shadow
  if (style.boxShadow) css.boxShadow = String(style.boxShadow)

  // Padding
  if (style.padding !== undefined) {
    css.padding = typeof style.padding === 'number' ? `${style.padding}px` : String(style.padding)
  }
  if (style.paddingTop !== undefined) {
    css.paddingTop =
      typeof style.paddingTop === 'number' ? `${style.paddingTop}px` : String(style.paddingTop)
  }
  if (style.paddingRight !== undefined) {
    css.paddingRight =
      typeof style.paddingRight === 'number'
        ? `${style.paddingRight}px`
        : String(style.paddingRight)
  }
  if (style.paddingBottom !== undefined) {
    css.paddingBottom =
      typeof style.paddingBottom === 'number'
        ? `${style.paddingBottom}px`
        : String(style.paddingBottom)
  }
  if (style.paddingLeft !== undefined) {
    css.paddingLeft =
      typeof style.paddingLeft === 'number' ? `${style.paddingLeft}px` : String(style.paddingLeft)
  }

  // Text styles
  if (style.color) css.color = String(style.color)
  if (style.fontSize !== undefined) {
    css.fontSize =
      typeof style.fontSize === 'number' ? `${style.fontSize}px` : String(style.fontSize)
  }
  if (style.fontWeight !== undefined) css.fontWeight = style.fontWeight as string | number
  if (style.fontFamily) css.fontFamily = String(style.fontFamily)
  if (style.textAlign) css.textAlign = style.textAlign as string
  if (style.lineHeight !== undefined) css.lineHeight = style.lineHeight as string | number

  // Flex Container Styles (如果自身是容器)
  if (style.display === 'flex') {
    css.display = 'flex'
    css.flexDirection = (style.flexDirection as string) || 'row'
    css.flexWrap = (style.flexWrap as string) || 'nowrap'
    css.justifyContent = (style.justifyContent as string) || 'flex-start'
    css.alignItems = (style.alignItems as string) || 'flex-start'
    if (style.gap) css.gap = typeof style.gap === 'number' ? `${style.gap}px` : String(style.gap)
  }

  return css
}

/**
 * Generate animation CSS from NodeSchema animation config
 */
export function generateAnimationCSS(animation: NodeSchema['animation']): AnimationStyle {
  if (!animation) return {}

  const legacyClassName = animation.className || (animation as unknown as { class?: string }).class

  if (!legacyClassName) return {}

  return {
    animationDuration: `${(animation.duration || 700) / 1000}s`,
    animationDelay: `${(animation.delay || 0) / 1000}s`,
    animationIterationCount: animation.iterations || 1,
    animationTimingFunction: animation.easing || 'ease',
    animationFillMode: 'both',
  }
}
