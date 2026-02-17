import { describe, it, expect } from 'vitest'
import {
  WRAPPER_COMPONENTS,
  getComponentDefinition,
  type ComponentCategory,
} from '@vela/core/contracts'
import {
  materialList,
  normalizeCategoryName,
  resolveCanonicalMaterialName,
} from '@vela/materials'
import { componentRegistry as vueComponentRegistry } from '@vela/ui'
import * as uiReact from '../../../packages/ui-react/src/index'

const CATEGORY_LABEL_MAP: Partial<Record<ComponentCategory, string>> = {
  basic: '基础',
  form: '表单',
  layout: '布局',
  data: '数据',
  chart: '图表',
  navigation: '导航',
  kpi: 'KPI',
  content: '内容',
  media: '媒体',
  advanced: '高级',
  gis: 'GIS',
}

function getMetaName(meta: (typeof materialList)[number]): string {
  return (meta.name || meta.componentName || '').trim()
}

describe('Component Library Conformance', () => {
  it('materials have no duplicate names (case-insensitive)', () => {
    const seen = new Set<string>()
    for (const meta of materialList) {
      const name = getMetaName(meta)
      expect(name).toBeTruthy()
      const key = name.toLowerCase()
      expect(seen.has(key)).toBe(false)
      seen.add(key)
    }
  })

  it('every material resolves to a core component definition or wrapper', () => {
    for (const meta of materialList) {
      const sourceName = getMetaName(meta)
      const canonicalName = resolveCanonicalMaterialName(sourceName)
      if (WRAPPER_COMPONENTS.has(canonicalName.toLowerCase())) {
        continue
      }

      const definition = getComponentDefinition(canonicalName)
      expect(definition).toBeDefined()
    }
  })

  it('material category labels align with core category mapping', () => {
    const mismatches: Array<{ name: string; expected: string; actual: string }> = []

    for (const meta of materialList) {
      const sourceName = getMetaName(meta)
      const canonicalName = resolveCanonicalMaterialName(sourceName)
      const definition = getComponentDefinition(canonicalName)
      if (!definition) continue

      const expectedLabel = CATEGORY_LABEL_MAP[definition.category]
      if (!expectedLabel) continue

      const actualLabel = normalizeCategoryName(meta.category || '')
      if (actualLabel !== expectedLabel) {
        mismatches.push({
          name: canonicalName,
          expected: expectedLabel,
          actual: actualLabel,
        })
      }
    }

    expect(mismatches).toEqual([])
  })

  it('every material has a Vue implementation in @vela/ui', () => {
    const vueRegistry = vueComponentRegistry as Record<string, unknown>

    for (const meta of materialList) {
      const sourceName = getMetaName(meta)
      const canonicalName = resolveCanonicalMaterialName(sourceName)
      const definition = getComponentDefinition(canonicalName)
      if (!definition) continue

      expect(vueRegistry[definition.vueTag]).toBeDefined()
    }
  })

  it('every material with React mapping has an implementation in @vela/ui-react', () => {
    const reactRegistry = uiReact as Record<string, unknown>

    for (const meta of materialList) {
      const sourceName = getMetaName(meta)
      const canonicalName = resolveCanonicalMaterialName(sourceName)
      const definition = getComponentDefinition(canonicalName)
      if (!definition?.reactComponent) continue

      expect(reactRegistry[definition.reactComponent]).toBeDefined()
    }
  })
})
