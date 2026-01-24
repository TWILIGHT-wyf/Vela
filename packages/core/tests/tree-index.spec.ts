import { describe, it, expect } from 'vitest'
import { TreeIndex } from '../src/utils/tree'
import { NodeSchema } from '../src/types/schema'

describe('TreeIndex', () => {
  const root: NodeSchema = {
    id: 'root',
    componentName: 'Page',
    children: [
      {
        id: 'child1',
        componentName: 'Box',
        children: [{ id: 'grandchild1', componentName: 'Text' }],
      },
      { id: 'child2', componentName: 'Button' },
    ],
  }

  it('should build index correctly', () => {
    const index = new TreeIndex(root)

    expect(index.getNode('root')).toBe(root)
    expect(index.getNode('child1')?.id).toBe('child1')
    expect(index.getNode('grandchild1')?.id).toBe('grandchild1')
    expect(index.getNode('unknown')).toBeUndefined()
  })

  it('should find parent', () => {
    const index = new TreeIndex(root)

    const p1 = index.getParent('child1')
    expect(p1?.id).toBe('root')

    const p2 = index.getParent('grandchild1')
    expect(p2?.id).toBe('child1')

    const p3 = index.getParent('root')
    expect(p3).toBeUndefined()
  })

  it('should calculate depth', () => {
    const index = new TreeIndex(root)

    expect(index.getDepth('root')).toBe(0)
    expect(index.getDepth('child1')).toBe(1)
    expect(index.getDepth('grandchild1')).toBe(2)
  })

  it('should get path', () => {
    const index = new TreeIndex(root)

    const path = index.getPath('grandchild1')
    const ids = path.map((n) => n.id)

    expect(ids).toEqual(['root', 'child1', 'grandchild1'])
  })
})
