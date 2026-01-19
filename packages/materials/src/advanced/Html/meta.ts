import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  componentName: 'Html',
  title: 'HTML',
  category: '内容',
  props: {
    content: {
      title: 'HTML内容',
      setter: 'StringSetter',
      defaultValue: '<div>Hello World</div>',
    },
    sanitize: {
      title: '安全过滤',
      setter: 'BooleanSetter',
      defaultValue: true,
    },
  },
  events: [],
}

export default meta
