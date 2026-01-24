import type { NodeSchema, NodeStyle, LayoutMode } from '../types/schema'

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
 * Extract position from NodeStyle
 */
export function extractPosition(style: NodeStyle | undefined): { x: number; y: number } {
  if (!style) return { x: 0, y: 0 }

  return {
    x: style.x !== undefined ? parseStyleValue(style.x, 0) : parseStyleValue(style.left, 0),
    y: style.y !== undefined ? parseStyleValue(style.y, 0) : parseStyleValue(style.top, 0),
  }
}

/**
 * Extract size from NodeStyle
 */
export function extractSize(style: NodeStyle | undefined): { width: number; height: number } {
  if (!style) return { width: 100, height: 100 }

  return {
    width: parseStyleValue(style.width, 100),
    height: parseStyleValue(style.height, 100),
  }
}

/**
 * Extract rotation from NodeStyle
 */
export function extractRotation(style: NodeStyle | undefined): number {
  if (!style) return 0

  if (typeof style.rotate === 'number') return style.rotate

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
export function isNodeLocked(style: NodeStyle | undefined): boolean {
  return style?.locked === true
}

/**
 * Check if node is visible
 */
export function isNodeVisible(style: NodeStyle | undefined): boolean {
  if (!style) return true
  if ('visible' in style) {
    return style.visible !== false
  }
  return true
}

/**
 * Generate layout CSS from NodeStyle
 */
export function generateLayoutCSS(
  style: NodeStyle | undefined,
  mode: LayoutMode = 'free',
): ComponentCSSStyle {
  if (mode === 'flex') {
    // Flex Layout Mode: Use flex item properties
    const css: ComponentCSSStyle = {
      position: 'relative', // Flex items are relative by default
    }

    // Flex Item Properties
    if (style?.flexGrow !== undefined) css.flexGrow = style.flexGrow
    if (style?.flexShrink !== undefined) css.flexShrink = style.flexShrink
    if (style?.flexBasis)
      css.flexBasis = typeof style.flexBasis === 'number' ? `${style.flexBasis}px` : style.flexBasis
    if (style?.alignSelf) css.alignSelf = style.alignSelf

    // Spacing (Margin)
    if (style?.margin) css.margin = style.margin as string

    // Size (Flex items still respect width/height as base size)
    if (style?.width) css.width = typeof style.width === 'number' ? `${style.width}px` : style.width
    if (style?.height)
      css.height = typeof style.height === 'number' ? `${style.height}px` : style.height

    // Z-Index (Flex items support z-index)
    if (style?.zIndex !== undefined) css.zIndex = style.zIndex

    // Transform (Optional support in flex)
    if (style?.rotate || style?.transform) {
      const rotation = extractRotation(style)
      css.transform = `rotate(${rotation}deg)`
    }

    return css
  }

  // Default: Free layout (Absolute Positioning)
  const position = extractPosition(style)
  const size = extractSize(style)
  const rotation = extractRotation(style)
  const zIndex = extractZIndex(style)

  return {
    position: 'absolute',
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: `${size.width}px`,
    height: `${size.height}px`,
    transform: `rotate(${rotation}deg)`,
    transformOrigin: 'center center',
    zIndex,
  }
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
  if ('visible' in style && style.visible === false) {
    css.display = 'none'
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
  if (!animation || !animation.class) return {}

  return {
    animationDuration: `${animation.duration || 0.7}s`,
    animationDelay: `${animation.delay || 0}s`,
    animationIterationCount: animation.iterationCount || 1,
    animationTimingFunction: animation.timingFunction || 'ease',
    animationFillMode: 'both',
  }
}
