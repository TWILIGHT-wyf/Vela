import type { NodeSchema, NodeStyle } from '@vela/core'

/**
 * 命令接口
 * 所有可撤销的操作都应实现此接口
 */
export interface Command {
  /** 命令类型标识 */
  readonly type: CommandType
  /** 命令描述（用于调试和显示） */
  readonly description?: string
  /** 执行命令 */
  execute(): void
  /** 撤销命令 */
  undo(): void
  /** 重做命令 */
  redo(): void
  /**
   * 检查是否可以与另一个命令合并
   * 用于合并连续的相同类型操作（如连续拖拽）
   */
  canMerge?(other: Command): boolean
  /**
   * 合并另一个命令到当前命令
   * 返回合并后的新命令
   */
  merge?(other: Command): Command
}

/**
 * 命令类型枚举
 */
export type CommandType =
  | 'add-component'
  | 'delete-component'
  | 'move-component'
  | 'update-props'
  | 'update-style'
  | 'update-data-source'
  | 'batch'

/**
 * 添加组件命令的参数
 */
export interface AddComponentPayload {
  parentId: string | null
  component: NodeSchema
  index?: number
}

/**
 * 删除组件命令的参数
 */
export interface DeleteComponentPayload {
  id: string
}

/**
 * 移动组件命令的参数
 */
export interface MoveComponentPayload {
  id: string
  newParentId: string
  newIndex: number
}

/**
 * 更新属性命令的参数
 */
export interface UpdatePropsPayload {
  id: string
  props: Record<string, unknown>
}

/**
 * 更新样式命令的参数
 */
export interface UpdateStylePayload {
  id: string
  style: Partial<NodeStyle>
}

/**
 * 更新数据源命令的参数
 */
export interface UpdateDataSourcePayload {
  id: string
  dataSource: Record<string, unknown>
}

/**
 * 批量命令的参数
 */
export interface BatchPayload {
  commands: Command[]
}
