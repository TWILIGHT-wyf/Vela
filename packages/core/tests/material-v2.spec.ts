import { describe, it, expect } from 'vitest'
import { Validator } from '../src/model/validator'
import { serialize, deserialize } from '../src/utils/serializer'
import type { MaterialMeta, NodeSchema, PropValue } from '../src/types'

// Mock 一个 V2 物料的 Meta
const MockButtonV2Meta: MaterialMeta = {
  name: 'ButtonV2',
  title: '按钮 V2',
  version: '2.0.0',
  category: '基础',
  props: {
    text: { name: 'text', label: '文本', setter: 'StringSetter' },
    config: {
      name: 'config',
      label: '配置',
      setter: 'ObjectSetter',
      properties: {
        style: {
          name: 'style',
          label: '样式',
          setter: 'ObjectSetter',
          properties: {
            color: { name: 'color', label: '颜色', setter: 'ColorSetter' },
            width: { name: 'width', label: '宽度', setter: 'NumberSetter' },
          },
        },
      },
    },
  },
}

describe('Core: Material V2 Architecture', () => {
  describe('Schema Definition', () => {
    it('应该支持 ObjectSetter 定义嵌套属性', () => {
      const configProp = MockButtonV2Meta.props['config']
      expect(configProp.setter).toBe('ObjectSetter')
      expect(configProp.properties).toBeDefined()
      expect(configProp.properties?.style.setter).toBe('ObjectSetter')
    })
  })

  describe('Validator (Current Limitations)', () => {
    it('目前无法校验 Prop 值类型不匹配的情况', () => {
      const invalidNode: NodeSchema = {
        id: '1',
        componentName: 'ButtonV2',
        props: {
          config: {
            style: {
              width: 'invalid_string', // 应该是 number
            },
          },
        },
      }

      // 目前的校验器只检查容器属性，不检查 Prop 类型
      // 这个测试通过意味着我们需要在未来加强 Validator
      expect(() => {
        Validator.validateNode(invalidNode, null, { ButtonV2: MockButtonV2Meta })
      }).not.toThrow()
    })
  })

  describe('Serializer with V2 Data', () => {
    it('应该能序列化包含 JSExpression 的深度嵌套对象', () => {
      const v2Props = {
        config: {
          style: {
            width: 100,
            // 嵌套属性绑定表达式
            color: {
              type: 'JSExpression',
              value: 'state.theme.primaryColor',
            } as PropValue,
          },
        },
      }

      const serialized = serialize(v2Props) as {
        config: {
          style: {
            width: number
            color: { type: string; value: string }
          }
        }
      }
      expect(serialized.config.style.width).toBe(100)
      expect(serialized.config.style.color).toEqual({
        type: 'JSExpression',
        value: 'state.theme.primaryColor',
      })

      // 反序列化验证
      const deserialized = deserialize<typeof serialized>(serialized)
      expect(deserialized.config.style.color.value).toBe('state.theme.primaryColor')
    })
  })
})
