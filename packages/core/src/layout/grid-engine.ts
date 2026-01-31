import type { NodeStyle } from '../types/schema'
import type { ComponentCSSStyle } from '../utils/style'
import { extractRotation } from '../utils/style'
import type { LayoutEngine } from './base-engine'

/**
 * Grid 扩展样式类型
 */
interface GridStyle extends NodeStyle {
  // Grid 容器属性
  gridTemplateColumns?: string
  gridTemplateRows?: string
  gridAutoColumns?: string
  gridAutoRows?: string
  gridAutoFlow?: 'row' | 'column' | 'row dense' | 'column dense'
  rowGap?: number | string
  columnGap?: number | string
  justifyItems?: 'start' | 'end' | 'center' | 'stretch'
  alignContent?: 'start' | 'end' | 'center' | 'stretch' | 'space-between' | 'space-around' | 'space-evenly'

  // Grid 子项属性
  gridColumnStart?: number | string
  gridColumnEnd?: number | string
  gridRowStart?: number | string
  gridRowEnd?: number | string
  gridColumn?: string
  gridRow?: string
  gridArea?: string
  justifySelf?: 'start' | 'end' | 'center' | 'stretch'
}

/**
 * Grid 布局引擎
 * 处理 Grid 容器和 Grid 子项的样式生成
 */
export class GridLayoutEngine implements LayoutEngine {
  generateStyle(style: NodeStyle | undefined): ComponentCSSStyle {
    const css: ComponentCSSStyle = {
      position: 'relative',
    }

    if (!style) return css

    const gridStyle = style as GridStyle

    // === Grid 容器属性 (当 display: 'grid' 时) ===
    if (gridStyle.display === 'grid') {
      css.display = 'grid'

      // 网格模板
      if (gridStyle.gridTemplateColumns) css.gridTemplateColumns = gridStyle.gridTemplateColumns
      if (gridStyle.gridTemplateRows) css.gridTemplateRows = gridStyle.gridTemplateRows

      // 自动网格
      if (gridStyle.gridAutoColumns) css.gridAutoColumns = gridStyle.gridAutoColumns
      if (gridStyle.gridAutoRows) css.gridAutoRows = gridStyle.gridAutoRows
      if (gridStyle.gridAutoFlow) css.gridAutoFlow = gridStyle.gridAutoFlow

      // 间距
      if (gridStyle.gap !== undefined) {
        css.gap = typeof gridStyle.gap === 'number' ? `${gridStyle.gap}px` : gridStyle.gap
      }
      if (gridStyle.rowGap !== undefined) {
        css.rowGap = typeof gridStyle.rowGap === 'number' ? `${gridStyle.rowGap}px` : gridStyle.rowGap
      }
      if (gridStyle.columnGap !== undefined) {
        css.columnGap =
          typeof gridStyle.columnGap === 'number' ? `${gridStyle.columnGap}px` : gridStyle.columnGap
      }

      // 对齐
      if (gridStyle.justifyItems) css.justifyItems = gridStyle.justifyItems
      if (gridStyle.alignItems) css.alignItems = gridStyle.alignItems
      if (gridStyle.alignContent) css.alignContent = gridStyle.alignContent
    }

    // === Grid 子项属性 ===
    if (gridStyle.gridColumnStart !== undefined) css.gridColumnStart = gridStyle.gridColumnStart
    if (gridStyle.gridColumnEnd !== undefined) css.gridColumnEnd = gridStyle.gridColumnEnd
    if (gridStyle.gridRowStart !== undefined) css.gridRowStart = gridStyle.gridRowStart
    if (gridStyle.gridRowEnd !== undefined) css.gridRowEnd = gridStyle.gridRowEnd
    if (gridStyle.gridColumn) css.gridColumn = gridStyle.gridColumn
    if (gridStyle.gridRow) css.gridRow = gridStyle.gridRow
    if (gridStyle.gridArea) css.gridArea = gridStyle.gridArea
    if (gridStyle.justifySelf) css.justifySelf = gridStyle.justifySelf
    if (gridStyle.alignSelf) css.alignSelf = gridStyle.alignSelf

    // === 间距 ===
    if (gridStyle.margin) css.margin = gridStyle.margin as string
    if (gridStyle.padding !== undefined) {
      css.padding = typeof gridStyle.padding === 'number' ? `${gridStyle.padding}px` : gridStyle.padding
    }

    // === 尺寸 ===
    if (gridStyle.width !== undefined) {
      css.width = typeof gridStyle.width === 'number' ? `${gridStyle.width}px` : gridStyle.width
    }
    if (gridStyle.height !== undefined) {
      css.height = typeof gridStyle.height === 'number' ? `${gridStyle.height}px` : gridStyle.height
    }

    // === 层级 ===
    if (gridStyle.zIndex !== undefined) css.zIndex = gridStyle.zIndex

    // === 变换 ===
    if (gridStyle.rotate || gridStyle.transform) {
      const rotation = extractRotation(gridStyle)
      if (rotation !== 0) {
        css.transform = `rotate(${rotation}deg)`
      }
    }

    return css
  }
}
