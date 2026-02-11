import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'Tabs',
  title: '标签页',
  version: '1.0.0',
  category: '布局',
  isContainer: true,
  props: {
    activeTab: {
      name: 'activeTab',
      label: '当前激活标签',
      setter: 'StringSetter',
      defaultValue: '',
      group: '基础',
    },
    type: {
      name: 'type',
      label: '标签页类型',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '线条', value: 'line' },
          { label: '卡片', value: 'card' },
        ],
      },
      defaultValue: 'line',
      group: '样式',
    },
    tabPosition: {
      name: 'tabPosition',
      label: '标签位置',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '顶部', value: 'top' },
          { label: '右侧', value: 'right' },
          { label: '底部', value: 'bottom' },
          { label: '左侧', value: 'left' },
        ],
      },
      defaultValue: 'top',
      group: '布局',
    },
    closable: {
      name: 'closable',
      label: '可关闭',
      setter: 'BooleanSetter',
      defaultValue: false,
      group: '交互',
    },
    tabs: {
      name: 'tabs',
      label: '标签页数据',
      setter: 'JsonSetter',
      defaultValue: [],
      group: '数据',
    },
    backgroundColor: {
      name: 'backgroundColor',
      label: '背景颜色',
      setter: 'ColorSetter',
      defaultValue: '#ffffff',
      group: '外观',
    },
    padding: {
      name: 'padding',
      label: '内边距',
      setter: 'NumberSetter',
      defaultValue: 0,
      group: '样式',
    },
    textColor: {
      name: 'textColor',
      label: '文本颜色',
      setter: 'ColorSetter',
      defaultValue: '#333333',
      group: '外观',
    },
  },
  events: ['onTabClick', 'onTabRemove', 'onTabAdd'],
  defaultSize: {
    width: 400,
    height: 300,
  },
}

export default meta
