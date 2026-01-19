import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  componentName: 'Group',
  title: '组合容器',
  category: '布局容器',
  props: {
    title: {
      title: '组标题',
      setter: 'StringSetter',
      defaultValue: '',
    },
    collapsible: {
      title: '可折叠',
      setter: 'BooleanSetter',
      defaultValue: false,
    },
    collapsed: {
      title: '默认折叠',
      setter: 'BooleanSetter',
      defaultValue: false,
    },
    bordered: {
      title: '边框',
      setter: 'BooleanSetter',
      defaultValue: true,
    },
  },
  events: ['onToggle'],
}

export default meta
