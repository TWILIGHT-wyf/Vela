import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import NodeWrapper from '../../renderer/src/runtime/NodeWrapper.vue'
import type { NodeSchema } from '@vela/core'

// 我们直接引用文件而不是 @vela/renderer，因为在单测环境中 alias 可能有问题，直接引相对路径最稳
// ../../renderer -> packages/renderer

describe('Editor Integration', () => {
  const mockNode: NodeSchema = {
    id: 'node-1',
    componentName: 'BaseButton',
    style: {
      x: 10,
      y: 20,
      width: 100,
      height: 50,
      rotate: 45,
    },
  }

  describe('NodeWrapper', () => {
    it('should render absolute position in free mode', () => {
      const wrapper = mount(NodeWrapper, {
        props: {
          node: mockNode,
          layoutMode: 'free',
        },
      })

      const style = wrapper.attributes('style')
      expect(style).toContain('position: absolute')
      expect(style).toContain('left: 10px')
      expect(style).toContain('top: 20px')
      expect(style).toContain('width: 100px')
      expect(style).toContain('height: 50px')
      expect(style).toContain('transform: rotate(45deg)')
    })

    it('should render relative position in flow mode', () => {
      const wrapper = mount(NodeWrapper, {
        props: {
          node: {
            ...mockNode,
            style: { width: '100%', height: 200, marginTop: 10 },
          },
          layoutMode: 'flow',
        },
      })

      const style = wrapper.attributes('style')
      expect(style).toContain('position: relative')
      expect(style).toContain('width: 100%')
      expect(style).toContain('height: 200px')
      expect(style).toContain('margin-top: 10px')
    })

    it('should emit select event on mousedown', async () => {
      const wrapper = mount(NodeWrapper, {
        props: {
          node: mockNode,
          layoutMode: 'free',
        },
      })

      await wrapper.trigger('mousedown')
      expect(wrapper.emitted('select')).toBeTruthy()
      expect(wrapper.emitted('select')![0]).toEqual(['node-1'])
    })
  })
})
