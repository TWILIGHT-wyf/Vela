import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineMaterial } from '../src/utils/defineMaterial'

describe('defineMaterial', () => {
  it('should forward class/style/data attrs to material wrapper when fillContainer is true', () => {
    const RawComponent = defineComponent({
      name: 'RawComponent',
      template: '<div class="raw-component">raw</div>',
    })

    const MaterialComponent = defineMaterial(RawComponent, {
      name: 'TestMaterial',
      fillContainer: true,
    })

    const wrapper = mount(MaterialComponent, {
      attrs: {
        class: 'universal-node-content',
        style: 'padding-top: 24px; padding-left: 12px;',
        'data-id': 'node_1',
      },
    })

    const materialWrapper = wrapper.find('.material-wrapper')
    expect(materialWrapper.exists()).toBe(true)
    expect(materialWrapper.classes()).toContain('universal-node-content')
    expect(materialWrapper.attributes('data-id')).toBe('node_1')
    expect(materialWrapper.attributes('style')).toContain('padding-top: 24px')
    expect(materialWrapper.attributes('style')).toContain('padding-left: 12px')

    const inner = wrapper.find('.raw-component')
    expect(inner.exists()).toBe(true)
    expect(inner.classes()).not.toContain('universal-node-content')
    expect(inner.attributes('data-id')).toBeUndefined()
  })
})
