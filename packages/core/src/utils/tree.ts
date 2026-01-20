import { NodeSchema } from '../types/schema'

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
  return null
}

/**
 * 查找父节点
 * @returns [parentNode, indexInParent]
 */
export function findParent(
  root: NodeSchema,
  targetId: string,
): { parent: NodeSchema; index: number } | null {
  if (!root.children) return null

  for (let i = 0; i < root.children.length; i++) {
    const child = root.children[i]
    if (child.id === targetId) {
      return { parent: root, index: i }
    }
    const found = findParent(child, targetId)
    if (found) return found
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

  const { parent, index } = result
  if (!parent.children) return null

  const [removed] = parent.children.splice(index, 1)
  return removed
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
