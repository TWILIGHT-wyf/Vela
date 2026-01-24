import { describe, it, expect, vi } from 'vitest'
import { TreeModel } from '../src/model/tree'
import { SelectionPlugin } from '../src/plugins/selection'
import { NodeSchema } from '../src/types/schema'

describe('Selection Plugin', () => {
  const root: NodeSchema = {
    id: 'root',
    componentName: 'Page',
    children: [],
  }

  it('should handle single selection', () => {
    const model = new TreeModel(root)
    const selection = new SelectionPlugin()
    model.use(selection)

    selection.select('node1')
    expect(selection.selection).toEqual(['node1'])

    selection.select('node2')
    expect(selection.selection).toEqual(['node2'])
  })

  it('should handle multi selection', () => {
    const model = new TreeModel(root)
    const selection = new SelectionPlugin()
    model.use(selection)

    selection.select('node1')
    selection.multiSelect('node2')
    expect(selection.selection).toHaveLength(2)
    expect(selection.selection).toContain('node1')
    expect(selection.selection).toContain('node2')

    // Toggle off
    selection.multiSelect('node1')
    expect(selection.selection).toEqual(['node2'])
  })

  it('should auto-deselect when node is deleted', () => {
    const model = new TreeModel({ ...root, children: [] })
    const selection = new SelectionPlugin()
    model.use(selection)

    // Insert node
    model.insertNode({ id: 'target', componentName: 'Button' }, 'root')

    // Select it
    selection.select('target')
    expect(selection.selection).toContain('target')

    // Delete it
    model.removeNode('target')

    // Should be deselected automatically
    expect(selection.selection).toHaveLength(0)
  })

  it('should emit change event', () => {
    const model = new TreeModel(root)
    const selection = new SelectionPlugin()
    model.use(selection)

    const spy = vi.fn()
    selection.on('change', spy)

    selection.select('node1')
    expect(spy).toHaveBeenCalledWith(['node1'])
  })
})
