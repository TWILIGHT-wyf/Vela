import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'Panel',
  componentName: 'Panel',
  title: '面板',
  version: '1.0.0',
  category: '布局容器',
  isContainer: true,
  props: {
    title: {
      name: 'title',
      label: '标题',
      setter: 'StringSetter',
      defaultValue: '面板标题',
      group: '基础',
    },
    collapsible: {
      name: 'collapsible',
      label: '可折叠',
      setter: 'BooleanSetter',
      defaultValue: false,
      group: '交互',
    },
    collapsed: {
      name: 'collapsed',
      label: '默认折叠',
      setter: 'BooleanSetter',
      defaultValue: false,
      group: '交互',
    },
    showHeader: {
      name: 'showHeader',
      label: '显示头部',
      setter: 'BooleanSetter',
      defaultValue: true,
      group: '显示',
    },
    showFooter: {
      name: 'showFooter',
      label: '显示底部',
      setter: 'BooleanSetter',
      defaultValue: false,
      group: '显示',
    },
    footerContent: {
      name: 'footerContent',
      label: '底部内容',
      setter: 'StringSetter',
      defaultValue: '',
      group: '内容',
    },
    content: {
      name: 'content',
      label: '内容',
      setter: 'StringSetter',
      defaultValue: '这是面板内容',
      group: '内容',
    },
    backgroundColor: {
      name: 'backgroundColor',
      label: '背景颜色',
      setter: 'ColorSetter',
      defaultValue: '#ffffff',
      group: '外观',
    },
    headerBg: {
      name: 'headerBg',
      label: '头部背景',
      setter: 'ColorSetter',
      defaultValue: '#f9fafb',
      group: '外观',
    },
    headerColor: {
      name: 'headerColor',
      label: '头部颜色',
      setter: 'ColorSetter',
      defaultValue: '#111827',
      group: '外观',
    },
  },
  events: ['onCollapse'],
  defaultSize: {
    width: 350,
    height: 250,
  },
}

export default meta
