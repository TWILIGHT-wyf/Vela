import { describe, it, expect, vi } from 'vitest'
import { evaluate, validateCode } from '../src/utils/sandbox'

describe('Sandbox', () => {
  it('should execute simple math', () => {
    const result = evaluate('1 + 1')
    expect(result).toBe(2)
  })

  it('should access context variables', () => {
    const context = { a: 10, b: 20 }
    const result = evaluate('a + b', context)
    expect(result).toBe(30)
  })

  it('should access whitelisted globals', () => {
    const result = evaluate('Math.max(1, 5)')
    expect(result).toBe(5)
  })

  it('should block window access', () => {
    // Mock console.error to suppress output (now uses error for security violations)
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = evaluate('window')
    expect(result).toBeUndefined()
    expect(errorSpy).toHaveBeenCalled()

    errorSpy.mockRestore()
  })

  it('should validate static code', () => {
    expect(validateCode('1 + 1')).toBe(true)
    expect(validateCode('window.open()')).toBe(false)
    expect(validateCode('eval("hack")')).toBe(false)
  })
})
