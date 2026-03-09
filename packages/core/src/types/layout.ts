/**
 * 布局模式
 * - free: 自由布局（画布绝对定位）
 * - flow: 历史兼容模式（已下线，不再作为编辑入口）
 * - grid: 网格编排（整个画布为 CSS Grid，组件以 fr 比例填满）
 */
export type LayoutMode = 'free' | 'flow' | 'grid'

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
 * 自由布局几何信息（编辑器画布）
 */
export interface FreeNodeGeometry extends NodeSize {
  mode: 'free'
  x?: number
  y?: number
  zIndex?: number
  rotate?: number
  scaleX?: number
  scaleY?: number
  locked?: boolean
  hidden?: boolean
}

/**
 * 历史 flow 几何信息（编辑器画布）
 * 说明：类型名沿用 FlowNodeGeometry 以保持兼容
 * @deprecated flow 模式已弃用，新组件应使用 grid 模式。运行时会自动映射 flow → grid。
 */
export interface FlowNodeGeometry extends NodeSize {
  mode: 'flow'
  order?: number
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
export type NodeGeometry = FreeNodeGeometry | FlowNodeGeometry | GridNodeGeometry

/**
 * 自由容器布局配置
 */
export interface FreeContainerLayout {
  mode: 'free'
  snapToGrid?: boolean
  gridSize?: number
  allowOverlap?: boolean
}

/**
 * 历史 flow 容器布局配置
 * 说明：接口名沿用 FlowContainerLayout 以保持兼容
 * @deprecated flow 模式已弃用，新组件应使用 grid 模式。运行时会自动映射 flow → grid。
 */
export interface FlowContainerLayout {
  mode: 'flow'
  direction?: 'row' | 'column'
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly'
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline'
  alignContent?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'space-between' | 'space-around'
  gap?: LengthValue
}

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
export type NodeContainerLayout = FreeContainerLayout | FlowContainerLayout | GridContainerLayout

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
