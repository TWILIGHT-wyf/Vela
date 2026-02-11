import { describe, expect, it } from 'vitest'
import { extractDefaultStyles } from '../src/registry'
import containerMeta from '../src/basic/container/meta'

describe('material default style extraction', () => {
  it('extracts defaults from legacy styles schema', () => {
    const defaults = extractDefaultStyles(containerMeta.styles)

    expect(defaults.width).toBe('320px')
    expect(defaults.height).toBe('220px')
    expect(defaults.minHeight).toBe('120px')
    expect(defaults.margin).toBe('0')
    expect(defaults.border).toBe('none')
  })
})
