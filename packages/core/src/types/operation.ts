import { NodeSchema } from './schema'

/**
 * 操作类型枚举
 */
export type OpType = 'insert' | 'delete' | 'update' | 'move'

/**
 * 基础操作接口
 */
export interface BaseOp {
  id: string // 操作唯一ID (UUID)
  type: OpType
  timestamp: number
  userId?: string // 操作人 (用于协作)
}

/**
 * 插入节点操作
 */
export interface InsertOp extends BaseOp {
  type: 'insert'
  nodeId: string
  parentId: string
  index: number
  node: NodeSchema // 完整节点数据 (用于重做)
}

/**
 * 删除节点操作
 */
export interface DeleteOp extends BaseOp {
  type: 'delete'
  nodeId: string
  parentId: string
  index: number
  node: NodeSchema // 被删除的节点数据 (用于撤销)
}

/**
 * 更新属性操作 (支持深度路径)
 */
export interface UpdateOp extends BaseOp {
  type: 'update'
  nodeId: string
  path: string // 属性路径，如 "props.style.width"
  value: any // 新值
  oldValue: any // 旧值 (用于撤销)

  // 变更合并策略 (用于高频操作如拖拽、输入)
  // 'overwrite': 覆盖 (默认)
  // 'merge': 合并对象
  strategy?: 'overwrite' | 'merge'
}

/**
 * 移动节点操作
 */
export interface MoveOp extends BaseOp {
  type: 'move'
  nodeId: string
  fromParentId: string
  toParentId: string
  fromIndex: number
  toIndex: number
}

/**
 * 原子操作联合类型
 * 这是 Undo/Redo 栈中存储的基本单元
 */
export type Operation = InsertOp | DeleteOp | UpdateOp | MoveOp

/**
 * 事务/批处理 (Transaction)
 * 用于将多个原子操作组合成一个逻辑撤销步
 * 例如："删除容器" 可能隐含 "删除容器内所有子节点"
 */
export interface Transaction {
  id: string
  name: string // 显示名称，如 "删除组件"
  timestamp: number
  ops: Operation[]
}
