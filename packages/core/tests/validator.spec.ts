import { describe, it, expect } from 'vitest'
import { TreeModel } from '../src/model/tree'
import { NodeSchema } from '../src/types/schema'
import { MaterialMeta } from '../src/types/material'

describe('Validator', () => {
  const root: NodeSchema = {
    id: 'root',
    componentName: 'Page',
    children: [],
  }

  // Mock Metadata
  const metaMap: Record<string, MaterialMeta> = {
    Container: {
      name: 'Container',
      title: 'Container',
      version: '1.0.0',
      category: 'Layout',
      isContainer: true,
      props: [],
    },
    Button: {
      name: 'Button',
      title: 'Button',
      version: '1.0.0',
      category: 'Basic',
      isContainer: false, // Not a container!
      props: [],
    },
  }

  it('should allow inserting into container', () => {
    const model = new TreeModel({ ...root, children: [] }, metaMap)

    // Insert Container into root
    model.insertNode({ id: 'box', componentName: 'Container' }, 'root')

    // Insert Button into Container
    expect(() => {
      model.insertNode({ id: 'btn', componentName: 'Button' }, 'box')
    }).not.toThrow()
  })

  it('should prevent inserting into non-container', () => {
    const model = new TreeModel({ ...root, children: [] }, metaMap)

    // Insert Button
    model.insertNode({ id: 'btn', componentName: 'Button' }, 'root')

    // Try to insert child into Button
    expect(() => {
      model.insertNode({ id: 'inner', componentName: 'Text' }, 'btn')
    }).toThrow(/non-container/i)
  })
})
