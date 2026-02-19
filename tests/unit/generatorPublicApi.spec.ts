import { describe, expect, it } from 'vitest'
import * as rootApi from '../../packages/generator/src/index'

describe('generator public api', () => {
  it('主入口仅暴露协议驱动生成 API', () => {
    expect(typeof rootApi.generateFromProject).toBe('function')
    expect('generateCode' in rootApi).toBe(false)
    expect('generateProjectFiles' in rootApi).toBe(false)
    expect('compat' in rootApi).toBe(false)
  })
})
