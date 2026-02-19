import { describe, it, expect } from 'vitest'
import { serialize, deserialize } from '../src/utils/serializer'

describe('Serializer', () => {
  interface TaggedValue {
    __type: string
    value: unknown
  }

  it('should handle basic types', () => {
    const data = { a: 1, b: 'str', c: true, d: null }
    const json = JSON.stringify(serialize(data))
    const restored = deserialize(JSON.parse(json))
    expect(restored).toEqual(data)
  })

  it('should handle Date', () => {
    const date = new Date('2023-01-01T00:00:00.000Z')
    const data = { time: date }

    const serialized = serialize(data) as { time: TaggedValue }
    expect(serialized.time.__type).toBe('Date')

    const restored = deserialize<{ time: Date }>(serialized)
    expect(restored.time).toBeInstanceOf(Date)
    expect(restored.time.toISOString()).toBe(date.toISOString())
  })

  it('should handle RegExp', () => {
    const regex = /abc/gi
    const data = { pattern: regex }

    const serialized = serialize(data) as { pattern: TaggedValue }
    expect(serialized.pattern.__type).toBe('RegExp')

    const restored = deserialize<{ pattern: RegExp }>(serialized)
    expect(restored.pattern).toBeInstanceOf(RegExp)
    expect(restored.pattern.source).toBe('abc')
    expect(restored.pattern.flags).toBe('gi')
  })

  it('should handle Map', () => {
    // Explicitly type the map to avoid TS inference issues with mixed value types
    const map = new Map<string, unknown>([
      ['key1', 'val1'],
      ['key2', 2],
    ])
    const data = { map }

    const serialized = serialize(data) as { map: TaggedValue }
    expect(serialized.map.__type).toBe('Map')

    const restored = deserialize<{ map: Map<string, unknown> }>(serialized)
    expect(restored.map).toBeInstanceOf(Map)
    expect(restored.map.get('key1')).toBe('val1')
    expect(restored.map.get('key2')).toBe(2)
  })
})
