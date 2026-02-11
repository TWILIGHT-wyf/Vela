import { describe, expect, it } from 'vitest'
import { extractDefaultStyles } from '../src/registry'
import containerMeta from '../src/basic/container/meta'

describe('material default style extraction', () => {
  it('extracts defaults from legacy styles schema', () => {
    const defaults = extractDefaultStyles(containerMeta.styles)

    expect(defaults.width).toBe('100%')
    expect(defaults.height).toBe('auto')
    expect(defaults.minHeight).toBe('100px')
    expect(defaults.display).toBe('block')
    expect(defaults.padding).toBe('16px')
  })
})
