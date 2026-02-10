import { describe, expect, it } from 'vitest'
import { getMaterialsByCategory } from '../src/registry'
import { getCategoryConfig, normalizeCategoryName } from '../src/materialsMeta'

describe('materials category classification', () => {
  it('normalizes legacy labels to canonical categories', () => {
    expect(normalizeCategoryName('基础组件')).toBe('基础')
    expect(normalizeCategoryName('基础控件')).toBe('基础')
    expect(normalizeCategoryName('布局容器')).toBe('布局')
    expect(normalizeCategoryName('数据展示')).toBe('数据')
  })

  it('uses prioritized category order for core editor categories', () => {
    expect(getCategoryConfig('基础').order).toBeLessThan(getCategoryConfig('表单').order)
    expect(getCategoryConfig('表单').order).toBeLessThan(getCategoryConfig('布局').order)
    expect(getCategoryConfig('布局').order).toBeLessThan(getCategoryConfig('数据').order)
    expect(getCategoryConfig('数据').order).toBeLessThan(getCategoryConfig('图表').order)
  })

  it('groups materials without exposing legacy category buckets', () => {
    const grouped = getMaterialsByCategory()

    expect(grouped['基础组件']).toBeUndefined()
    expect(grouped['基础控件']).toBeUndefined()
    expect(grouped['布局容器']).toBeUndefined()
    expect(grouped['数据展示']).toBeUndefined()

    expect((grouped['导航'] || []).length).toBeGreaterThan(0)
  })

  it('includes newly added common form components in 表单 category', () => {
    const grouped = getMaterialsByCategory()
    const formNames = (grouped['表单'] || []).map((meta) => meta.name)

    expect(formNames).toEqual(
      expect.arrayContaining([
        'TextInput',
        'TextareaInput',
        'NumberInput',
        'RadioGroup',
        'Checkbox',
        'DatePicker',
        'TimePicker',
        'Upload',
        'TreeSelect',
        'Cascader',
      ]),
    )
  })

  it('places Text in 基础 category and avoids duplicate labels in same category', () => {
    const grouped = getMaterialsByCategory()
    const baseTitles = (grouped['基础'] || []).map((meta) => meta.title as string)

    expect(baseTitles).toContain('文本')

    const unique = new Set(baseTitles)
    expect(unique.size).toBe(baseTitles.length)
  })

  it('removes redundant button/container variant materials from panel grouping', () => {
    const grouped = getMaterialsByCategory()
    const baseTitles = (grouped['基础'] || []).map((meta) => meta.title as string)

    expect(baseTitles).toContain('按钮')
    expect(baseTitles).toContain('容器')
    expect(baseTitles).not.toContain('按钮（基础）')
    expect(baseTitles).not.toContain('容器增强')
  })
})
