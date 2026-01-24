import { describe, it, expect } from 'vitest'
import { diff } from '../src/utils/diff'

describe('Diff Engine', () => {
  const nodeId = 'node-1'

  it('should return empty for identical objects', () => {
    const a = { x: 1, y: 2 }
    const b = { x: 1, y: 2 }
    const ops = diff(a, b, nodeId)
    expect(ops).toHaveLength(0)
  })

  it('should detect simple updates', () => {
    const a = { x: 1 }
    const b = { x: 2 }
    const ops = diff(a, b, nodeId)

    expect(ops).toHaveLength(1)
    expect(ops[0]).toMatchObject({
      type: 'update',
      nodeId,
      path: 'props.x',
      value: 2,
      oldValue: 1,
    })
  })

  it('should detect nested updates', () => {
    const a = { style: { color: 'red' } }
    const b = { style: { color: 'blue' } }
    const ops = diff(a, b, nodeId)

    expect(ops).toHaveLength(1)
    expect(ops[0].path).toBe('props.style.color')
    expect(ops[0].value).toBe('blue')
  })

  it('should handle array as atomic replacement', () => {
    // Current diff engine treats arrays as atomic (doesn't diff inside arrays)
    const a = { list: [1, 2] }
    const b = { list: [1, 3] }
    const ops = diff(a, b, nodeId)

    expect(ops).toHaveLength(1)
    expect(ops[0].path).toBe('props.list')
    expect(ops[0].value).toEqual([1, 3])
  })
})
