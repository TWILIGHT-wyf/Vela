import { ref } from 'vue'
import { describe, expect, it } from 'vitest'
import type { NodeSchema } from '@vela/core'
import { useComponentSelection } from '@/stores/component/useComponentSelection'

function createNode(id: string, children?: NodeSchema[]): NodeSchema {
  return {
    id,
    component: 'Container',
    props: {},
    style: {},
    children,
  } as NodeSchema
}

function createSelectionHarness(root: NodeSchema) {
  const nodeIndex = new Map<string, NodeSchema>()
  const parentIndex = new Map<string, string>()

  const walk = (node: NodeSchema, parent: NodeSchema | null = null) => {
    nodeIndex.set(node.id, node)
    if (parent) {
      parentIndex.set(node.id, parent.id)
    }
    node.children?.forEach((child) => walk(child, node))
  }

  walk(root)

  return useComponentSelection({
    nodeIndex,
    parentIndex,
    indexVersion: ref(0),
    traverse: () => {},
    rebuildIndex: () => {},
    indexNode: () => {},
    unindexNode: () => {},
    findNodeById: (targetId: string) => nodeIndex.get(targetId) || null,
    findParentNode: (targetId: string) => {
      const parentId = parentIndex.get(targetId)
      return parentId ? nodeIndex.get(parentId) || null : null
    },
    getNodeIndex: (id: string) => {
      const parentId = parentIndex.get(id)
      if (!parentId) return -1
      const parent = nodeIndex.get(parentId)
      return parent?.children?.findIndex((child) => child.id === id) ?? -1
    },
    getParentId: (id: string) => parentIndex.get(id) || null,
  })
}

describe('useComponentSelection', () => {
  it('在多选时优先保留最新选择的祖先节点', () => {
    const grandChild = createNode('grand-child')
    const child = createNode('child', [grandChild])
    const root = createNode('root', [child])
    const selection = createSelectionHarness(root)

    selection.selectComponent('grand-child')
    selection.toggleSelection('child')

    expect(selection.selectedIds.value).toEqual(['child'])
    expect(selection.selectedId.value).toBe('child')
  })

  it('在多选时优先保留最新选择的后代节点', () => {
    const grandChild = createNode('grand-child')
    const child = createNode('child', [grandChild])
    const root = createNode('root', [child])
    const selection = createSelectionHarness(root)

    selection.selectComponent('child')
    selection.toggleSelection('grand-child')

    expect(selection.selectedIds.value).toEqual(['grand-child'])
    expect(selection.selectedId.value).toBe('grand-child')
  })

  it('批量选择会归一化父子节点并保留稳定的顶层集合', () => {
    const leaf = createNode('leaf')
    const child = createNode('child', [leaf])
    const sibling = createNode('sibling')
    const root = createNode('root', [child, sibling])
    const selection = createSelectionHarness(root)

    selection.selectComponents(['child', 'leaf', 'sibling'])

    expect(selection.selectedIds.value).toEqual(['child', 'sibling'])
    expect(selection.selectedId.value).toBe('sibling')
  })

  it('重复点击同一命中节点时会沿父链逐级上选', () => {
    const leaf = createNode('leaf')
    const child = createNode('child', [leaf])
    const root = createNode('root', [child])
    const selection = createSelectionHarness(root)

    expect(selection.selectByHitPath('leaf')).toBe('leaf')
    expect(selection.selectByHitPath('leaf')).toBe('child')
    expect(selection.selectByHitPath('leaf')).toBe('root')
    expect(selection.selectedIds.value).toEqual(['root'])
  })
})
