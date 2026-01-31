import type { NodeStyle } from '../types/schema'
import type { ComponentCSSStyle } from '../utils/style'
import { extractPosition, extractSize, extractRotation, extractZIndex } from '../utils/style'
import type { LayoutEngine } from './base-engine'

export class FreeLayoutEngine implements LayoutEngine {
  generateStyle(style: NodeStyle | undefined): ComponentCSSStyle {
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
}
