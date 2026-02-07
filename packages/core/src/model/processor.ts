import { NodeSchema } from '../types/schema'
import { Operation, UpdateOp, InsertOp, DeleteOp, MoveOp } from '../runtime/operation'
import { TreeIndex, findNodeById } from '../utils/tree'
import { getValueByPath, setValueByPath } from '../utils/object'

/**
 * 操作执行器：将原子操作应用到节点树
 * @param root 根节点
 * @param op 原子操作
 * @param index (可选) 如果提供索引，会在操作过程中同步更新索引
 */
export function applyOperation(root: NodeSchema, op: Operation, index?: TreeIndex): void {
  switch (op.type) {
    case 'update':
      applyUpdate(root, op, index)
      break
    case 'insert':
      applyInsert(root, op, index)
      break
    case 'delete':
      applyDelete(root, op, index)
      break
    case 'move':
      applyMove(root, op, index)
      break
  }
}

function applyUpdate(root: NodeSchema, op: UpdateOp, index?: TreeIndex) {
  let targetNode = root

  if (index) {
    const node = index.getNode(op.nodeId)
    if (!node) throw new Error(`Node not found: ${op.nodeId}`)
    targetNode = node
  } else {
    // Fallback: manual search
    // If nodeId is root, targetNode is root
    if (root.id !== op.nodeId) {
      const node = findNodeById(root, op.nodeId)
      if (!node) throw new Error(`Node not found: ${op.nodeId}`)
      targetNode = node
    }
  }

  // 执行更新
  if (op.strategy === 'merge' && typeof op.value === 'object' && op.value !== null) {
    const original = getValueByPath(targetNode, op.path) || {}
    setValueByPath(targetNode, op.path, { ...original, ...op.value })
  } else {
    setValueByPath(targetNode, op.path, op.value)
  }
}

function applyInsert(root: NodeSchema, op: InsertOp, index?: TreeIndex) {
  let parent = index?.getNode(op.parentId)

  // Fallback: 如果没有索引，手动查找
  if (!parent) {
    parent = findNodeById(root, op.parentId) || undefined
  }

  if (!parent) throw new Error(`Parent node not found: ${op.parentId}`)

  if (!parent.children) parent.children = []

  // 越界保护
  const insertIndex = Math.min(Math.max(op.index, 0), parent.children.length)
  parent.children.splice(insertIndex, 0, op.node)

  // 更新索引
  if (index) {
    index.rebuild(root)
  }
}

function applyDelete(root: NodeSchema, op: DeleteOp, index?: TreeIndex) {
  let parent = index?.getNode(op.parentId)

  // Fallback
  if (!parent) {
    parent = findNodeById(root, op.parentId) || undefined
  }

  if (!parent) throw new Error(`Parent node not found or empty: ${op.parentId}`)

  if (parent.children) {
    const idx = parent.children.findIndex((n) => n.id === op.nodeId)
    if (idx > -1) {
      parent.children.splice(idx, 1)
    }
  }

  if (parent.slots) {
    for (const slotChildren of Object.values(parent.slots)) {
      const idx = slotChildren.findIndex((n) => n.id === op.nodeId)
      if (idx > -1) {
        slotChildren.splice(idx, 1)
        break
      }
    }
  }

  if (index) {
    index.rebuild(root)
  }
}

function applyMove(root: NodeSchema, op: MoveOp, index?: TreeIndex) {
  // 1. Delete from old
  let fromParent = index?.getNode(op.fromParentId)
  if (!fromParent) fromParent = findNodeById(root, op.fromParentId) || undefined

  if (!fromParent) throw new Error(`Source parent not found: ${op.fromParentId}`)

  // Always find node by ID for robustness (index may be stale)
  let node: NodeSchema | undefined

  if (fromParent.children) {
    const realIndex = fromParent.children.findIndex((n) => n.id === op.nodeId)
    if (realIndex > -1) {
      ;[node] = fromParent.children.splice(realIndex, 1)
    }
  }

  if (!node && fromParent.slots) {
    for (const slotChildren of Object.values(fromParent.slots)) {
      const realIndex = slotChildren.findIndex((n) => n.id === op.nodeId)
      if (realIndex > -1) {
        ;[node] = slotChildren.splice(realIndex, 1)
        break
      }
    }
  }

  if (!node) throw new Error(`Node not found in source parent: ${op.nodeId}`)

  // 2. Insert to new
  let toParent = index?.getNode(op.toParentId)
  if (!toParent) toParent = findNodeById(root, op.toParentId) || undefined

  if (!toParent) throw new Error(`Target parent not found: ${op.toParentId}`)

  if (!toParent.children) toParent.children = []
  const toIndex = Math.min(Math.max(op.toIndex, 0), toParent.children.length)

  // Reuse the removed node (this assumes node object reference is preserved)
  // In `applyMove` we usually assume `op` doesn't carry full node data,
  // so we must move the actual object found in step 1.
  toParent.children.splice(toIndex, 0, node) // node from step 1

  if (index) index.rebuild(root)
}
