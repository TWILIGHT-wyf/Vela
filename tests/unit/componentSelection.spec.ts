import { ref } from 'vue'
import { describe, it, expect } from 'vitest'
import type { NodeSchema } from '@vela/core'
import { useComponentSelection } from '@/stores/component/useComponentSelection'
import type { ComponentIndexContext } from '@/stores/component/useComponentIndex'

function createIndexCtx(nodes: NodeSchema[]): ComponentIndexContext {
  const nodeIndex = new Map<string, NodeSchema>()
  const parentIndex = new Map<string, string>()

  nodes.forEach((node) => {
    nodeIndex.set(node.id, node)
  })

  return {
    nodeIndex,
    parentIndex,
    indexVersion: ref(0),
    traverse: (
      _node: NodeSchema,
      _callback: (node: NodeSchema, parent: NodeSchema | null) => void,
      _parent: NodeSchema | null = null,
    ) => {},
    rebuildIndex: (_rootNode: NodeSchema | null) => {},
    indexNode: (_node: NodeSchema, _parentId?: string) => {},
    unindexNode: (_id: string) => {},
    findNodeById: (id: string) => nodeIndex.get(id) || null,
    findParentNode: (id: string) => {
      const parentId = parentIndex.get(id)
      if (!parentId) return null
      return nodeIndex.get(parentId) || null
    },
    getNodeIndex: (_id: string) => -1,
    getParentId: (id: string) => parentIndex.get(id) || null,
  }
}

describe('useComponentSelection', () => {
  it('toggleSelection 应将最后新增节点设为主选中', () => {
    const selection = useComponentSelection(
      createIndexCtx([
        { id: 'a', component: 'Text' },
        { id: 'b', component: 'Button' },
      ]),
    )

    selection.selectComponent('a')
    selection.toggleSelection('b')

    expect(selection.selectedIds.value).toEqual(['a', 'b'])
    expect(selection.selectedId.value).toBe('b')
    expect(selection.isSelected('a')).toBe(true)
    expect(selection.isSelected('b')).toBe(true)
  })

  it('取消主选中节点时应回退到剩余节点', () => {
    const selection = useComponentSelection(
      createIndexCtx([
        { id: 'a', component: 'Text' },
        { id: 'b', component: 'Button' },
        { id: 'c', component: 'Image' },
      ]),
    )

    selection.selectComponent('a')
    selection.toggleSelection('b')
    selection.toggleSelection('c')
    selection.toggleSelection('a')

    expect(selection.selectedId.value).toBe('c')

    selection.toggleSelection('c')

    expect(selection.selectedIds.value).toEqual(['b'])
    expect(selection.selectedId.value).toBe('b')
  })

  it('selectedNodes 应过滤不存在的节点 id', () => {
    const selection = useComponentSelection(
      createIndexCtx([
        { id: 'a', component: 'Text' },
        { id: 'c', component: 'Image' },
      ]),
    )

    selection.selectComponents(['a', 'missing', 'c'])

    expect(selection.selectedNodes.value.map((node) => node.id)).toEqual(['a', 'c'])
  })
})
