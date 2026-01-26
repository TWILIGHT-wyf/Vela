import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'Breadcrumb',
  componentName: 'Breadcrumb',
  title: '面包屑',
  version: '1.0.0',
  category: '基础控件',
  props: {
    separator: {
      name: 'separator',
      label: '分隔符',
      setter: 'StringSetter',
      defaultValue: '/',
      group: '基础',
    },
    items: {
      name: 'items',
      label: '面包屑项',
      setter: 'JsonSetter',
      defaultValue: [],
      group: '数据',
    },
    fontSize: {
      name: 'fontSize',
      label: '字体大小',
      setter: 'NumberSetter',
      defaultValue: 14,
      group: '样式',
    },
    color: {
      name: 'color',
      label: '文字颜色',
      setter: 'ColorSetter',
      defaultValue: '#606266',
      group: '样式',
    },
    activeColor: {
      name: 'activeColor',
      label: '当前项颜色',
      setter: 'ColorSetter',
      defaultValue: '#909399',
      group: '样式',
    },
    linkColor: {
      name: 'linkColor',
      label: '链接颜色',
      setter: 'ColorSetter',
      defaultValue: '#409eff',
      group: '样式',
    },
  },
  events: ['onClick'],
  defaultSize: {
    width: 300,
    height: 32,
  },
}

export default meta
