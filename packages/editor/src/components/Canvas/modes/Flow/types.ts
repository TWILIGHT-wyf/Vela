import type { PropValue, LengthValue } from '@vela/core'

/**
 * 流式布局拖拽相关类型定义
 */

/**
 * 拖拽指示器位置信息
 */
export interface DropIndicatorRect {
  top: number
  left: number
  width: number
  height: number
}

/**
 * 拖拽位置类型
 * - before: 插入到目标前面
 * - after: 插入到目标后面
 * - inside: 插入到容器内部
 */
export type DropPosition = 'before' | 'after' | 'inside'

/**
 * 拖拽指示器状态
 */
export interface DropIndicatorState {
  /** 是否显示 */
  visible: boolean
  /** 目标元素位置 */
  rect: DropIndicatorRect | null
  /** 插入位置 */
  position: DropPosition
  /** 父容器排列方向 (用于指示器方向) */
  direction: 'row' | 'column'
  /** 目标节点 ID */
  targetId: string | null
  /** 目标节点的父节点 ID */
  targetParentId: string | null
}

/**
 * 拖拽数据格式（通过 dataTransfer 传递）
 */
export interface FlowDropData {
  /** 组件名称 (来自 NodeSchema.component) */
  component?: string
  /** 组件名称（旧字段，保持兼容） */
  componentName?: string
  /** 节点 ID（移动组件时使用） */
  nodeId?: string
  /** 默认宽度 */
  width?: number
  /** 默认高度 */
  height?: number
  /** 默认属性 */
  props?: Record<string, PropValue>
  /** 默认样式 */
  style?: Record<string, LengthValue | undefined>
}
