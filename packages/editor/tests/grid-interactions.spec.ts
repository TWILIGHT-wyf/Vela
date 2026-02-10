import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { GridNodeGeometry, NodeSchema } from '@vela/core'
import { countTracks } from '@vela/core'
import { useComponent } from '../src/stores/component'

function createGridChild(id: string, row: number): NodeSchema {
  return {
    id,
    component: 'Text',
    props: { content: id },
    style: { width: '100%', height: '100%' },
    geometry: {
      mode: 'grid',
      gridColumnStart: 1,
      gridColumnEnd: 3,
      gridRowStart: row,
      gridRowEnd: row + 1,
    } as GridNodeGeometry,
  }
}

function createGridRoot(children: NodeSchema[], rows = '1fr 2fr 1fr'): NodeSchema {
  return {
    id: 'root',
    component: 'Page',
    container: {
      mode: 'grid',
      columns: '1fr 2fr',
      rows,
      gap: 8,
    },
    children,
  }
}

describe('grid interactions normalization', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('reindexes grid rows when moving nodes in same grid parent', () => {
    const store = useComponent()
    store.loadTree(
      createGridRoot([createGridChild('a', 1), createGridChild('b', 2), createGridChild('c', 3)]),
    )

    store.moveComponent('c', 'root', 0)

    const root = store.rootNode
    expect(root?.children?.map((n) => n.id)).toEqual(['c', 'a', 'b'])
    expect(countTracks((root?.container as { rows?: string })?.rows || '')).toBe(3)
    expect((root?.container as { rows?: string })?.rows).toContain('2fr')

    const c = store.findNodeById('c')
    const a = store.findNodeById('a')
    const b = store.findNodeById('b')
    expect((c?.geometry as GridNodeGeometry).gridRowStart).toBe(1)
    expect((a?.geometry as GridNodeGeometry).gridRowStart).toBe(2)
    expect((b?.geometry as GridNodeGeometry).gridRowStart).toBe(3)
  })

  it('extends rows and assigns correct row positions when adding in grid mode', () => {
    const store = useComponent()
    store.loadTree(createGridRoot([createGridChild('a', 1), createGridChild('b', 2)], '1fr 2fr'))

    store.addComponent(
      null,
      {
        id: 'x',
        component: 'Text',
        props: { content: 'x' },
        style: { width: '100%', height: '100%' },
      },
      1,
    )

    const root = store.rootNode
    expect(root?.children?.map((n) => n.id)).toEqual(['a', 'x', 'b'])
    expect((root?.container as { rows?: string })?.rows).toBe('1fr 2fr 1fr')

    const x = store.findNodeById('x')
    const b = store.findNodeById('b')
    expect((x?.geometry as GridNodeGeometry).gridRowStart).toBe(2)
    expect((b?.geometry as GridNodeGeometry).gridRowStart).toBe(3)
  })

  it('shrinks rows and compacts geometry rows after deletion in grid mode', () => {
    const store = useComponent()
    store.loadTree(
      createGridRoot(
        [createGridChild('a', 1), createGridChild('b', 2), createGridChild('c', 3)],
        '1fr 2fr 3fr',
      ),
    )

    store.deleteComponent('b')

    const root = store.rootNode
    expect(root?.children?.map((n) => n.id)).toEqual(['a', 'c'])
    expect((root?.container as { rows?: string })?.rows).toBe('1fr 2fr')

    const c = store.findNodeById('c')
    expect((c?.geometry as GridNodeGeometry).gridRowStart).toBe(2)
    expect((c?.geometry as GridNodeGeometry).gridRowEnd).toBe(3)
  })
})
