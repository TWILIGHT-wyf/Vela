/**
 * Phase 4: Component Registry Conformance Tests
 *
 * Ensures the unified component registry is consistent:
 * - Every entry with a reactComponent must have a valid vueTag
 * - No duplicate names
 * - Alias targets exist in the registry
 * - Derived maps are consistent with the source array
 */
import { describe, it, expect } from 'vitest'
import {
  COMPONENT_REGISTRY,
  COMPONENT_ALIASES,
  VUE_TAG_MAP,
  REACT_TAG_MAP,
  WRAPPER_COMPONENTS,
  RESERVED_COMPONENT_NAMES,
  resolveComponentAlias,
  getVueTagName,
  getReactComponentName,
  resolveVueComponentTag,
  resolveReactComponentTag,
  isWrapperComponent,
  isHtmlTag,
  isRegisteredComponent,
  getComponentDefinition,
  getComponentsByCategory,
} from '@vela/core/contracts'

describe('Component Registry — structure', () => {
  it('has no duplicate component names', () => {
    const names = COMPONENT_REGISTRY.map((c) => c.name)
    const unique = new Set(names)
    expect(names.length).toBe(unique.size)
  })

  it('every entry has a non-empty name and vueTag', () => {
    for (const entry of COMPONENT_REGISTRY) {
      expect(entry.name).toBeTruthy()
      expect(entry.vueTag).toBeTruthy()
    }
  })

  it('every entry has a category', () => {
    for (const entry of COMPONENT_REGISTRY) {
      expect(entry.category).toBeTruthy()
    }
  })

  it('reactComponent is either a string or null', () => {
    for (const entry of COMPONENT_REGISTRY) {
      expect(entry.reactComponent === null || typeof entry.reactComponent === 'string').toBe(true)
    }
  })
})

describe('Component Aliases', () => {
  it('all alias targets exist in the registry', () => {
    const registryNames = new Set(COMPONENT_REGISTRY.map((c) => c.name))
    for (const [, target] of Object.entries(COMPONENT_ALIASES)) {
      expect(registryNames.has(target)).toBe(true)
    }
  })

  it('no alias points to itself', () => {
    for (const [alias, target] of Object.entries(COMPONENT_ALIASES)) {
      expect(alias).not.toBe(target)
    }
  })

  it('resolveComponentAlias returns canonical for known aliases', () => {
    for (const [alias, target] of Object.entries(COMPONENT_ALIASES)) {
      expect(resolveComponentAlias(alias)).toBe(target)
    }
  })

  it('resolveComponentAlias returns identity for unknown names', () => {
    expect(resolveComponentAlias('nonExistent')).toBe('nonExistent')
  })
})

describe('Derived Maps — VUE_TAG_MAP', () => {
  it('has the same number of entries as COMPONENT_REGISTRY', () => {
    expect(Object.keys(VUE_TAG_MAP).length).toBe(COMPONENT_REGISTRY.length)
  })

  it('every registry entry is in VUE_TAG_MAP', () => {
    for (const entry of COMPONENT_REGISTRY) {
      expect(VUE_TAG_MAP[entry.name]).toBe(entry.vueTag)
    }
  })
})

describe('Derived Maps — REACT_TAG_MAP', () => {
  it('only contains entries with non-null reactComponent', () => {
    const withReact = COMPONENT_REGISTRY.filter((c) => c.reactComponent !== null)
    expect(Object.keys(REACT_TAG_MAP).length).toBe(withReact.length)
  })

  it('values match registry reactComponent', () => {
    for (const entry of COMPONENT_REGISTRY) {
      if (entry.reactComponent !== null) {
        expect(REACT_TAG_MAP[entry.name]).toBe(entry.reactComponent)
      }
    }
  })
})

describe('Helper functions', () => {
  it('getVueTagName returns correct tag for known component', () => {
    expect(getVueTagName('Text')).toBe('vText')
    expect(getVueTagName('flex')).toBe('vFlex')
  })

  it('getVueTagName returns the input name for unknown component', () => {
    // VUE_TAG_MAP returns the name as-is when not found
    expect(getVueTagName('nonExistent')).toBe('nonExistent')
  })

  it('getReactComponentName returns correct name for known component', () => {
    expect(getReactComponentName('Text')).toBe('Text')
    expect(getReactComponentName('flex')).toBe('Flex')
  })

  it('getReactComponentName returns null for components without React impl', () => {
    expect(getReactComponentName('scripting')).toBeNull()
  })

  it('resolveVueComponentTag handles aliases', () => {
    expect(resolveVueComponentTag('KpiText')).toBe('vText')
  })

  it('resolveReactComponentTag handles aliases', () => {
    expect(resolveReactComponentTag('KpiText')).toBe('Text')
  })

  it('isWrapperComponent returns true for wrapper types', () => {
    expect(isWrapperComponent('page')).toBe(true)
    expect(isWrapperComponent('fragment')).toBe(true)
    expect(isWrapperComponent('layout')).toBe(true)
    expect(isWrapperComponent('dialog')).toBe(true)
  })

  it('isWrapperComponent returns false for normal components', () => {
    expect(isWrapperComponent('Text')).toBe(false)
    expect(isWrapperComponent('flex')).toBe(false)
  })

  it('isHtmlTag detects standard HTML elements', () => {
    expect(isHtmlTag('div')).toBe(true)
    expect(isHtmlTag('span')).toBe(true)
    expect(isHtmlTag('vText')).toBe(false)
  })

  it('isRegisteredComponent checks registry + aliases', () => {
    expect(isRegisteredComponent('Text')).toBe(true)
    expect(isRegisteredComponent('KpiText')).toBe(true) // alias
    expect(isRegisteredComponent('nonExistent')).toBe(false)
  })

  it('getComponentDefinition returns definition for known name', () => {
    const def = getComponentDefinition('flex')
    expect(def).toBeDefined()
    expect(def!.vueTag).toBe('vFlex')
  })

  it('getComponentDefinition resolves aliases', () => {
    const def = getComponentDefinition('KpiText')
    expect(def).toBeDefined()
    expect(def!.name).toBe('Text')
  })

  it('getComponentsByCategory filters correctly', () => {
    const charts = getComponentsByCategory('chart')
    expect(charts.length).toBeGreaterThan(0)
    for (const c of charts) {
      expect(c.category).toBe('chart')
    }
  })
})

describe('WRAPPER_COMPONENTS set', () => {
  it('contains exactly the expected 4 wrapper types', () => {
    expect(WRAPPER_COMPONENTS.size).toBe(4)
    expect(WRAPPER_COMPONENTS.has('page')).toBe(true)
    expect(WRAPPER_COMPONENTS.has('fragment')).toBe(true)
    expect(WRAPPER_COMPONENTS.has('layout')).toBe(true)
    expect(WRAPPER_COMPONENTS.has('dialog')).toBe(true)
  })
})

describe('RESERVED_COMPONENT_NAMES', () => {
  it('is a non-empty set', () => {
    expect(RESERVED_COMPONENT_NAMES.size).toBeGreaterThan(10)
  })

  it('contains known reserved names that collide with globals', () => {
    // These are component names that conflict with HTML or Element Plus globals
    expect(RESERVED_COMPONENT_NAMES.has('Button')).toBe(true)
    expect(RESERVED_COMPONENT_NAMES.has('Text')).toBe(true)
    expect(RESERVED_COMPONENT_NAMES.has('Image')).toBe(true)
  })
})

describe('Cross-framework parity', () => {
  it('button has both Vue and React implementations', () => {
    const def = getComponentDefinition('button')
    expect(def).toBeDefined()
    expect(def!.vueTag).toBeTruthy()
    expect(def!.reactComponent).toBeTruthy()
  })

  it('iframe has both Vue and React implementations', () => {
    const def = getComponentDefinition('iframe')
    expect(def).toBeDefined()
    expect(def!.vueTag).toBe('vIframe')
    expect(def!.reactComponent).toBe('Iframe')
  })

  it('breadcrumb has both Vue and React implementations', () => {
    const def = getComponentDefinition('breadcrumb')
    expect(def).toBeDefined()
    expect(def!.reactComponent).toBe('Breadcrumb')
  })

  it('navButton has both Vue and React implementations', () => {
    const def = getComponentDefinition('navButton')
    expect(def).toBeDefined()
    expect(def!.reactComponent).toBe('NavButton')
  })

  it('pagination has both Vue and React implementations', () => {
    const def = getComponentDefinition('pagination')
    expect(def).toBeDefined()
    expect(def!.reactComponent).toBe('Pagination')
  })

  it('new common form components have both Vue and React implementations', () => {
    const names = ['DatePicker', 'TimePicker', 'Upload', 'TreeSelect', 'Cascader'] as const
    for (const name of names) {
      const def = getComponentDefinition(name)
      expect(def).toBeDefined()
      expect(def!.vueTag).toBeTruthy()
      expect(def!.reactComponent).toBeTruthy()
    }
  })

  it('all layout components have React counterparts', () => {
    const layouts = getComponentsByCategory('layout')
    for (const comp of layouts) {
      expect(comp.reactComponent).not.toBeNull()
    }
  })

  it('Text is categorized as basic for panel grouping', () => {
    const def = getComponentDefinition('Text')
    expect(def).toBeDefined()
    expect(def!.category).toBe('basic')
  })

  it('all KPI components have React counterparts', () => {
    const kpis = getComponentsByCategory('kpi')
    for (const comp of kpis) {
      expect(comp.reactComponent).not.toBeNull()
    }
  })

  it('all form components have React counterparts', () => {
    const forms = getComponentsByCategory('form')
    for (const comp of forms) {
      expect(comp.reactComponent).not.toBeNull()
    }
  })

  it('all data components have React counterparts', () => {
    const dataComps = getComponentsByCategory('data')
    for (const comp of dataComps) {
      expect(comp.reactComponent).not.toBeNull()
    }
  })
})
