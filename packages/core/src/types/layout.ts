/**
 * 布局模式（当前仅保留网格编排）
 */
export type LayoutMode = 'grid'

/**
 * 长度值
 * number 按 px 处理，string 允许 %, rem, vw 等 CSS 单位
 */
export type LengthValue = number | string

/**
 * 节点尺寸定义
 */
export interface NodeSize {
  width?: LengthValue
  height?: LengthValue
  minWidth?: LengthValue
  maxWidth?: LengthValue
  minHeight?: LengthValue
  maxHeight?: LengthValue
}

/**
 * 网格编排几何信息（编辑器画布）
 * 组件通过 gridColumnStart/End、gridRowStart/End 占据精确区域
 */
export interface GridNodeGeometry extends NodeSize {
  mode: 'grid'
  gridColumnStart: number // 1-based column line
  gridColumnEnd: number // 1-based column line (exclusive)
  gridRowStart: number // 1-based row line
  gridRowEnd: number // 1-based row line (exclusive)
  zIndex?: number
  rotate?: number
  locked?: boolean
  hidden?: boolean
}

/**
 * 语义化网格占位（编辑器交互层）
 * col/row 采用 1-based 起始位，span 采用跨轨道数量
 */
export interface GridPlacement {
  colStart: number
  colSpan: number
  rowStart: number
  rowSpan: number
}

/**
 * 网格轨道定义（容器层）
 */
export interface GridTrack {
  unit: 'fr' | 'px' | 'auto' | 'minmax'
  value?: number
  min?: number | 'auto'
  max?: number | 'auto'
}

/**
 * 网格项尺寸模式
 */
export type GridItemSizeMode = 'stretch' | 'fit' | 'fixed'

/**
 * 网格项布局（子项层）
 * placement 采用 line + span 语义，未显式指定 start 时由 auto placement 决定
 */
export interface GridItemLayout {
  mode: 'grid'
  placement: {
    colStart?: number
    colSpan: number
    rowStart?: number
    rowSpan: number
  }
  sizeModeX?: GridItemSizeMode
  sizeModeY?: GridItemSizeMode
  fixedWidth?: number
  fixedHeight?: number
}

/**
 * 节点几何定义（仅编辑器使用）
 */
export type NodeGeometry = GridNodeGeometry

/**
 * 网格编排容器布局配置
 * columns/rows 为 fr 模板字符串，如 '1fr 2fr' 或 '1fr 1fr 1fr'
 */
export interface GridContainerLayout {
  mode: 'grid'
  columns: string // e.g. '1fr 1fr' or '2fr 1fr'
  rows: string // e.g. '1fr 1fr'
  templateMode?: 'manual' | 'autoFit'
  autoFitMinWidth?: number
  autoFitDense?: boolean
  gap?: number // px
  columnTracks?: GridTrack[]
  rowTracks?: GridTrack[] | 'auto'
  gapX?: number
  gapY?: number
  autoRowsMin?: number
  autoFlow?: 'row' | 'column'
  dense?: boolean
}

/**
 * 容器对子节点的布局定义
 */
export type NodeContainerLayout = GridContainerLayout

/**
 * 页面画布模式
 */
export type CanvasMode = 'inherit' | 'fixed' | 'responsive'

/**
 * 页面画布缩放模式
 */
export type CanvasScaleMode = 'none' | 'fit' | 'cover' | 'stretch' | 'width' | 'height'

/**
 * 页面画布网格配置
 */
export interface CanvasGridConfig {
  enabled?: boolean
  size?: number
  snap?: boolean
  color?: string
}

/**
 * 页面画布配置
 */
export interface PageCanvasConfig {
  mode?: CanvasMode
  designWidth?: number
  designHeight?: number
  minWidth?: number
  maxWidth?: number
  minHeight?: number
  maxHeight?: number
  scaleMode?: CanvasScaleMode
  breakpoints?: Record<string, number>
  safeArea?: {
    top?: number
    right?: number
    bottom?: number
    left?: number
  }
  grid?: CanvasGridConfig
}
