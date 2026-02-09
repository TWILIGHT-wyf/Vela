import { describe, expect, it } from 'vitest'
import { generateReactCode } from '../../packages/generator/src/generators/react-generator'
import type { IRComponent } from '../../packages/generator/src/types/ir'

function createIRFixture(): IRComponent {
  return {
    name: 'ShowCase',
    template: [
      {
        id: 'node_1',
        type: 'div',
        props: [],
        children: [],
        directives: [
          {
            type: 'show',
            condition: 'visible',
          },
        ],
        events: [],
        slots: [],
        style: {
          width: '100px',
          height: '40px',
        },
        classes: [],
      },
    ],
    script: {
      imports: [],
      variables: [],
      functions: [],
      lifecycles: [],
      reactiveState: [],
      computedProps: [],
      watchers: [],
    },
    style: {
      scoped: true,
      rules: [],
      keyframes: [],
    },
  }
}

describe('react-generator', () => {
  it('v-show 与静态样式应合并为单一 style 属性，避免 React 构建报错', () => {
    const code = generateReactCode(createIRFixture())
    const styleAttrCount = code.match(/style=\{/g)?.length ?? 0

    expect(styleAttrCount).toBe(1)
    expect(code).toContain(`display: visible ? undefined : 'none'`)
    expect(code).not.toContain('style={{ ...style,')
  })
})
