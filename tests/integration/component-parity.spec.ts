import { describe, expect, it } from 'vitest'
import { COMPONENT_REGISTRY, VUE_TAG_MAP, REACT_TAG_MAP } from '@vela/core/contracts'
import { materialList, resolveCanonicalMaterialName } from '@vela/materials'
import * as uiExports from '@vela/ui'
import * as uiReactExports from '@vela/ui-react'

const UI_NON_COMPONENT_EXPORTS = new Set([
  'default',
  'componentRegistry',
  'extractArray',
  'extractNumber',
  'extractNumberArray',
  'extractSankeyLinks',
  'extractSankeyNodes',
  'extractStringArray',
  'extractWithFallback',
  'getValueByPath',
  'safeJsonParse',
  'safeParseDate',
  'safeParseNumber',
  'safeParseString',
  'useDataSource',
])

const UI_REACT_NON_COMPONENT_EXPORTS = new Set(['default'])

describe('component parity guard', () => {
  it('core registry has complete vue/react mappings', () => {
    const missingVue = COMPONENT_REGISTRY.filter((item) => !item.vueTag).map((item) => item.name)
    const missingReact = COMPONENT_REGISTRY.filter((item) => !item.reactComponent).map(
      (item) => item.name,
    )

    expect(missingVue).toEqual([])
    expect(missingReact).toEqual([])
  })

  it('materials metadata covers every core component exactly once', () => {
    const fromMaterials = materialList.map((meta) => resolveCanonicalMaterialName(meta.name))
    const materialSet = new Set(fromMaterials)
    const coreSet = new Set(COMPONENT_REGISTRY.map((item) => item.name))

    const missingInMaterials = [...coreSet].filter((name) => !materialSet.has(name))
    const extraInMaterials = [...materialSet].filter((name) => !coreSet.has(name))

    expect(missingInMaterials).toEqual([])
    expect(extraInMaterials).toEqual([])
    expect(materialSet.size).toBe(coreSet.size)
  })

  it('all Vue tags from core exist in @vela/ui named exports', () => {
    const namedUiExports = new Set(
      Object.keys(uiExports).filter((name) => !UI_NON_COMPONENT_EXPORTS.has(name)),
    )

    const missingInUi = Object.values(VUE_TAG_MAP).filter((tag) => !namedUiExports.has(tag))
    expect(missingInUi).toEqual([])
  })

  it('all React components from core exist in @vela/ui-react named exports', () => {
    const namedReactExports = new Set(
      Object.keys(uiReactExports).filter((name) => !UI_REACT_NON_COMPONENT_EXPORTS.has(name)),
    )

    const missingInUiReact = Object.values(REACT_TAG_MAP).filter(
      (name) => !namedReactExports.has(name),
    )
    expect(missingInUiReact).toEqual([])
  })
})
