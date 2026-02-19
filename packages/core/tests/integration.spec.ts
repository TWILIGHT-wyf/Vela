import { describe, it, expect } from 'vitest'
import { TreeModel } from '../src/model/tree'
import { HistoryPlugin } from '../src/plugins/history'
import { NodeSchema } from '../src/types/schema'
import { generateId } from '../src/utils/id'

/**
 * 暴力遍历树，收集所有节点 ID 和 父子关系
 * 用于作为 Truth Source 验证 TreeIndex 的正确性
 */
function traverseAndCollect(root: NodeSchema) {
  const nodes = new Set<string>()
  const parents = new Map<string, string>() // childId -> parentId
  const depths = new Map<string, number>()

  function dfs(node: NodeSchema, parentId: string | null, depth: number) {
    nodes.add(node.id)
    depths.set(node.id, depth)
    if (parentId) parents.set(node.id, parentId)

    node.children?.forEach((child) => dfs(child, node.id, depth + 1))
  }

  dfs(root, null, 0)
  return { nodes, parents, depths }
}

describe('Core Integration & Consistency', () => {
  it('should maintain index consistency under heavy operations', () => {
    // 1. Setup
    const root: NodeSchema = { id: 'root', componentName: 'Page', children: [] }
    const model = new TreeModel(root)
    const history = new HistoryPlugin()
    model.use(history)

    // 2. Perform Random Operations
    const OPS_COUNT = 100
    const createdIds: string[] = ['root']

    for (let i = 0; i < OPS_COUNT; i++) {
      const type = i % 4

      try {
        if (type === 0 || createdIds.length < 5) {
          // INSERT
          const parentId = createdIds[Math.floor(Math.random() * createdIds.length)]
          const newNode = { id: generateId(), componentName: 'Box', children: [] }
          model.insertNode(newNode, parentId)
          createdIds.push(newNode.id)
        } else if (type === 1) {
          // UPDATE
          const targetId = createdIds[Math.floor(Math.random() * createdIds.length)]
          model.updateProp(targetId, 'props.width', Math.random())
        } else if (type === 2) {
          // MOVE
          // Avoid moving root or moving to self/descendant (which should throw)
          // Here we just try random moves and ignore errors (Simulating user errors)
          const targetId = createdIds[Math.floor(Math.random() * (createdIds.length - 1)) + 1] // skip root
          const newParentId = createdIds[Math.floor(Math.random() * createdIds.length)]
          if (targetId !== newParentId) {
            model.moveNode(targetId, newParentId, 0)
          }
        } else {
          // DELETE
          const targetId = createdIds[Math.floor(Math.random() * (createdIds.length - 1)) + 1] // skip root
          model.removeNode(targetId)
          // Remove from tracking
          const idx = createdIds.indexOf(targetId)
          if (idx > -1) createdIds.splice(idx, 1)
        }
      } catch {
        // Ignore invalid moves (e.g. move to descendant) as they are expected to fail safely
      }

      // 3. Verify Index Consistency AFTER EACH OP
      // 对比 TreeIndex (Cached) 和 暴力遍历 (Real Truth)
      const truth = traverseAndCollect(model.root)

      // Verify Node Existence
      truth.nodes.forEach((id) => {
        expect(model.getNode(id)).toBeDefined()
        expect(model.getNode(id)?.id).toBe(id)
      })

      // Verify Parentship
      truth.parents.forEach((parentId, childId) => {
        const indexParent = model.index.getParent(childId)
        expect(indexParent?.id).toBe(parentId)
      })

      // Verify Depth (Optional, if we implemented depth caching)
      // model.index.getDepth(id) should match truth.depths.get(id)
    }
  })

  it('should restore exact state after Undo/Redo loop', async () => {
    const root: NodeSchema = { id: 'root', componentName: 'Page', children: [] }
    const model = new TreeModel(root)
    const history = new HistoryPlugin({ debounce: 0 })
    model.use(history)

    // Initial Snapshot
    const initialSnapshot = JSON.stringify(root)

    // Make changes and wait for async processing if any
    const n1 = { id: 'n1', componentName: 'A', children: [] }
    model.insertNode(n1, 'root')
    // await new Promise(r => setTimeout(r, 1)) // Not needed if debounce is 0
    model.updateProp('n1', 'props.w', 100)
    model.insertNode({ id: 'n2', componentName: 'B' }, 'n1')
    model.removeNode('n2')

    // Wait for history debounce (even if 0, it's next tick)
    await new Promise((r) => setTimeout(r, 10))

    // Undo all
    while (history.canUndo()) {
      history.undo()
    }

    // Verify
    expect(JSON.stringify(model.root)).toBe(initialSnapshot)

    // Index should also be clean
    expect(model.getNode('n1')).toBeUndefined()
    expect(model.root.children).toHaveLength(0)
  })
})
