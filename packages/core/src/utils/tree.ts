import { NodeSchema } from '../types/schema'

/**
 * 树索引器：提供 O(1) 的节点查找能力
 * 建议在 Store 中维护一个实例，并在树结构变化时调用 rebuild
 */
export class TreeIndex {
  // ID -> Node
  public nodeMap = new Map<string, NodeSchema>()
  // ID -> Parent Node
  public parentMap = new Map<string, NodeSchema>()
  // ID -> Depth (Root = 0)
  public depthMap = new Map<string, number>()

  constructor(root?: NodeSchema) {
    if (root) this.rebuild(root)
  }

  /**
   * 重建索引 (全量)
   * 复杂度: O(N)
   */
  rebuild(root: NodeSchema) {
    this.nodeMap.clear()
    this.parentMap.clear()
    this.depthMap.clear()
    this._index(root, 0)
  }

  private _index(node: NodeSchema, depth: number, parent?: NodeSchema) {
    this.nodeMap.set(node.id, node)
    this.depthMap.set(node.id, depth)

    if (parent) {
      this.parentMap.set(node.id, parent)
    }

    if (node.children) {
      for (const child of node.children) {
        this._index(child, depth + 1, node)
      }
    }

    if (node.slots) {
      for (const slotChildren of Object.values(node.slots)) {
        for (const child of slotChildren) {
          this._index(child, depth + 1, node)
        }
      }
    }
  }

  /** 获取节点 O(1) */
  getNode(id: string): NodeSchema | undefined {
    return this.nodeMap.get(id)
  }

  /** 获取父节点 O(1) */
  getParent(id: string): NodeSchema | undefined {
    return this.parentMap.get(id)
  }

  /** 获取节点深度 O(1) */
  getDepth(id: string): number {
    return this.depthMap.get(id) ?? -1
  }

  /**
   * 获取节点路径 (从根到该节点)
   * @returns NodeSchema[]
   */
  getPath(id: string): NodeSchema[] {
    const path: NodeSchema[] = []
    let current = this.getNode(id)
    while (current) {
      path.push(current)
      const parent = this.getParent(current.id)
      current = parent
    }
    return path.reverse()
  }
}

/**
 * 深度优先查找节点
 */
export function findNodeById(root: NodeSchema, id: string): NodeSchema | null {
  if (root.id === id) return root
  if (root.children) {
    for (const child of root.children) {
      const found = findNodeById(child, id)
      if (found) return found
    }
  }
  if (root.slots) {
    for (const slotChildren of Object.values(root.slots)) {
      for (const child of slotChildren) {
        const found = findNodeById(child, id)
        if (found) return found
      }
    }
  }
  return null
}

/**
 * 查找父节点
 * @returns [parentNode, indexInParent]
 */
export function findParent(
  root: NodeSchema,
  targetId: string,
): { parent: NodeSchema; index: number; slot?: string } | null {
  if (root.children) {
    for (let i = 0; i < root.children.length; i++) {
      const child = root.children[i]
      if (child.id === targetId) {
        return { parent: root, index: i }
      }
      const found = findParent(child, targetId)
      if (found) return found
    }
  }

  if (root.slots) {
    for (const [slotName, slotChildren] of Object.entries(root.slots)) {
      for (let i = 0; i < slotChildren.length; i++) {
        const child = slotChildren[i]
        if (child.id === targetId) {
          return { parent: root, index: i, slot: slotName }
        }
        const found = findParent(child, targetId)
        if (found) return found
      }
    }
  }

  return null
}

/**
 * 遍历树 (支持中断)
 * @param callback 返回 false 时停止遍历
 */
export function traverse(root: NodeSchema, callback: (node: NodeSchema) => boolean | void) {
  const shouldStop = callback(root) === false
  if (shouldStop) return

  if (root.children) {
    for (const child of root.children) {
      traverse(child, callback)
    }
  }

  if (root.slots) {
    for (const slotChildren of Object.values(root.slots)) {
      for (const child of slotChildren) {
        traverse(child, callback)
      }
    }
  }
}

/**
 * 将树拍平成列表 (DFS顺序)
 */
export function flattenTree(root: NodeSchema): NodeSchema[] {
  const result: NodeSchema[] = []
  traverse(root, (node) => {
    result.push(node)
  })
  return result
}

/**
 * 从树中移除节点
 * @returns 被移除的节点或 null
 */
export function removeNode(root: NodeSchema, targetId: string): NodeSchema | null {
  const result = findParent(root, targetId)
  if (!result) return null

  const { parent, index, slot } = result
  if (slot) {
    const slotChildren = parent.slots?.[slot]
    if (!slotChildren) return null
    const [removed] = slotChildren.splice(index, 1)
    return removed ?? null
  }

  if (!parent.children) return null
  const [removed] = parent.children.splice(index, 1)
  return removed ?? null
}

/**
 * 插入节点到指定父容器
 */
export function insertNode(
  root: NodeSchema,
  targetNode: NodeSchema,
  parentId: string,
  index?: number,
): boolean {
  const parent = findNodeById(root, parentId)
  if (!parent) return false

  // 初始化 children 数组
  if (!parent.children) {
    parent.children = []
  }

  // 计算插入位置
  const insertIndex =
    typeof index === 'number' && index >= 0 && index <= parent.children.length
      ? index
      : parent.children.length

  parent.children.splice(insertIndex, 0, targetNode)
  return true
}
