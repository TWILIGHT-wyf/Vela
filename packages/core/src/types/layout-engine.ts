/**
 * 布局引擎类型定义
 *
 * 这个模块定义了低代码编辑器的布局引擎抽象层。
 * 通过统一的接口，支持多种布局模式的扩展。
 *
 * 设计目标：
 * 1. 布局模式可插拔 - 新增布局模式只需实现接口
 * 2. 交互能力声明式 - 每种布局声明支持的交互类型
 * 3. 样式生成统一 - 所有布局模式使用相同的样式生成流程
 * 4. 容器规则清晰 - 明确定义父子容器的布局关系
 */

import type { CSSProperties } from 'vue'
import type { NodeStyle } from './schema'

// ==================== 布局模式定义 ====================

/**
 * 支持的布局模式
 *
 * - free: 自由布局（绝对定位，支持拖拽/缩放/旋转）
 * - flex: Flex 流式布局（弹性盒模型）
 * - grid: Grid 网格布局
 * - flow: 文档流布局（块级元素默认流式）
 */
export type LayoutModeType = 'free' | 'flex' | 'grid' | 'flow'

/**
 * 布局模式的元数据
 */
export interface LayoutModeMeta {
  /** 模式标识 */
  type: LayoutModeType
  /** 显示名称 */
  label: string
  /** 描述 */
  description: string
  /** 图标 */
  icon?: string
}

/**
 * 预定义的布局模式元数据
 */
export const LAYOUT_MODES: Record<LayoutModeType, LayoutModeMeta> = {
  free: {
    type: 'free',
    label: '自由布局',
    description: '组件可自由拖拽、缩放、旋转，使用绝对定位',
    icon: 'Move',
  },
  flex: {
    type: 'flex',
    label: 'Flex 布局',
    description: '使用 Flexbox 弹性盒模型，支持自动排列和对齐',
    icon: 'LayoutList',
  },
  grid: {
    type: 'grid',
    label: 'Grid 布局',
    description: '使用 CSS Grid 网格布局，支持行列定义',
    icon: 'Grid3x3',
  },
  flow: {
    type: 'flow',
    label: '文档流',
    description: '块级元素默认排列，适合传统网页布局',
    icon: 'AlignJustify',
  },
}

// ==================== 交互能力定义 ====================

/**
 * 布局模式支持的交互能力
 */
export interface LayoutCapabilities {
  /** 是否支持拖拽移动位置 */
  canDrag: boolean
  /** 是否支持缩放尺寸 */
  canResize: boolean
  /** 是否支持旋转 */
  canRotate: boolean
  /** 是否支持对齐辅助线 */
  canSnap: boolean
  /** 是否支持层级调整 (z-index) */
  canReorder: boolean
  /** 是否支持拖放排序 */
  canDragSort: boolean
  /** 是否支持嵌套子组件 */
  canNest: boolean
}

/**
 * 各布局模式的默认交互能力
 */
export const LAYOUT_CAPABILITIES: Record<LayoutModeType, LayoutCapabilities> = {
  free: {
    canDrag: true,
    canResize: true,
    canRotate: true,
    canSnap: true,
    canReorder: true,
    canDragSort: false,
    canNest: true,
  },
  flex: {
    canDrag: false, // Flex 项目不能自由拖拽
    canResize: true, // 可以调整宽高
    canRotate: false,
    canSnap: false,
    canReorder: false,
    canDragSort: true, // 可以拖拽排序
    canNest: true,
  },
  grid: {
    canDrag: false,
    canResize: true, // 可以跨行跨列
    canRotate: false,
    canSnap: false,
    canReorder: false,
    canDragSort: true,
    canNest: true,
  },
  flow: {
    canDrag: false,
    canResize: true, // 宽度可调，高度自适应
    canRotate: false,
    canSnap: false,
    canReorder: false,
    canDragSort: true,
    canNest: true,
  },
}

// ==================== 样式字段定义 ====================

/**
 * Free 布局专用样式字段
 */
export interface FreeLayoutStyle {
  /** X 坐标 */
  x?: number
  /** Y 坐标 */
  y?: number
  /** 宽度 */
  width?: number | string
  /** 高度 */
  height?: number | string
  /** 旋转角度 */
  rotate?: number
  /** 层级 */
  zIndex?: number
}

/**
 * Flex 容器样式字段
 */
export interface FlexContainerStyle {
  /** 主轴方向 */
  flexDirection?: 'row' | 'row-reverse' | 'column' | 'column-reverse'
  /** 主轴对齐 */
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'
  /** 交叉轴对齐 */
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline'
  /** 多行对齐 */
  alignContent?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'space-between' | 'space-around'
  /** 是否换行 */
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  /** 间距 */
  gap?: number | string
  /** 行间距 */
  rowGap?: number | string
  /** 列间距 */
  columnGap?: number | string
}

/**
 * Flex 子项样式字段
 */
export interface FlexItemStyle {
  /** 放大比例 */
  flexGrow?: number
  /** 缩小比例 */
  flexShrink?: number
  /** 基础尺寸 */
  flexBasis?: number | string
  /** 自身对齐 */
  alignSelf?: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline'
  /** 排序 */
  order?: number
}

/**
 * Grid 容器样式字段
 */
export interface GridContainerStyle {
  /** 列定义 */
  gridTemplateColumns?: string
  /** 行定义 */
  gridTemplateRows?: string
  /** 区域定义 */
  gridTemplateAreas?: string
  /** 自动列宽 */
  gridAutoColumns?: string
  /** 自动行高 */
  gridAutoRows?: string
  /** 自动流向 */
  gridAutoFlow?: 'row' | 'column' | 'dense' | 'row dense' | 'column dense'
  /** 间距 */
  gap?: number | string
  /** 行间距 */
  rowGap?: number | string
  /** 列间距 */
  columnGap?: number | string
  /** 水平对齐 */
  justifyItems?: 'start' | 'end' | 'center' | 'stretch'
  /** 垂直对齐 */
  alignItems?: 'start' | 'end' | 'center' | 'stretch'
}

/**
 * Grid 子项样式字段
 */
export interface GridItemStyle {
  /** 列起始 */
  gridColumnStart?: number | string
  /** 列结束 */
  gridColumnEnd?: number | string
  /** 行起始 */
  gridRowStart?: number | string
  /** 行结束 */
  gridRowEnd?: number | string
  /** 区域名 */
  gridArea?: string
  /** 自身水平对齐 */
  justifySelf?: 'start' | 'end' | 'center' | 'stretch'
  /** 自身垂直对齐 */
  alignSelf?: 'start' | 'end' | 'center' | 'stretch'
}

/**
 * Flow 布局样式字段
 */
export interface FlowLayoutStyle {
  /** 宽度 */
  width?: number | string
  /** 高度 */
  height?: number | string
  /** 最小高度 */
  minHeight?: number | string
  /** 最大宽度 */
  maxWidth?: number | string
  /** 外边距 */
  margin?: string
  marginTop?: number | string
  marginRight?: number | string
  marginBottom?: number | string
  marginLeft?: number | string
  /** 内边距 */
  padding?: string
}

// ==================== 布局引擎接口 ====================

/**
 * 样式生成上下文
 */
export interface StyleGenerationContext {
  /** 当前节点的样式 */
  nodeStyle: NodeStyle
  /** 父节点的布局模式 */
  parentLayoutMode?: LayoutModeType
  /** 是否为容器组件 */
  isContainer?: boolean
  /** 是否被选中 */
  isSelected?: boolean
  /** 是否正在拖拽 */
  isDragging?: boolean
}

/**
 * 生成的 CSS 样式结果
 */
export interface GeneratedStyles {
  /** 外层包装器样式（定位相关） */
  wrapperStyle: CSSProperties
  /** 内层组件样式（视觉相关） */
  innerStyle: CSSProperties
  /** 额外的 CSS 类名 */
  cssClasses?: string[]
}

/**
 * 拖拽上下文
 */
export interface DragContext {
  /** 拖拽的节点 ID */
  nodeId: string
  /** 起始位置 */
  startPosition: { x: number; y: number }
  /** 当前位置 */
  currentPosition: { x: number; y: number }
  /** 目标容器 ID */
  targetContainerId?: string
  /** 插入位置 */
  insertIndex?: number
}

/**
 * 缩放上下文
 */
export interface ResizeContext {
  /** 缩放的节点 ID */
  nodeId: string
  /** 缩放方向 */
  direction: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
  /** 起始尺寸 */
  startSize: { width: number; height: number }
  /** 当前尺寸 */
  currentSize: { width: number; height: number }
  /** 是否保持比例 */
  keepAspectRatio?: boolean
}

/**
 * 布局引擎接口
 *
 * 每种布局模式都需要实现此接口
 */
export interface ILayoutEngine {
  /** 布局模式类型 */
  readonly type: LayoutModeType

  /** 布局模式元数据 */
  readonly meta: LayoutModeMeta

  /** 交互能力 */
  readonly capabilities: LayoutCapabilities

  /**
   * 生成组件的 CSS 样式
   * @param context 样式生成上下文
   * @returns 生成的样式对象
   */
  generateStyles(context: StyleGenerationContext): GeneratedStyles

  /**
   * 处理拖拽开始
   * @param context 拖拽上下文
   * @returns 是否允许拖拽
   */
  onDragStart?(context: DragContext): boolean

  /**
   * 处理拖拽移动
   * @param context 拖拽上下文
   * @returns 更新后的样式
   */
  onDragMove?(context: DragContext): Partial<NodeStyle> | null

  /**
   * 处理拖拽结束
   * @param context 拖拽上下文
   * @returns 最终的样式更新
   */
  onDragEnd?(context: DragContext): Partial<NodeStyle> | null

  /**
   * 处理缩放
   * @param context 缩放上下文
   * @returns 更新后的样式
   */
  onResize?(context: ResizeContext): Partial<NodeStyle> | null

  /**
   * 计算拖放的插入位置
   * @param mousePosition 鼠标位置
   * @param containerRect 容器边界
   * @param children 子节点列表
   * @returns 插入索引
   */
  calculateDropIndex?(
    mousePosition: { x: number; y: number },
    containerRect: DOMRect,
    children: Array<{ id: string; rect: DOMRect }>,
  ): number

  /**
   * 验证是否可以放置到目标容器
   * @param dragNodeId 拖拽的节点 ID
   * @param targetContainerId 目标容器 ID
   * @returns 是否允许放置
   */
  canDropInto?(dragNodeId: string, targetContainerId: string): boolean
}

// ==================== 布局引擎注册表 ====================

/**
 * 布局引擎注册表接口
 */
export interface ILayoutEngineRegistry {
  /**
   * 注册布局引擎
   * @param engine 布局引擎实例
   */
  register(engine: ILayoutEngine): void

  /**
   * 获取布局引擎
   * @param type 布局模式类型
   * @returns 布局引擎实例
   */
  get(type: LayoutModeType): ILayoutEngine | undefined

  /**
   * 获取所有已注册的布局模式
   */
  getAll(): ILayoutEngine[]

  /**
   * 检查布局模式是否已注册
   * @param type 布局模式类型
   */
  has(type: LayoutModeType): boolean
}

// ==================== 容器布局配置 ====================

/**
 * 容器的布局配置
 * 定义容器如何布局其子组件
 */
export interface ContainerLayoutConfig {
  /** 容器使用的布局模式 */
  layoutMode: LayoutModeType

  /** Flex 容器配置 */
  flex?: FlexContainerStyle

  /** Grid 容器配置 */
  grid?: GridContainerStyle

  /** 是否允许子组件超出边界 */
  allowOverflow?: boolean

  /** 默认子组件尺寸 */
  defaultChildSize?: {
    width?: number | string
    height?: number | string
  }
}

/**
 * 子组件在容器中的布局配置
 */
export interface ChildLayoutConfig {
  /** Flex 子项配置 */
  flexItem?: FlexItemStyle

  /** Grid 子项配置 */
  gridItem?: GridItemStyle

  /** Flow 布局配置 */
  flow?: FlowLayoutStyle
}

// ==================== 组件元数据扩展 ====================

/**
 * 组件的布局相关元数据
 */
export interface ComponentLayoutMeta {
  /** 组件是否为容器 */
  isContainer: boolean

  /** 容器支持的布局模式 */
  supportedLayoutModes?: LayoutModeType[]

  /** 默认布局模式 */
  defaultLayoutMode?: LayoutModeType

  /** 是否可以作为子组件放入某种布局 */
  canBeChildOf?: LayoutModeType[]

  /** 默认尺寸 */
  defaultSize?: {
    width?: number | string
    height?: number | string
  }

  /** 尺寸约束 */
  sizeConstraints?: {
    minWidth?: number
    maxWidth?: number
    minHeight?: number
    maxHeight?: number
  }
}

// ==================== 工具类型 ====================

/**
 * 从 NodeStyle 中提取特定布局模式的样式
 */
export type ExtractLayoutStyle<T extends LayoutModeType> = T extends 'free'
  ? FreeLayoutStyle
  : T extends 'flex'
    ? FlexItemStyle
    : T extends 'grid'
      ? GridItemStyle
      : FlowLayoutStyle

/**
 * 布局变更事件
 */
export interface LayoutChangeEvent {
  /** 变更类型 */
  type: 'move' | 'resize' | 'rotate' | 'reorder'
  /** 节点 ID */
  nodeId: string
  /** 旧值 */
  oldValue: Partial<NodeStyle>
  /** 新值 */
  newValue: Partial<NodeStyle>
}

/**
 * 布局模式切换事件
 */
export interface LayoutModeSwitchEvent {
  /** 节点 ID */
  nodeId: string
  /** 旧模式 */
  oldMode: LayoutModeType
  /** 新模式 */
  newMode: LayoutModeType
  /** 样式转换结果 */
  convertedStyle: NodeStyle
}
