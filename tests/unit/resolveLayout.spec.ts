import { describe, expect, it } from 'vitest'
import type { NodeSchema } from '@vela/core'
import { resolveLayout } from '../../packages/generator/src/pipeline/normalize/resolveLayout'

function createNode(
  node: Pick<NodeSchema, 'geometry' | 'container' | 'style'>,
): Pick<NodeSchema, 'geometry' | 'container' | 'style'> {
  return node
}

describe('resolveLayout', () => {
  it('flow 模式应保留 width/height 的 LengthValue 单位', () => {
    const layout = resolveLayout({
      node: createNode({
        geometry: {
          mode: 'flow',
          width: '100%',
          height: 'calc(100vh - 48px)',
        },
      }),
      parentChildMode: 'flow',
      pageDefaultMode: 'flow',
    })

    expect(layout.mode).toBe('flow')
    expect(layout.width).toBe('100%')
    expect(layout.height).toBe('calc(100vh - 48px)')
  })

  it('flow 模式应忽略 left/top 的自由定位残留值', () => {
    const layout = resolveLayout({
      node: createNode({
        geometry: {
          mode: 'flow',
        },
        style: {
          left: 120,
          top: '64',
        },
      }),
      parentChildMode: 'flow',
      pageDefaultMode: 'flow',
    })

    expect(layout.mode).toBe('flow')
    expect(layout.x).toBe(0)
    expect(layout.y).toBe(0)
  })

  it('free 模式无尺寸时应使用默认几何尺寸', () => {
    const layout = resolveLayout({
      node: createNode({
        geometry: {
          mode: 'free',
          x: 24,
          y: 36,
        },
      }),
      parentChildMode: 'free',
      pageDefaultMode: 'flow',
    })

    expect(layout.mode).toBe('free')
    expect(layout.x).toBe(24)
    expect(layout.y).toBe(36)
    expect(layout.width).toBe(100)
    expect(layout.height).toBe(100)
  })

  it('free 模式应允许字符串尺寸并原样保留', () => {
    const layout = resolveLayout({
      node: createNode({
        geometry: {
          mode: 'free',
          x: 12,
          y: 8,
          width: '80vw',
          height: 'min(60vh, 480px)',
        },
      }),
      parentChildMode: 'free',
      pageDefaultMode: 'flow',
    })

    expect(layout.mode).toBe('free')
    expect(layout.width).toBe('80vw')
    expect(layout.height).toBe('min(60vh, 480px)')
  })

  it('grid 模式应保留网格线几何信息', () => {
    const layout = resolveLayout({
      node: createNode({
        geometry: {
          mode: 'grid',
          gridColumnStart: 2,
          gridColumnEnd: 5,
          gridRowStart: 3,
          gridRowEnd: 7,
        },
      }),
      parentChildMode: 'grid',
      pageDefaultMode: 'grid',
    })

    expect(layout.mode).toBe('grid')
    expect(layout.gridColumnStart).toBe(2)
    expect(layout.gridColumnEnd).toBe(5)
    expect(layout.gridRowStart).toBe(3)
    expect(layout.gridRowEnd).toBe(7)
  })

  it('grid 模式在缺少 geometry 时应回退解析 style.gridColumn/gridRow', () => {
    const layout = resolveLayout({
      node: createNode({
        style: {
          gridColumn: '2 / 4',
          gridRow: 'span 3',
        },
      }),
      parentChildMode: 'grid',
      pageDefaultMode: 'grid',
    })

    expect(layout.mode).toBe('grid')
    expect(layout.gridColumnStart).toBe(2)
    expect(layout.gridColumnEnd).toBe(4)
    expect(layout.gridRowStart).toBe(1)
    expect(layout.gridRowEnd).toBe(4)
  })
})
