import { describe, expect, it } from 'vitest'
import { getComponentDefinition } from '@vela/core/contracts'
import { getMaterialsByCategory, materialList, resolveCanonicalMaterialName } from '../src/registry'

function getPropNames(componentName: string): string[] {
  const meta = materialList.find((item) => item.name === componentName)
  if (!meta || !meta.props) return []
  const props = Array.isArray(meta.props) ? meta.props : Object.values(meta.props)
  return props.map((item) => item.name)
}

describe('materials core contract alignment', () => {
  it('resolves common PascalCase names to core canonical names', () => {
    expect(resolveCanonicalMaterialName('LineChart')).toBe('lineChart')
    expect(resolveCanonicalMaterialName('Box')).toBe('box')
    expect(resolveCanonicalMaterialName('NavButton')).toBe('navButton')
  })

  it('only shows core-registered materials in panel categories', () => {
    const grouped = getMaterialsByCategory()
    const panelMaterials = Object.values(grouped).flat()

    panelMaterials.forEach((meta) => {
      const canonicalName = resolveCanonicalMaterialName(meta.name)
      const definition = getComponentDefinition(canonicalName)
      expect(definition, `${meta.name} should map to a core component`).toBeDefined()
    })
  })

  it('hides non-core legacy materials from panel grouping', () => {
    const grouped = getMaterialsByCategory()
    const panelNames = new Set(
      Object.values(grouped)
        .flat()
        .map((meta) => meta.name),
    )

    expect(panelNames.has('GridBox')).toBe(false)
    expect(panelNames.has('KpiCard')).toBe(false)
    expect(panelNames.has('Grid')).toBe(true)
  })

  it('uses canonical core prop keys for typed form components', () => {
    expect(getPropNames('Select')).toContain('value')
    expect(getPropNames('TextInput')).toContain('value')
    expect(getPropNames('TextareaInput')).toContain('value')
    expect(getPropNames('NumberInput')).toContain('value')
    expect(getPropNames('RadioGroup')).toContain('value')
    expect(getPropNames('Checkbox')).toContain('checked')
    expect(getPropNames('DatePicker')).toContain('value')
    expect(getPropNames('TimePicker')).toContain('value')
    expect(getPropNames('Upload')).toContain('value')
    expect(getPropNames('TreeSelect')).toContain('value')
    expect(getPropNames('Cascader')).toContain('value')
  })

  it('uses canonical core prop keys for common KPI components', () => {
    expect(getPropNames('CountUp')).toContain('endValue')
    expect(getPropNames('Stat')).toEqual(expect.arrayContaining(['change', 'showChange', 'icon']))
    expect(getPropNames('Badge')).toEqual(expect.arrayContaining(['color', 'showZero', 'offset']))
  })
})
