import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  componentName: 'NavButton',
  title: '导航按钮',
  category: '基础控件',
  props: {
    label: {
      title: '按钮文字',
      setter: 'StringSetter',
      defaultValue: '跳转',
    },
    showLabel: {
      title: '显示文字',
      setter: 'BooleanSetter',
      defaultValue: true,
    },
    icon: {
      title: '图标名称',
      setter: 'StringSetter',
      defaultValue: 'ArrowRight',
    },
    iconSize: {
      title: '图标大小',
      setter: 'NumberSetter',
      defaultValue: 20,
    },
    fontSize: {
      title: '字体大小',
      setter: 'NumberSetter',
      defaultValue: 14,
    },
    targetPageId: {
      title: '目标页面ID',
      setter: 'StringSetter',
      defaultValue: '',
    },
    url: {
      title: '外部链接',
      setter: 'StringSetter',
      defaultValue: '',
    },
    openInNewTab: {
      title: '新标签页打开',
      setter: 'BooleanSetter',
      defaultValue: false,
    },
    backgroundColor: {
      title: '背景颜色',
      setter: 'ColorSetter',
      defaultValue: '#409eff',
    },
    color: {
      title: '文字颜色',
      setter: 'ColorSetter',
      defaultValue: '#ffffff',
    },
    shadow: {
      title: '显示阴影',
      setter: 'BooleanSetter',
      defaultValue: false,
    },
  },
  events: ['onClick'],
}

export default meta
