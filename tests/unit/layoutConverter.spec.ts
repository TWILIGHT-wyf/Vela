import { describe, it, expect } from 'vitest'
import type { NodeSchema } from '@vela/core'
import { convertLayout, detectLayoutMode } from '@/utils/layoutConverter'

function createRoot(mode: 'free' | 'flow', children: NodeSchema[]): NodeSchema {
  return {
    id: 'root',
    component: 'Page',
    container: { mode },
    style: { width: '100%', height: '100%' },
    children,
  }
}

describe('layoutConverter', () => {
  it('flow -> free 时应先应用根模式，再为子节点生成 free geometry', () => {
    const root = createRoot('flow', [
      { id: 'a', component: 'Button', style: { width: 120, height: 40 } },
      { id: 'b', component: 'Text', style: { width: 80, height: 24 } },
    ])

    const converted = convertLayout(root, 'free')

    expect(converted.container?.mode).toBe('free')
    expect(converted.children?.[0].geometry?.mode).toBe('free')
    expect(converted.children?.[1].geometry?.mode).toBe('free')
    expect((converted.children?.[0].geometry as { x?: number }).x).toBe(20)
    expect((converted.children?.[1].geometry as { x?: number }).x).toBe(40)
    expect(root.container?.mode).toBe('flow')
  })

  it('free -> flow 时应按 y 坐标排序并清理自由定位样式', () => {
    const root = createRoot('free', [
      {
        id: 'late',
        component: 'Button',
        geometry: { mode: 'free', x: 10, y: 200, width: 100, height: 32 },
        style: { position: 'absolute', left: 10, top: 200 },
      },
      {
        id: 'early',
        component: 'Button',
        geometry: { mode: 'free', x: 10, y: 50, width: 100, height: 32 },
        style: { position: 'absolute', left: 10, top: 50 },
      },
    ])

    const converted = convertLayout(root, 'flow')
    const [first, second] = converted.children || []

    expect(converted.container?.mode).toBe('flow')
    expect(first?.id).toBe('early')
    expect(second?.id).toBe('late')
    expect(first?.geometry?.mode).toBe('flow')
    expect(second?.geometry?.mode).toBe('flow')
    expect(second?.style?.position).toBeUndefined()
    expect(second?.style?.left).toBeUndefined()
    expect(second?.style?.top).toBeUndefined()
    expect(first?.style?.gridColumn).toMatch(/^span\s+\d+$/)
    expect(first?.style?.gridRow).toMatch(/^span\s+\d+$/)
  })

  it('flow 模式下块级容器应规范化为 width=100% 且 height -> minHeight', () => {
    const root = createRoot('flow', [
      {
        id: 'container_1',
        component: 'Container',
        style: { width: 320, height: '300px' },
        children: [{ id: 'inside', component: 'Text', props: { text: 'demo' } }],
      },
    ])

    const converted = convertLayout(root, 'flow')
    const container = converted.children?.[0]

    expect(container?.style?.width).toBe('100%')
    expect(container?.style?.minHeight).toBe('300px')
    expect(container?.style?.height).toBeUndefined()
    expect(container?.style?.gridColumn).toBe('span 12')
  })

  it('flow -> free 时应将 grid span 转换为可编辑几何尺寸', () => {
    const root = createRoot('flow', [
      {
        id: 'grid_item',
        component: 'Text',
        style: {
          width: '100%',
          height: '100%',
          gridColumn: 'span 2',
          gridRow: 'span 3',
        },
      },
    ])

    const converted = convertLayout(root, 'free')
    const item = converted.children?.[0]

    expect(item?.geometry?.mode).toBe('free')
    expect((item?.geometry as { width?: number }).width).toBe(320)
    expect((item?.geometry as { height?: number }).height).toBe(108)
    expect(item?.style?.gridColumn).toBeUndefined()
    expect(item?.style?.gridRow).toBeUndefined()
  })

  it('detectLayoutMode 应优先使用根容器模式并将 flow 归一为 grid', () => {
    const root = createRoot('flow', [
      {
        id: 'child',
        component: 'Button',
        geometry: { mode: 'free', x: 10, y: 10, width: 100, height: 30 },
      },
    ])

    expect(detectLayoutMode(root)).toBe('grid')
  })
})
