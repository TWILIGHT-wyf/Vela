import { describe, it, expect } from 'vitest'
import { translate } from '../src/types/i18n'

describe('i18n', () => {
  it('should return empty for null', () => {
    expect(translate(undefined)).toBe('')
  })

  it('should return string as is', () => {
    expect(translate('Hello')).toBe('Hello')
  })

  it('should return requested locale', () => {
    const text = { 'zh-CN': '你好', 'en-US': 'Hello' }
    expect(translate(text, 'zh-CN')).toBe('你好')
    expect(translate(text, 'en-US')).toBe('Hello')
  })

  it('should fallback to default locale', () => {
    const text = { 'zh-CN': '你好', 'en-US': 'Hello' }
    expect(translate(text, 'ja-JP', 'zh-CN')).toBe('你好')
  })

  it('should fallback to first key if default missing', () => {
    const text = { 'fr-FR': 'Bonjour' }
    expect(translate(text, 'en-US', 'zh-CN')).toBe('Bonjour')
  })
})
