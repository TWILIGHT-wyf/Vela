import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'Html',
  title: 'HTML',
  version: '1.0.0',
  category: '内容',
  props: {
    content: {
      name: 'content',
      label: 'HTML内容',
      setter: 'StringSetter',
      defaultValue: '<div>Hello World</div>',
      group: '内容',
    },
    sanitize: {
      name: 'sanitize',
      label: '安全过滤',
      setter: 'BooleanSetter',
      defaultValue: true,
      group: '安全',
    },
  },
  events: [],
  defaultSize: {
    width: 300,
    height: 200,
  },
}

export default meta
