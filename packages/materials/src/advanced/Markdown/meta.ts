import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'Markdown',
  title: 'Markdown',
  version: '1.0.0',
  category: '内容',
  props: {
    content: {
      name: 'content',
      label: 'Markdown内容',
      setter: 'StringSetter',
      defaultValue: '# Hello\n\nThis is **markdown** content.',
      group: '内容',
    },
    theme: {
      name: 'theme',
      label: '主题',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '默认', value: 'default' },
          { label: 'GitHub', value: 'github' },
          { label: '暗色', value: 'dark' },
        ],
      },
      defaultValue: 'default',
      group: '样式',
    },
  },
  events: [],
  defaultSize: {
    width: 400,
    height: 300,
  },
}

export default meta
