import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'Iframe',
  componentName: 'Iframe',
  title: 'IFrame',
  version: '1.0.0',
  category: '内容',
  props: {
    src: {
      name: 'src',
      label: '网页地址',
      setter: 'StringSetter',
      defaultValue: '',
      group: '基础',
    },
    title: {
      name: 'title',
      label: '标题',
      setter: 'StringSetter',
      defaultValue: '',
      group: '基础',
    },
    sandbox: {
      name: 'sandbox',
      label: '沙箱模式',
      setter: 'StringSetter',
      defaultValue: '',
      group: '安全',
    },
    allow: {
      name: 'allow',
      label: '权限策略',
      setter: 'StringSetter',
      defaultValue: '',
      group: '安全',
    },
  },
  events: ['onLoad'],
  defaultSize: {
    width: 600,
    height: 400,
  },
}

export default meta
