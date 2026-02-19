import { describe, it, expect } from 'vitest'
import { diff } from '../src/utils/diff'
import { TreeModel } from '../src/model/tree'
import { NodeSchema } from '../src/types/schema'
import { deepClone } from '../src/utils/clone'

/**
 * Fuzz Testing for Diff Engine
 * 随机生成两个对象，计算 diff，然后 patch，验证结果是否一致。
 */
describe('Diff Fuzzer', () => {
  const ITERATIONS = 100

  function generateRandomObject(depth = 0, maxDepth = 3): unknown {
    if (depth > maxDepth) return Math.random()

    const type = Math.floor(Math.random() * 4)
    if (type === 0) return Math.random()
    if (type === 1) return `str-${Math.random()}`
    if (type === 2) return Math.random() > 0.5

    // Object
    const obj: Record<string, unknown> = {}
    const keysCount = Math.floor(Math.random() * 5)
    for (let i = 0; i < keysCount; i++) {
      // Use valid prop names (no dots to avoid path issues for now)
      const key = `key_${Math.random().toString(36).substring(7)}`
      obj[key] = generateRandomObject(depth + 1, maxDepth)
    }
    return obj
  }

  it(`should pass ${ITERATIONS} fuzz iterations`, () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const objA = generateRandomObject()
      // Clone and mutate B
      const objB = deepClone(objA)

      // Mutate B randomly
      // Ensure objB is an object before mutation
      if (typeof objB === 'object' && objB !== null && !Array.isArray(objB)) {
        const mutableObjB = objB as Record<string, unknown>
        const keys = Object.keys(mutableObjB)
        if (keys.length > 0) {
          const key = keys[Math.floor(Math.random() * keys.length)]
          mutableObjB[key] = generateRandomObject() // Change value
        }
        // Add new key
        mutableObjB[`new_${i}`] = 'new'
      } else {
        // If objA was primitive, objB is primitive.
        // We can't mutate primitive like objB[key] = val.
        // So we skip mutation for this case or force it to be object?
        // Let's just skip this iteration's mutation if it's primitive,
        // or just test diff(primitive, primitive).
        // If objA is primitive, objB is primitive.
        // Let's force objA to be object for more interesting test.
      }

      // Calculate Diff
      const normalizedA = (typeof objA === 'object' && objA !== null
        ? objA
        : {}) as Record<string, unknown>
      const normalizedB = (typeof objB === 'object' && objB !== null
        ? objB
        : {}) as Record<string, unknown>
      const ops = diff(normalizedA, normalizedB, 'root', 'props')

      // Apply Diff
      // We use a dummy model to apply ops
      const root: NodeSchema<Record<string, unknown>> = {
        id: 'root',
        componentName: 'Page',
        props: deepClone(normalizedA) as Record<string, unknown>,
      }
      const model = new TreeModel(root)

      ops.forEach((op) => {
        model.dispatch(op)
      })

      // Assert
      try {
        expect(root.props).toEqual(normalizedB)
      } catch (e) {
        console.error('Fuzz Failure!', {
          iteration: i,
          objA: normalizedA,
          objB: normalizedB,
          ops,
          result: root.props,
        })
        throw e
      }
    }
  })

  it('should handle Date objects correctly (not recursing)', () => {
    const d1 = new Date('2023-01-01')
    const d2 = new Date('2023-01-02')

    // Test case where diff might fail if it treats Date as empty object
    const a = { date: d1 }
    const b = { date: d2 }

    const ops = diff(a, b, 'root', 'props')

    // Should produce update op
    expect(ops).toHaveLength(1)
    expect(ops[0].path).toBe('props.date')
    expect(ops[0].value).toEqual(d2)
  })
})
