import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  componentName: 'Iframe',
  title: 'IFrame',
  category: '内容',
  props: {
    src: {
      title: '网页地址',
      setter: 'StringSetter',
      defaultValue: '',
    },
    title: {
      title: '标题',
      setter: 'StringSetter',
      defaultValue: '',
    },
    sandbox: {
      title: '沙箱模式',
      setter: 'StringSetter',
      defaultValue: '',
    },
    allow: {
      title: '权限策略',
      setter: 'StringSetter',
      defaultValue: '',
    },
  },
  events: ['onLoad'],
}

export default meta
