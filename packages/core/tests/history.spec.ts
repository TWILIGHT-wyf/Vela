import { describe, it, expect } from 'vitest'
import { HistoryManager } from '../src/model/history'
import { TreeModel } from '../src/model/tree'
import { NodeSchema } from '../src/types/schema'

describe('History Manager', () => {
  const root: NodeSchema = {
    id: 'root',
    componentName: 'Page',
    children: [],
  }

  it('should record operations', async () => {
    const model = new TreeModel(root)
    const history = new HistoryManager(model, { debounce: 0 }) // Disable debounce for testing

    model.insertNode({ id: 'child1', componentName: 'Button' }, 'root')

    // Wait for async commit (debounce)
    await new Promise((r) => setTimeout(r, 10))

    expect(history.canUndo()).toBe(true)
  })

  it('should undo insertion', async () => {
    const model = new TreeModel({ ...root, children: [] })
    const history = new HistoryManager(model, { debounce: 0 })

    model.insertNode({ id: 'child1', componentName: 'Button' }, 'root')
    await new Promise((r) => setTimeout(r, 10))

    expect(model.root.children?.length).toBe(1)

    history.undo()
    expect(model.root.children?.length).toBe(0)
  })

  it('should redo insertion', async () => {
    const model = new TreeModel({ ...root, children: [] })
    const history = new HistoryManager(model, { debounce: 0 })

    model.insertNode({ id: 'child1', componentName: 'Button' }, 'root')
    await new Promise((r) => setTimeout(r, 10))

    history.undo()
    expect(model.root.children?.length).toBe(0)

    history.redo()
    expect(model.root.children?.length).toBe(1)
    expect(model.root.children?.[0].id).toBe('child1')
  })
})
