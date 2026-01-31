import type { NodeStyle } from '../types/schema'
import type { ComponentCSSStyle } from '../utils/style'
import { extractRotation } from '../utils/style'
import type { LayoutEngine } from './base-engine'

export class FlowLayoutEngine implements LayoutEngine {
  generateStyle(style: NodeStyle | undefined): ComponentCSSStyle {
    const css: ComponentCSSStyle = {
      position: 'relative',
    }

    if (!style) return css

    // Flex Item Properties
    if (style.flexGrow !== undefined) css.flexGrow = style.flexGrow
    if (style.flexShrink !== undefined) css.flexShrink = style.flexShrink
    if (style.flexBasis)
      css.flexBasis = typeof style.flexBasis === 'number' ? `${style.flexBasis}px` : style.flexBasis
    if (style.alignSelf) css.alignSelf = style.alignSelf

    // Spacing (Margin)
    if (style.margin) css.margin = style.margin as string

    // Size
    if (style.width) css.width = typeof style.width === 'number' ? `${style.width}px` : style.width
    if (style.height)
      css.height = typeof style.height === 'number' ? `${style.height}px` : style.height

    // Z-Index
    if (style.zIndex !== undefined) css.zIndex = style.zIndex

    // Transform
    if (style.rotate || style.transform) {
      const rotation = extractRotation(style)
      css.transform = `rotate(${rotation}deg)`
    }

    return css
  }
}
