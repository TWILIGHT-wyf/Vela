import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

// 导入 Material 组件
import BaseButton from '../src/basic/BaseButton/BaseButton.vue'
import KpiCard from '../src/data/KpiCard/KpiCard.vue'
import GridBox from '../src/layout/GridBox/GridBox.vue'

describe('Materials V2 Integration Tests', () => {
  describe('BaseButton (Atomic Component)', () => {
    it('应该正确渲染文本和基础类型', () => {
      const wrapper = mount(BaseButton, {
        props: {
          text: '提交',
          type: 'danger',
        },
      })

      // Material HOC 可能会包裹一层 div (如果 fillContainer=true，但 BaseButton 是 false)
      // 检查 UI 组件是否接收到了 Props
      const button = wrapper.find('.v-button')
      expect(button.exists()).toBe(true)
      expect(button.text()).toBe('提交')
      expect(button.classes()).toContain('v-button--danger')
    })

    it('应该正确应用 ObjectSetter 样式配置', () => {
      const wrapper = mount(BaseButton, {
        props: {
          styleConfig: {
            backgroundColor: 'red',
            fontSize: 20,
            borderRadius: 10,
          },
        },
      })

      const button = wrapper.find('.v-button')
      const style = button.attributes('style')

      expect(style).toContain('background-color: red')
      // expect(wrapper.text()).toContain('Click Me') // 暂时跳过 slot 测试
    })
  })

  describe('KpiCard (Data Component)', () => {
    it('应该正确渲染结构化数据配置', () => {
      const wrapper = mount(KpiCard, {
        props: {
          header: { title: '总收入' },
          content: { value: 999, prefix: '$' },
          footer: { trend: { value: '10%', type: 'up' } },
        },
      })

      expect(wrapper.find('.v-stat-card__title').text()).toBe('总收入')
      expect(wrapper.find('.v-stat-card__prefix').text()).toBe('$')
      expect(wrapper.find('.v-stat-card__value').text()).toBe('999')
      expect(wrapper.find('.v-stat-card__trend').classes()).toContain('is-up')
    })

    it('应该正确处理数值精度和千分位', () => {
      const wrapper = mount(KpiCard, {
        props: {
          content: {
            value: 1234.5678,
            precision: 2,
            separator: true,
          },
        },
      })

      // 1,234.57
      // 注意：toLocaleString 在不同 Node 环境可能表现不同，这里做宽松匹配
      const text = wrapper.find('.v-stat-card__value').text()
      expect(text).toMatch(/1,234\.57/)
    })
  })

  describe('GridBox (Layout Container)', () => {
    it('应该正确应用 Grid 布局样式', () => {
      const wrapper = mount(GridBox, {
        props: {
          layout: {
            columns: 4,
            gap: 20,
          },
        },
      })

      console.log('GridBox HTML:', wrapper.html())

      const grid = wrapper.find('.v-grid')
      const style = grid.attributes('style')

      expect(style).toContain('display: grid')
      expect(style).toContain('grid-template-columns: repeat(4, 1fr)')
      expect(style).toContain('gap: 20px 20px')
    })

    // it('应该透传插槽内容', () => { ... }) // 暂时跳过 slot 测试
  })
})
