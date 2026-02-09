import { describe, expect, it } from 'vitest'
import * as rootApi from '../../packages/generator/src/index'
import * as compatApi from '../../packages/generator/src/compat'

describe('generator public api', () => {
  it('主入口仅暴露协议驱动生成 API，不暴露兼容生成 API', () => {
    expect(typeof rootApi.generateFromProject).toBe('function')
    expect('generateCode' in rootApi).toBe(false)
    expect('generateProjectFiles' in rootApi).toBe(false)
  })

  it('compat 入口保留旧版生成 API', () => {
    expect(typeof compatApi.generateCode).toBe('function')
    expect(typeof compatApi.generateProjectFiles).toBe('function')
    expect('generateProjectSourceFiles' in compatApi).toBe(false)
  })
})
