import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'NavButton',
  title: '导航按钮',
  version: '1.0.0',
  category: '导航',
  props: {
    label: {
      name: 'label',
      label: '按钮文字',
      setter: 'StringSetter',
      defaultValue: '跳转',
      group: '基础',
    },
    showLabel: {
      name: 'showLabel',
      label: '显示文字',
      setter: 'BooleanSetter',
      defaultValue: true,
      group: '显示',
    },
    icon: {
      name: 'icon',
      label: '图标名称',
      setter: 'StringSetter',
      defaultValue: 'ArrowRight',
      group: '基础',
    },
    iconSize: {
      name: 'iconSize',
      label: '图标大小',
      setter: 'NumberSetter',
      defaultValue: 20,
      group: '样式',
    },
    fontSize: {
      name: 'fontSize',
      label: '字体大小',
      setter: 'NumberSetter',
      defaultValue: 14,
      group: '样式',
    },
    targetPageId: {
      name: 'targetPageId',
      label: '目标页面ID',
      setter: 'StringSetter',
      defaultValue: '',
      group: '导航',
    },
    url: {
      name: 'url',
      label: '外部链接',
      setter: 'StringSetter',
      defaultValue: '',
      group: '导航',
    },
    openInNewTab: {
      name: 'openInNewTab',
      label: '新标签页打开',
      setter: 'BooleanSetter',
      defaultValue: false,
      group: '导航',
    },
    backgroundColor: {
      name: 'backgroundColor',
      label: '背景颜色',
      setter: 'ColorSetter',
      defaultValue: '#409eff',
      group: '样式',
    },
    color: {
      name: 'color',
      label: '文字颜色',
      setter: 'ColorSetter',
      defaultValue: '#ffffff',
      group: '样式',
    },
    shadow: {
      name: 'shadow',
      label: '显示阴影',
      setter: 'BooleanSetter',
      defaultValue: false,
      group: '样式',
    },
  },
  events: ['onClick'],
  defaultSize: {
    width: 100,
    height: 40,
  },
}

export default meta
