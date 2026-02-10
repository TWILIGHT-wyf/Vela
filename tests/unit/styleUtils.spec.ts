import { describe, it, expect } from 'vitest'
import { generateLayoutCSS } from '@vela/core/utils'

describe('style utils - generateLayoutCSS', () => {
  it('flow 模式应保留 grid 相关样式字段', () => {
    const css = generateLayoutCSS(
      {
        display: 'grid',
        gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
        gridTemplateRows: 'auto',
        gridColumn: 'span 4',
        gridRow: 'span 6',
        gap: 12,
        rowGap: 16,
        columnGap: 8,
      },
      'flow',
    )

    expect(css.display).toBe('grid')
    expect(css.gridTemplateColumns).toBe('repeat(12, minmax(0, 1fr))')
    expect(css.gridTemplateRows).toBe('auto')
    expect(css.gridColumn).toBe('span 4')
    expect(css.gridRow).toBe('span 6')
    expect(css.gap).toBe('12px')
    expect(css.rowGap).toBe('16px')
    expect(css.columnGap).toBe('8px')
  })

  it('flow 模式应保留 flex 容器字段，避免跨端布局丢失', () => {
    const css = generateLayoutCSS(
      {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        alignContent: 'stretch',
        padding: 16,
      },
      'flow',
    )

    expect(css.display).toBe('flex')
    expect(css.flexDirection).toBe('row')
    expect(css.justifyContent).toBe('space-between')
    expect(css.alignItems).toBe('center')
    expect(css.alignContent).toBe('stretch')
    expect(css.padding).toBe('16px')
  })
})
