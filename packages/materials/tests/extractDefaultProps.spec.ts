import { describe, it, expect } from 'vitest'
import { extractDefaultProps } from '../src/registry'
import type { PropSchema } from '@vela/core/types'

describe('extractDefaultProps', () => {
  it('should extract flat default values', () => {
    const props: PropSchema[] = [
      { name: 'text', label: 'Text', setter: 'StringSetter', defaultValue: 'Hello' },
      { name: 'size', label: 'Size', setter: 'NumberSetter', defaultValue: 100 },
    ]

    const defaults = extractDefaultProps(props)

    expect(defaults).toEqual({
      text: 'Hello',
      size: 100,
    })
  })

  it('should recursively extract ObjectSetter nested properties', () => {
    const props: PropSchema[] = [
      {
        name: 'styleConfig',
        label: 'Style Config',
        setter: 'ObjectSetter',
        properties: {
          backgroundColor: {
            name: 'backgroundColor',
            label: 'BG Color',
            setter: 'ColorSetter',
            defaultValue: '#ffffff',
          },
          borderRadius: {
            name: 'borderRadius',
            label: 'Border Radius',
            setter: 'NumberSetter',
            defaultValue: 8,
          },
        },
      },
    ]

    const defaults = extractDefaultProps(props)

    expect(defaults).toEqual({
      styleConfig: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
      },
    })
  })

  it('should merge explicit defaultValue with nested properties', () => {
    const props: PropSchema[] = [
      {
        name: 'config',
        label: 'Config',
        setter: 'ObjectSetter',
        defaultValue: { custom: 'value' }, // Explicit top-level default
        properties: {
          width: { name: 'width', label: 'Width', setter: 'NumberSetter', defaultValue: 200 },
          height: { name: 'height', label: 'Height', setter: 'NumberSetter', defaultValue: 100 },
        },
      },
    ]

    const defaults = extractDefaultProps(props)

    // Explicit defaultValue should override nested defaults
    expect(defaults).toEqual({
      config: {
        width: 200,
        height: 100,
        custom: 'value', // Preserved from explicit defaultValue
      },
    })
  })

  it('should handle deeply nested ObjectSetters', () => {
    const props: PropSchema[] = [
      {
        name: 'header',
        label: 'Header',
        setter: 'ObjectSetter',
        properties: {
          title: {
            name: 'title',
            label: 'Title',
            setter: 'StringSetter',
            defaultValue: 'Header Title',
          },
          style: {
            name: 'style',
            label: 'Header Style',
            setter: 'ObjectSetter',
            properties: {
              fontSize: {
                name: 'fontSize',
                label: 'Font Size',
                setter: 'NumberSetter',
                defaultValue: 16,
              },
              color: { name: 'color', label: 'Color', setter: 'ColorSetter', defaultValue: '#333' },
            },
          },
        },
      },
    ]

    const defaults = extractDefaultProps(props)

    expect(defaults).toEqual({
      header: {
        title: 'Header Title',
        style: {
          fontSize: 16,
          color: '#333',
        },
      },
    })
  })

  it('should skip properties without defaultValue', () => {
    const props: PropSchema[] = [
      { name: 'required', label: 'Required', setter: 'StringSetter' }, // No default
      { name: 'optional', label: 'Optional', setter: 'StringSetter', defaultValue: 'default' },
    ]

    const defaults = extractDefaultProps(props)

    expect(defaults).toEqual({
      optional: 'default',
    })
    expect(defaults).not.toHaveProperty('required')
  })
})
