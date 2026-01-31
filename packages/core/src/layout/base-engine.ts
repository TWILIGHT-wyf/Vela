import type { NodeStyle } from '../types/schema'
import type { ComponentCSSStyle } from '../utils/style'

export interface LayoutEngine {
  generateStyle(style: NodeStyle | undefined): ComponentCSSStyle
}
