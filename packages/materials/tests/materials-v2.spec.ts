import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

// 导入 Material 组件
import Text from '../src/basic/text/Text.vue'
import KpiCard from '../src/data/KpiCard/KpiCard.vue'
import GridBox from '../src/layout/GridBox/GridBox.vue'

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
