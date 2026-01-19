import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  componentName: 'Breadcrumb',
  title: '面包屑',
  category: '基础控件',
  props: {
    separator: {
      title: '分隔符',
      setter: 'StringSetter',
      defaultValue: '/',
    },
    items: {
      title: '面包屑项',
      setter: 'JsonSetter',
      defaultValue: [],
    },
    fontSize: {
      title: '字体大小',
      setter: 'NumberSetter',
      defaultValue: 14,
    },
    color: {
      title: '文字颜色',
      setter: 'ColorSetter',
      defaultValue: '#606266',
    },
    activeColor: {
      title: '当前项颜色',
      setter: 'ColorSetter',
      defaultValue: '#909399',
    },
    linkColor: {
      title: '链接颜色',
      setter: 'ColorSetter',
      defaultValue: '#409eff',
    },
  },
  events: ['onClick'],
}

export default meta
