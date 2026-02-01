import type { NodeSchema } from '@vela/core'

/**
 * 组件索引管理
 * 提供 O(1) 时间复杂度的节点查找
 */
export function useComponentIndex() {
  /**
   * 节点索引：id -> NodeSchema
   * 用于 O(1) 时间复杂度的节点查找
   */
  const nodeIndex = new Map<string, NodeSchema>()

  /**
   * 父节点索引：childId -> parentId
   * 用于 O(1) 时间复杂度的父节点查找
   */
  const parentIndex = new Map<string, string>()

  /**
   * 递归遍历树
   */
  function traverse(
    node: NodeSchema,
    callback: (node: NodeSchema, parent: NodeSchema | null) => void,
    parent: NodeSchema | null = null,
  ) {
    callback(node, parent)

    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        traverse(child, callback, node)
      }
    }
  }

  /**
   * 重建整个索引（在加载新树时调用）
   */
  function rebuildIndex(rootNode: NodeSchema | null) {
    nodeIndex.clear()
    parentIndex.clear()

    if (!rootNode) return

    traverse(rootNode, (node, parent) => {
      nodeIndex.set(node.id, node)
      if (parent) {
        parentIndex.set(node.id, parent.id)
      }
    })

    console.log(`[ComponentIndex] Index rebuilt: ${nodeIndex.size} nodes`)
  }

  /**
   * 向索引中添加节点（增量更新）
   */
  function indexNode(node: NodeSchema, parentId?: string) {
    nodeIndex.set(node.id, node)
    if (parentId) {
      parentIndex.set(node.id, parentId)
    }

    // 递归索引子节点
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        indexNode(child, node.id)
      }
    }
  }

  /**
   * 从索引中移除节点（增量更新）
   */
  function unindexNode(id: string) {
    const node = nodeIndex.get(id)
    if (!node) return

    // 递归移除子节点的索引
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        unindexNode(child.id)
      }
    }

    nodeIndex.delete(id)
    parentIndex.delete(id)
  }

  /**
   * O(1) 节点查找
   */
  function findNodeById(targetId: string): NodeSchema | null {
    return nodeIndex.get(targetId) || null
  }

  /**
   * O(1) 父节点查找
   */
  function findParentNode(targetId: string): NodeSchema | null {
    const parentId = parentIndex.get(targetId)
    if (!parentId) return null
    return nodeIndex.get(parentId) || null
  }

  /**
   * 获取节点在父节点中的索引
   */
  function getNodeIndex(id: string): number {
    const parentId = parentIndex.get(id)
    if (!parentId) return -1

    const parent = nodeIndex.get(parentId)
    if (!parent?.children) return -1

    return parent.children.findIndex((child) => child.id === id)
  }

  /**
   * 获取节点的父节点 ID
   */
  function getParentId(id: string): string | null {
    return parentIndex.get(id) || null
  }

  return {
    nodeIndex,
    parentIndex,
    traverse,
    rebuildIndex,
    indexNode,
    unindexNode,
    findNodeById,
    findParentNode,
    getNodeIndex,
    getParentId,
  }
}

export type ComponentIndexContext = ReturnType<typeof useComponentIndex>
