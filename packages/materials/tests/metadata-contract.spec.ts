import { describe, expect, it } from 'vitest'
import type { MaterialMeta, PropSchema } from '@vela/core/types'
import { materialList } from '../src/registry'

function toPropList(
  props: MaterialMeta['props'] | MaterialMeta['styles'] | undefined,
): PropSchema[] {
  if (!props) {
    return []
  }
  if (Array.isArray(props)) {
    return props
  }
  return Object.values(props)
}

describe('materials metadata contract', () => {
  it('contains unique component names', () => {
    const names = materialList.map((meta) => meta.name).filter(Boolean)
    const unique = new Set(names)
    expect(unique.size).toBe(names.length)
  })

  it('keeps required core metadata fields valid', () => {
    materialList.forEach((meta) => {
      expect(typeof meta.name).toBe('string')
      expect(meta.name?.trim().length).toBeGreaterThan(0)
      expect(typeof meta.title).toBe('string')
      expect(String(meta.title).trim().length).toBeGreaterThan(0)
      expect(typeof meta.category).toBe('string')
      expect(String(meta.category).trim().length).toBeGreaterThan(0)

      if (meta.defaultSize) {
        expect(typeof meta.defaultSize.width).toBe('number')
        expect(typeof meta.defaultSize.height).toBe('number')
      }
    })
  })

  it('ensures prop/style schema entries satisfy minimal shape', () => {
    materialList.forEach((meta) => {
      const schemas = [...toPropList(meta.props), ...toPropList(meta.styles)]
      schemas.forEach((schema) => {
        expect(typeof schema.name).toBe('string')
        expect(schema.name.trim().length).toBeGreaterThan(0)
        expect(typeof schema.label).toBe('string')
        expect(schema.label.trim().length).toBeGreaterThan(0)
        expect(typeof schema.setter).toBe('string')
        expect(schema.setter.trim().length).toBeGreaterThan(0)
      })
    })
  })
})
