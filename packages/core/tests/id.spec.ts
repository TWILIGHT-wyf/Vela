import { describe, it, expect } from 'vitest'
import { generateId, generateShortId } from '../src/utils/id'

describe('generateId', () => {
  it('should generate a unique ID', () => {
    const id1 = generateId()
    const id2 = generateId()
    expect(id1).not.toBe(id2)
  })

  it('should include prefix when provided', () => {
    const id = generateId('button')
    expect(id).toMatch(/^button_/)
  })

  it('should clean prefix of non-alphanumeric characters', () => {
    const id = generateId('my-component!')
    expect(id).toMatch(/^mycomponent_/)
  })

  it('should generate IDs with timestamp + random parts', () => {
    const id = generateId()
    // Base36 timestamp (8 chars) + random (6 chars) = 14 chars total
    expect(id.length).toBeGreaterThanOrEqual(14)
  })

  it('should only contain URL-safe characters', () => {
    const id = generateId('test')
    expect(id).toMatch(/^[a-zA-Z0-9_]+$/)
  })

  it('should generate roughly ordered IDs by time', () => {
    const ids: string[] = []
    for (let i = 0; i < 10; i++) {
      ids.push(generateId())
    }
    // IDs should be roughly in order (same timestamp prefix for IDs generated quickly)
    const sortedIds = [...ids].sort()
    // At least the first few should be in order
    expect(ids[0]).toBe(sortedIds[0])
  })
})

describe('generateShortId', () => {
  it('should generate an 8-character ID', () => {
    const id = generateShortId()
    expect(id).toHaveLength(8)
  })

  it('should generate unique IDs', () => {
    const ids = new Set<string>()
    for (let i = 0; i < 1000; i++) {
      ids.add(generateShortId())
    }
    // All 1000 IDs should be unique
    expect(ids.size).toBe(1000)
  })

  it('should only contain alphanumeric characters', () => {
    const id = generateShortId()
    expect(id).toMatch(/^[a-zA-Z0-9]+$/)
  })
})
