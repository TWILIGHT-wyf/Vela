/**
 * 布局模式
 * - free: 自由布局（画布绝对定位）
 * - flow: 流式布局（文档流）
 */
export type LayoutMode = 'free' | 'flow'

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
 * 流式布局几何信息（编辑器画布）
 */
export interface FlowNodeGeometry extends NodeSize {
  mode: 'flow'
  order?: number
}

/**
 * 节点几何定义（仅编辑器使用）
 */
export type NodeGeometry = FreeNodeGeometry | FlowNodeGeometry

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
 * 流式容器布局配置
 */
export interface FlowContainerLayout {
  mode: 'flow'
  direction?: 'row' | 'column'
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  justify?:
    | 'flex-start'
    | 'center'
    | 'flex-end'
    | 'space-between'
    | 'space-around'
    | 'space-evenly'
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline'
  alignContent?:
    | 'flex-start'
    | 'center'
    | 'flex-end'
    | 'stretch'
    | 'space-between'
    | 'space-around'
  gap?: LengthValue
}

/**
 * 容器对子节点的布局定义
 */
export type NodeContainerLayout = FreeContainerLayout | FlowContainerLayout

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
