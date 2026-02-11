import { describe, expect, it } from 'vitest'
import type { NodeSchema } from '@vela/core'
import {
  inferDropDirectionForParent,
  isContainerComponentName,
} from '../src/components/Canvas/modes/Flow/useFlowDrop'

function createNode(partial: Partial<NodeSchema>): NodeSchema {
  return {
    id: partial.id || 'node',
    component: partial.component || 'Container',
    ...partial,
  }
}

describe('flow drop helpers', () => {
  it('infers row direction for flex row containers', () => {
    const node = createNode({
      component: 'Container',
      style: { display: 'flex', flexDirection: 'row' },
    })
    expect(inferDropDirectionForParent(node)).toBe('row')
  })

  it('infers column direction for flex column containers', () => {
    const node = createNode({
      component: 'Flex',
      style: { display: 'flex', flexDirection: 'column' },
    })
    expect(inferDropDirectionForParent(node)).toBe('column')
  })

  it('treats Flex component as row by default', () => {
    const node = createNode({ component: 'Flex' })
    expect(inferDropDirectionForParent(node)).toBe('row')
  })

  it('recognizes container component names from material registry', () => {
    expect(isContainerComponentName('Container')).toBe(true)
    expect(isContainerComponentName('Grid')).toBe(true)
    expect(isContainerComponentName('GridBox')).toBe(false)
    expect(isContainerComponentName('Card')).toBe(false)
    expect(isContainerComponentName('Button')).toBe(false)
  })
})
