import { Operation, InsertOp, DeleteOp, UpdateOp, MoveOp } from '../types/operation'
import { TreeModel } from './tree'
import { debounce, DebouncedFunction } from '../utils/lodash'

export interface HistoryOptions {
  maxSize?: number
  debounce?: number
}

/**
 * 历史记录管理器
 * 负责 Undo/Redo 逻辑
 */
export class HistoryManager {
  private undoStack: Operation[][] = []
  private redoStack: Operation[][] = []
  private model: TreeModel
  private maxSize: number

  // 事务缓冲 (用于合并短时间内的连续操作，如拖拽)
  private buffer: Operation[] = []
  private commitDebounced: DebouncedFunction<() => void>
  private operationHandler: (op: Operation) => void

  // 使用 WeakSet 追踪系统操作（Undo/Redo 触发的），避免污染 Operation 类型
  private systemOps = new WeakSet<Operation>()

  constructor(model: TreeModel, options: HistoryOptions = {}) {
    this.model = model
    this.maxSize = options.maxSize || 50

    // 初始化防抖提交
    this.commitDebounced = debounce(() => this.commit(), options.debounce ?? 200)

    // 监听模型操作
    this.operationHandler = (op: Operation) => {
      // 只有非撤销/重做触发的操作才记录
      if (!this.systemOps.has(op)) {
        this.buffer.push(op)
        this.commitDebounced()
      }
    }
    this.model.on('operation', this.operationHandler)
  }

  /**
   * 销毁历史管理器，清理事件监听
   */
  dispose() {
    this.commitDebounced.cancel()
    this.model.off('operation', this.operationHandler)
    this.undoStack = []
    this.redoStack = []
    this.buffer = []
    this.systemOps = new WeakSet<Operation>()
  }

  /**
   * 提交当前缓冲区的操作为一个历史步骤
   * @param clearRedo 是否清空 Redo 栈（默认 true）
   */
  private commit(clearRedo = true) {
    if (this.buffer.length === 0) return

    this.undoStack.push([...this.buffer])
    this.buffer = []

    // 清空 Redo 栈 (新用户操作会使 Redo 失效)
    // 但由 Undo 触发的 commit 不应清空 Redo 栈
    if (clearRedo) {
      this.redoStack = []
    }

    // 限制栈大小
    if (this.undoStack.length > this.maxSize) {
      this.undoStack.shift()
    }

    console.log('[History] Snapshot commited. Undo stack:', this.undoStack.length)
  }

  /**
   * 撤销
   */
  undo() {
    // 如果有未提交的缓冲，先强制提交
    // 使用 clearRedo=false 避免清空 redo 栈
    if (this.buffer.length > 0) {
      // 取消待执行的防抖
      this.commitDebounced.cancel()
      // 提交但不清空 redo 栈
      this.commit(false)
    }

    const ops = this.undoStack.pop()
    if (!ops) return

    // 计算逆操作 (反向执行)
    const inverseOps = ops.map((op) => this.invertOp(op)).reverse()

    // 执行逆操作
    inverseOps.forEach((op) => {
      this.systemOps.add(op) // 标记为系统操作，不记录历史
      this.model.dispatch(op)
    })

    // 入 Redo 栈 (存原始操作)
    this.redoStack.push(ops)
  }

  /**
   * 重做
   */
  redo() {
    const ops = this.redoStack.pop()
    if (!ops) return

    // 重新执行正向操作
    ops.forEach((op) => {
      this.systemOps.add(op) // 标记为系统操作，不记录历史
      this.model.dispatch(op)
    })

    // 入 Undo 栈
    this.undoStack.push(ops)
  }

  canUndo() {
    return this.undoStack.length > 0
  }

  canRedo() {
    return this.redoStack.length > 0
  }

  /**
   * 生成逆操作
   */
  private invertOp(op: Operation): Operation {
    switch (op.type) {
      case 'insert':
        return this.invertInsert(op)
      case 'delete':
        return this.invertDelete(op)
      case 'update':
        return this.invertUpdate(op)
      case 'move':
        return this.invertMove(op)
    }
    // TypeScript exhaustive check - 如果有新的 op.type 未处理，这里会编译报错
    const _exhaustive: never = op
    throw new Error(`Unknown op type: ${(_exhaustive as Operation).type}`)
  }

  private invertInsert(op: InsertOp): DeleteOp {
    // InsertOp 和 DeleteOp 结构相同，只是 type 不同
    return {
      id: op.id,
      type: 'delete',
      timestamp: op.timestamp,
      userId: op.userId,
      nodeId: op.nodeId,
      parentId: op.parentId,
      index: op.index,
      node: op.node,
    }
  }

  private invertDelete(op: DeleteOp): InsertOp {
    return {
      id: op.id,
      type: 'insert',
      timestamp: op.timestamp,
      userId: op.userId,
      nodeId: op.nodeId,
      parentId: op.parentId,
      index: op.index,
      node: op.node,
    }
  }

  private invertUpdate(op: UpdateOp): UpdateOp {
    return {
      ...op,
      value: op.oldValue,
      oldValue: op.value,
    }
  }

  private invertMove(op: MoveOp): MoveOp {
    return {
      ...op,
      fromParentId: op.toParentId,
      toParentId: op.fromParentId,
      fromIndex: op.toIndex,
      toIndex: op.fromIndex,
    }
  }
}
