import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  componentName: 'Markdown',
  title: 'Markdown',
  category: '内容',
  props: {
    content: {
      title: 'Markdown内容',
      setter: 'StringSetter',
      defaultValue: '# Hello\n\nThis is **markdown** content.',
    },
    theme: {
      title: '主题',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '默认', value: 'default' },
          { label: 'GitHub', value: 'github' },
          { label: '暗色', value: 'dark' },
        ],
      },
      defaultValue: 'default',
    },
  },
  events: [],
}

export default meta
