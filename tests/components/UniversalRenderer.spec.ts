import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, it, expect } from 'vitest'

const universalRendererPath = path.resolve(
  __dirname,
  '../../packages/editor/src/components/Canvas/UniversalRenderer.vue',
)

describe('UniversalRenderer 组件', () => {
  it('应剥离由 wrapper 管理的尺寸与间距样式', () => {
    const source = readFileSync(universalRendererPath, 'utf-8')
    expect(source).toContain('delete style.width')
    expect(source).toContain('delete style.height')
    expect(source).toContain('delete style.minHeight')
    expect(source).toContain('delete style.margin')
    expect(source).toContain('delete style.marginTop')
    expect(source).toContain('delete style.marginRight')
    expect(source).toContain('delete style.marginBottom')
    expect(source).toContain('delete style.marginLeft')
  })
})
