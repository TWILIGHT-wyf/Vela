import { describe, expect, it } from 'vitest'
import { generateLayoutCSS } from '../src/utils/style'
import type { NodeGeometry } from '../src/types/layout'
import type { NodeStyle } from '../src/types/schema'

describe('generateLayoutCSS grid mode', () => {
  it('uses geometry placement and preserves explicit fixed sizing', () => {
    const style: NodeStyle = {
      width: 320,
      height: 180,
      marginTop: 8,
    }

    const geometry: NodeGeometry = {
      mode: 'grid',
      gridColumnStart: 2,
      gridColumnEnd: 5,
      gridRowStart: 3,
      gridRowEnd: 6,
    }

    const css = generateLayoutCSS(style, 'grid', geometry)

    expect(css.gridColumn).toBe('2 / 5')
    expect(css.gridRow).toBe('3 / 6')
    expect(css.width).toBe('320px')
    expect(css.height).toBe('180px')
    expect(css.marginTop).toBe('8px')
  })

  it('falls back to style grid placement when geometry is absent', () => {
    const style: NodeStyle = {
      gridColumn: 'span 4',
      gridRow: '2 / 5',
    }

    const css = generateLayoutCSS(style, 'grid')

    expect(css.gridColumn).toBe('span 4')
    expect(css.gridRow).toBe('2 / 5')
  })

  it('does not force 100% fill when margins exist and no explicit size', () => {
    const style: NodeStyle = {
      marginLeft: 12,
      marginRight: 12,
    }

    const geometry: NodeGeometry = {
      mode: 'grid',
      gridColumnStart: 1,
      gridColumnEnd: 3,
      gridRowStart: 1,
      gridRowEnd: 2,
    }

    const css = generateLayoutCSS(style, 'grid', geometry)

    expect(css.width).toBeUndefined()
    expect(css.height).toBeUndefined()
    expect(css.marginLeft).toBe('12px')
    expect(css.marginRight).toBe('12px')
  })
})
