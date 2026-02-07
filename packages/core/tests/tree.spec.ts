import { describe, it, expect, vi } from 'vitest'
import { TreeModel } from '../src/model/tree'
import { NodeSchema } from '../src/types/schema'
import { Plugin } from '../src/runtime/plugin'

describe('TreeModel', () => {
  const root: NodeSchema = {
    id: 'root',
    componentName: 'Page',
    children: [],
  }

  it('should initialize correctly', () => {
    const model = new TreeModel(root)
    expect(model.root).toBe(root)
    expect(model.getNode('root')).toBe(root)
  })

  it('should insert node', () => {
    const model = new TreeModel({ ...root, children: [] })
    const node = { id: 'child1', componentName: 'Button' }

    model.insertNode(node, 'root')

    expect(model.getNode('child1')).toBe(node)
    expect(model.root.children).toHaveLength(1)
    expect(model.root.children?.[0]).toBe(node)
  })

  it('should support plugins', () => {
    const model = new TreeModel({ ...root })
    const pluginInit = vi.fn()

    const plugin: Plugin = {
      name: 'test-plugin',
      init: pluginInit,
    }

    model.use(plugin)
    expect(pluginInit).toHaveBeenCalled()
  })

  it('should handle batch operations', () => {
    const model = new TreeModel({ ...root, children: [] })
    const changeSpy = vi.fn()
    const transSpy = vi.fn()

    model.on('change', changeSpy)
    model.on('transaction', transSpy)

    model.batch(() => {
      model.insertNode({ id: 'n1', componentName: 'A' }, 'root')
      model.insertNode({ id: 'n2', componentName: 'B' }, 'root')
      // In batch, index should not update immediately (or events not fired)
      // Our implementation updates data but suspends events
    })

    // Should emit 1 transaction event and 1 change event at the end
    expect(transSpy).toHaveBeenCalledTimes(1)
    expect(changeSpy).toHaveBeenCalledTimes(1) // Only 1 change event for the transaction

    // Data should be correct
    expect(model.root.children).toHaveLength(2)
    // Index should be rebuilt
    expect(model.getNode('n1')).toBeDefined()
    expect(model.getNode('n2')).toBeDefined()
  })
})
