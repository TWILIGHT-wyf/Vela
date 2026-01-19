import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  componentName: 'Text',
  title: '文本',
  category: '基础组件',
  props: {
    content: {
      title: '内容',
      setter: 'StringSetter',
      defaultValue: '文本内容',
    },
  },
  events: ['onClick'],
}

export default meta
