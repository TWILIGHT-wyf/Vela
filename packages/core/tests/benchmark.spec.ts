import { describe, it, expect, bench } from 'vitest'
import { TreeModel } from '../src/model/tree'
import { NodeSchema } from '../src/types/schema'
import { generateId } from '../src/utils/id'

/**
 * Performance Benchmark
 * Run with: npx vitest bench packages/core/tests/benchmark.spec.ts
 */
describe('Core Performance', () => {
  const root: NodeSchema = { id: 'root', componentName: 'Page', children: [] }

  function createLargeTree(count: number) {
    const model = new TreeModel({ ...root, children: [] })
    const start = performance.now()

    model.batch(() => {
      for (let i = 0; i < count; i++) {
        model.insertNode({ id: generateId(), componentName: 'Box' }, 'root')
      }
    })

    return performance.now() - start
  }

  function createLargeTreeNoBatch(count: number) {
    const model = new TreeModel({ ...root, children: [] })
    const start = performance.now()

    for (let i = 0; i < count; i++) {
      model.insertNode({ id: generateId(), componentName: 'Box' }, 'root')
    }

    return performance.now() - start
  }

  it('should handle 1000 nodes insertion < 50ms (Batch)', () => {
    const time = createLargeTree(1000)
    console.log(`[Bench] Insert 1000 nodes (Batch): ${time.toFixed(2)}ms`)
    expect(time).toBeLessThan(50)
  })

  it('should handle 1000 nodes insertion < 1000ms (No Batch)', () => {
    const time = createLargeTreeNoBatch(1000)
    console.log(`[Bench] Insert 1000 nodes (No Batch): ${time.toFixed(2)}ms`)
    // Without batch, it rebuilds index 1000 times. O(N^2) behavior.
    // 1st insert: 1 node
    // ...
    // 1000th insert: 1000 nodes traversal
    // Total ops ~ 1000*1000/2 = 500,000 ops. Should be fast enough in V8.
    expect(time).toBeLessThan(1000)
  })

  it('should rebuild index for 5000 nodes < 20ms', () => {
    // 1. Prepare
    const model = new TreeModel({ ...root, children: [] })
    model.batch(() => {
      for (let i = 0; i < 5000; i++) {
        model.insertNode({ id: generateId(), componentName: 'Box' }, 'root')
      }
    })

    // 2. Measure Rebuild
    const start = performance.now()
    model.index.rebuild(model.root)
    const time = performance.now() - start

    console.log(`[Bench] Rebuild Index (5000 nodes): ${time.toFixed(2)}ms`)
    expect(time).toBeLessThan(20)
  })
})
