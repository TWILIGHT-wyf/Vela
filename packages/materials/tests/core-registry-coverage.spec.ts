import { describe, expect, it } from 'vitest'
import { COMPONENT_REGISTRY } from '@vela/core/contracts'
import { getMaterialsByCategory, materialList, resolveCanonicalMaterialName } from '../src/registry'

function getMaterialPropNames(name: string): string[] {
  const meta = materialList.find((item) => item.name === name)
  if (!meta?.props) return []
  const props = Array.isArray(meta.props) ? meta.props : Object.values(meta.props)
  return props.map((item) => item.name)
}

describe('materials core registry coverage', () => {
  it('covers every non-gis core component with material metadata', () => {
    const materialNames = new Set(
      materialList.map((meta) => resolveCanonicalMaterialName(meta.name)),
    )
    const missing = COMPONENT_REGISTRY.filter((def) => def.category !== 'gis')
      .map((def) => def.name)
      .filter((name) => !materialNames.has(name))

    expect(missing).toEqual([])
  })

  it('keeps canonical material names unique after alias normalization', () => {
    const canonicalNames = materialList.map((meta) => resolveCanonicalMaterialName(meta.name))
    const unique = new Set(canonicalNames)
    expect(unique.size).toBe(canonicalNames.length)
  })

  it('keeps material titles unique within each panel category', () => {
    const grouped = getMaterialsByCategory()

    Object.values(grouped).forEach((list) => {
      const titles = list.map((meta) => String(meta.title))
      const unique = new Set(titles)
      expect(unique.size).toBe(titles.length)
    })
  })

  it('aligns Container metadata with core schema prop contract', () => {
    const containerProps = getMaterialPropNames('Container')

    expect(containerProps).toEqual(
      expect.arrayContaining(['padding', 'backgroundColor', 'overflow']),
    )
  })
})
