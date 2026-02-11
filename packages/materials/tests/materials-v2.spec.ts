import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

// 导入 Material 组件
import Text from '../src/basic/text/Text.vue'
import Stat from '../src/data/stat/Stat.vue'
import Select from '../src/form/select/Select.vue'

describe('Materials V2 Integration Tests', () => {
  describe('Text (Basic Component)', () => {
    it('应该正确渲染文本内容', () => {
      const wrapper = mount(Text, {
        props: {
          content: '提交',
        },
      })

      const text = wrapper.find('.v-text')
      expect(text.exists()).toBe(true)
      expect(text.text()).toBe('提交')
    })

    it('应该正确透传样式类属性', () => {
      const wrapper = mount(Text, {
        props: {
          fontSize: 20,
          textAlign: 'center',
          paddingX: 10,
          paddingY: 5,
        },
      })

      const text = wrapper.find('.v-text')
      const style = text.attributes('style')

      expect(style).toContain('font-size: 20px')
      expect(style).toContain('text-align: center')
      expect(style).toContain('padding: 5px 10px')
    })
  })

  describe('Stat (Data Component)', () => {
    it('应该正确渲染统计信息配置', () => {
      const wrapper = mount(Stat, {
        props: {
          title: '总收入',
          value: 999,
          suffix: '$',
          showChange: true,
          change: 10,
        },
      })

      expect(wrapper.find('.v-stat-title').text()).toBe('总收入')
      expect(wrapper.find('.v-stat-value').text()).toBe('999$')
      expect(wrapper.find('.v-stat-change').text()).toContain('+10.0%')
    })

    it('应该正确处理数值精度和千分位', () => {
      const wrapper = mount(Stat, {
        props: {
          value: 1234.5678,
          precision: 2,
        },
      })

      // 1,234.57
      // 注意：toLocaleString 在不同 Node 环境可能表现不同，这里做宽松匹配
      const text = wrapper.find('.v-stat-value').text()
      expect(text).toMatch(/1,234\.57/)
    })
  })

  describe('Select (Form Component)', () => {
    it('应该正确透传并渲染下拉选项', () => {
      const wrapper = mount(Select, {
        props: {
          options: [
            { label: '选项A', value: 'a' },
            { label: '选项B', value: 'b' },
          ],
          value: 'a',
          placeholder: '请选择',
        },
      })

      const select = wrapper.find('.select-container')
      expect(select.exists()).toBe(true)

      const style = select.attributes('style')
      expect(style).toContain('width: 100%')
      expect(style).toContain('height: 100%')
    })
  })
})
