import { NodeSchema } from '../types/schema'
import { Operation, InsertOp, DeleteOp, UpdateOp, MoveOp, Transaction } from '../types/operation'
import { TreeIndex } from '../utils/tree'
import { applyOperation } from './processor'
import { Validator } from './validator'
import { MaterialMeta } from '../types/material'
import { TypedEmitter } from '../utils/events'
import { generateId } from '../utils/id'
import { Plugin, PluginContext } from '../types/plugin'
import { getValueByPath } from '../utils/object'
import { deepClone } from '../utils/clone'

/**
 * 模型事件定义
 */
export interface TreeModelEvents {
  /** 任何原子操作发生后触发 */
  operation: Operation
  /** 事务提交后触发 */
  transaction: Transaction
  /** 树结构变化 (operation 的别名) */
  change: { root: NodeSchema; op?: Operation; transaction?: Transaction }
  /** 错误发生时 */
  error: Error
  /** 插件注册时 */
  plugin: string
  /** Index signature for TypedEmitter compatibility */
  [key: string]: unknown
}

/**
 * 树模型：Core 的核心控制器
 * 封装了 Data + Index + Logic + Events + Plugins
 */
export class TreeModel extends TypedEmitter<TreeModelEvents> {
  private _root: NodeSchema
  private _index: TreeIndex
  private _metaMap: Record<string, MaterialMeta> = {}
  private _plugins = new Map<string, Plugin>()
  private _opListeners = new Set<(op: Operation) => void>()
  private _disposeCallbacks: (() => void)[] = []

  // Batch 状态
  private _isBatching = false
  private _batchBuffer: Operation[] = []

  constructor(root: NodeSchema, metaMap?: Record<string, MaterialMeta>) {
    super()
    this._root = root
    this._index = new TreeIndex(root)
    if (metaMap) this._metaMap = metaMap
  }

  get root() {
    return this._root
  }
  get index() {
    return this._index
  }

  setMetaMap(map: Record<string, MaterialMeta>) {
    this._metaMap = map
  }

  /**
   * 注册插件
   */
  use(plugin: Plugin): this {
    if (this._plugins.has(plugin.name)) {
      console.warn(`Plugin ${plugin.name} already registered`)
      return this
    }

    const context: PluginContext = {
      model: this,
      onOp: (cb) => {
        this._opListeners.add(cb)
        // Return unsubscribe function for cleanup
        this._disposeCallbacks.push(() => this._opListeners.delete(cb))
      },
      onDispose: (cb) => {
        this._disposeCallbacks.push(cb)
      },
    }

    plugin.init(context)
    this._plugins.set(plugin.name, plugin)
    this.emit('plugin', plugin.name)
    return this
  }

  /**
   * 获取插件实例
   */
  getPlugin<T extends Plugin>(name: string): T | undefined {
    return this._plugins.get(name) as T
  }

  getNode(id: string) {
    return this._index.getNode(id)
  }

  /**
   * 销毁模型，清理所有资源
   * 在编辑器卸载或重新初始化时调用
   */
  dispose() {
    // 1. 执行所有销毁回调
    this._disposeCallbacks.forEach((cb) => {
      try {
        cb()
      } catch (e) {
        console.error('Dispose callback failed', e)
      }
    })
    this._disposeCallbacks = []

    // 2. 销毁插件
    this._plugins.forEach((plugin) => {
      if (plugin.destroy) {
        try {
          plugin.destroy()
        } catch (e) {
          console.error(`Plugin ${plugin.name} destroy failed`, e)
        }
      }
    })
    this._plugins.clear()

    // 3. 清理监听器
    this._opListeners.clear()
    this.clear() // TypedEmitter.clear()

    // 4. 清理索引
    this._index.nodeMap.clear()
    this._index.parentMap.clear()
    this._index.depthMap.clear()
  }

  /**
   * 开启批量操作
   * 在 callback 中的所有操作将合并为一个 Transaction
   * 且期间不会触发索引重建和事件通知
   */
  batch(callback: () => void, label: string = 'batch-operation') {
    if (this._isBatching) {
      // 嵌套 batch，直接执行
      callback()
      return
    }

    this._isBatching = true
    this._batchBuffer = []

    try {
      callback()
    } catch (e) {
      console.error('Batch operation failed', e)

      // Rollback logic: Undo operations in reverse order
      // We need to implement inverse operations or restore from snapshot
      // Since we don't have full history here, we rely on inverse ops

      // Since this._batchBuffer contains all ops done so far
      // We can iterate backwards and apply inverse

      console.log('Rolling back batch operations:', this._batchBuffer.length)

      const opsToRollback = [...this._batchBuffer].reverse()

      // Temporarily disable batching to apply undo directly
      this._isBatching = false

      opsToRollback.forEach((op) => {
        const inverseOp = this.createInverseOp(op)
        if (inverseOp) {
          try {
            // Apply inverse without emitting events or recording to history
            // We can use applyOperation directly but we need to update index
            // Or we can use dispatch but suppress events?
            // Simplest is direct applyOperation
            applyOperation(this._root, inverseOp, this._index)
          } catch (undoErr) {
            console.error('Failed to rollback op', op, undoErr)
          }
        }
      })

      this._batchBuffer = [] // Clear buffer after rollback
      return // Exit without flushing
    } finally {
      this._isBatching = false
      this.flushBatch(label)
    }
  }

  private flushBatch(label: string) {
    if (this._batchBuffer.length === 0) return

    // 1. Rebuild Index (一次性)
    this._index.rebuild(this._root)

    // 2. Create Transaction
    const transaction: Transaction = {
      id: generateId(),
      name: label,
      timestamp: Date.now(),
      ops: [...this._batchBuffer],
    }

    // 3. Emit Events
    // 逐个触发 op 事件以便某些插件记录，或者直接触发 transaction
    // 更好的做法是触发 transaction，由 History 插件处理
    this.emit('transaction', transaction)
    this.emit('change', { root: this._root, transaction })

    // Clear buffer
    this._batchBuffer = []
  }

  private createInverseOp(op: Operation): Operation | null {
    switch (op.type) {
      case 'update':
        return {
          ...op,
          id: generateId(),
          value: op.oldValue,
          oldValue: op.value,
          timestamp: Date.now(),
        }
      case 'insert':
        return {
          id: generateId(),
          type: 'delete',
          nodeId: op.nodeId,
          parentId: op.parentId,
          index: op.index,
          timestamp: Date.now(),
          node: op.node,
        }
      case 'delete':
        return {
          id: generateId(),
          type: 'insert',
          nodeId: op.nodeId,
          parentId: op.parentId,
          index: op.index,
          timestamp: Date.now(),
          node: op.node,
        }
      case 'move':
        return {
          ...op,
          id: generateId(),
          fromParentId: op.toParentId,
          toParentId: op.fromParentId,
          fromIndex: op.toIndex,
          toIndex: op.fromIndex,
          timestamp: Date.now(),
        }
    }
    return null
  }

  /**
   * 执行操作 (这是修改树的唯一入口)
   */
  dispatch(op: Operation) {
    try {
      // 1. Pre-validation (Constraints)
      if (op.type === 'insert') {
        const parent = this.getNode(op.parentId)
        if (parent) {
          Validator.validateInsert(parent, op.node, this._metaMap)
        }
      }

      // 2. Execution
      // 如果在 batch 中，暂时不更新索引 (index=undefined)
      // 但某些操作依赖索引（如 insert 找 parent），这有点矛盾
      // 解决方案：Batch 期间如果涉及结构变更，还是得更新索引，或者是局部更新
      // 简单方案：Batch 期间依然更新索引（或者使用脏标记），只是不发事件
      // 鉴于 applyOperation 内部依赖 index 来查找节点，我们必须传递 index
      // 性能瓶颈主要在 "Full Rebuild"。如果 applyOperation 能做增量更新就好。
      // 目前 applyOperation 调用了 index.rebuild() 是全量的。
      // 优化：修改 applyOperation，支持 skipIndexUpdate

      const shouldUpdateIndex = !this._isBatching
      applyOperation(this._root, op, shouldUpdateIndex ? this._index : undefined)

      // 3. Post-processing
      if (this._isBatching) {
        this._batchBuffer.push(op)
      } else {
        this.emit('operation', op)
        this.emit('change', { root: this._root, op })
        this._opListeners.forEach((cb) => cb(op))
      }
    } catch (error) {
      this.emit('error', error as Error)
      throw error // Re-throw to caller
    }
  }

  /**
   * 便捷方法：插入
   */
  insertNode(node: NodeSchema, parentId: string, index: number = -1): InsertOp {
    const parent = this.getNode(parentId)
    if (!parent) throw new Error(`Parent ${parentId} not found`)

    const actualIndex = index < 0 ? parent.children?.length || 0 : index

    const op: InsertOp = {
      id: generateId(),
      type: 'insert',
      timestamp: Date.now(),
      nodeId: node.id,
      parentId,
      index: actualIndex,
      node,
    }

    this.dispatch(op)
    return op
  }

  /**
   * 便捷方法：更新属性
   */
  updateProp(nodeId: string, path: string, value: any): UpdateOp {
    const node = this.getNode(nodeId)
    if (!node) throw new Error(`Node ${nodeId} not found`)

    // 获取旧值
    const rawOldValue = getValueByPath(node, path)
    const oldValue = rawOldValue === undefined ? undefined : deepClone(rawOldValue)

    const op: UpdateOp = {
      id: generateId(),
      type: 'update',
      timestamp: Date.now(),
      nodeId,
      path,
      value,
      oldValue,
    }

    this.dispatch(op)
    return op
  }

  /**
   * 便捷方法：删除
   */
  removeNode(nodeId: string): DeleteOp {
    const node = this.getNode(nodeId)
    if (!node) throw new Error(`Node ${nodeId} not found`)

    const parent = this._index.getParent(nodeId)
    if (!parent) throw new Error(`Cannot remove root node`)

    const index = parent.children?.indexOf(node) ?? -1

    const op: DeleteOp = {
      id: generateId(),
      type: 'delete',
      timestamp: Date.now(),
      nodeId,
      parentId: parent.id,
      index,
      node: deepClone(node), // Snapshot for undo
    }

    this.dispatch(op)
    return op
  }

  /**
   * 便捷方法：移动
   */
  moveNode(nodeId: string, toParentId: string, toIndex: number): MoveOp {
    const node = this.getNode(nodeId)
    if (!node) throw new Error(`Node ${nodeId} not found`)

    const fromParent = this._index.getParent(nodeId)
    if (!fromParent) throw new Error(`Cannot move root`)

    const fromIndex = fromParent.children?.indexOf(node) ?? -1

    const op: MoveOp = {
      id: generateId(),
      type: 'move',
      timestamp: Date.now(),
      nodeId,
      fromParentId: fromParent.id,
      toParentId,
      fromIndex,
      toIndex,
    }

    this.dispatch(op)
    return op
  }
}
