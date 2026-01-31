import type { NodeStyle } from '../types/schema'
import type { ComponentCSSStyle } from '../utils/style'
import { extractRotation } from '../utils/style'
import type { LayoutEngine } from './base-engine'

/**
 * Flex 布局引擎
 * 处理 Flex 容器和 Flex 子项的样式生成
 */
export class FlexLayoutEngine implements LayoutEngine {
  generateStyle(style: NodeStyle | undefined): ComponentCSSStyle {
    const css: ComponentCSSStyle = {
      position: 'relative',
    }

    if (!style) return css

    // === Flex 容器属性 (当 display: 'flex' 时) ===
    if (style.display === 'flex') {
      css.display = 'flex'

      // 主轴方向
      if (style.flexDirection) css.flexDirection = style.flexDirection

      // 主轴对齐
      if (style.justifyContent) css.justifyContent = style.justifyContent

      // 交叉轴对齐
      if (style.alignItems) css.alignItems = style.alignItems

      // 换行
      if (style.flexWrap) css.flexWrap = style.flexWrap

      // 间距
      if (style.gap !== undefined) {
        css.gap = typeof style.gap === 'number' ? `${style.gap}px` : style.gap
      }
    }

    // === Flex 子项属性 ===
    if (style.flexGrow !== undefined) css.flexGrow = style.flexGrow
    if (style.flexShrink !== undefined) css.flexShrink = style.flexShrink
    if (style.flexBasis !== undefined) {
      css.flexBasis = typeof style.flexBasis === 'number' ? `${style.flexBasis}px` : style.flexBasis
    }
    if (style.alignSelf) css.alignSelf = style.alignSelf

    // === 间距 ===
    if (style.margin) css.margin = style.margin as string
    if (style.padding !== undefined) {
      css.padding = typeof style.padding === 'number' ? `${style.padding}px` : style.padding
    }

    // === 尺寸 ===
    if (style.width !== undefined) {
      css.width = typeof style.width === 'number' ? `${style.width}px` : style.width
    }
    if (style.height !== undefined) {
      css.height = typeof style.height === 'number' ? `${style.height}px` : style.height
    }

    // === 层级 ===
    if (style.zIndex !== undefined) css.zIndex = style.zIndex

    // === 变换 ===
    if (style.rotate || style.transform) {
      const rotation = extractRotation(style)
      if (rotation !== 0) {
        css.transform = `rotate(${rotation}deg)`
      }
    }

    return css
  }
}
