import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  componentName: 'Slider',
  title: '滑块',
  category: '基础控件',
  props: {
    min: {
      title: '最小值',
      setter: 'NumberSetter',
      defaultValue: 0,
    },
    max: {
      title: '最大值',
      setter: 'NumberSetter',
      defaultValue: 100,
    },
    step: {
      title: '步长',
      setter: 'NumberSetter',
      defaultValue: 1,
    },
    defaultValue: {
      title: '默认值',
      setter: 'NumberSetter',
      defaultValue: 0,
    },
    showInput: {
      title: '显示输入框',
      setter: 'BooleanSetter',
      defaultValue: false,
    },
    showInputControls: {
      title: '显示输入框控制按钮',
      setter: 'BooleanSetter',
      defaultValue: true,
    },
    showStops: {
      title: '显示间断点',
      setter: 'BooleanSetter',
      defaultValue: false,
    },
    showTooltip: {
      title: '显示提示',
      setter: 'BooleanSetter',
      defaultValue: true,
    },
    range: {
      title: '范围选择',
      setter: 'BooleanSetter',
      defaultValue: false,
    },
    vertical: {
      title: '垂直模式',
      setter: 'BooleanSetter',
      defaultValue: false,
    },
    height: {
      title: '垂直模式高度',
      setter: 'StringSetter',
      defaultValue: '200px',
    },
    activeColor: {
      title: '激活颜色',
      setter: 'ColorSetter',
      defaultValue: '#409eff',
    },
    inactiveColor: {
      title: '未激活颜色',
      setter: 'ColorSetter',
      defaultValue: '#e4e7ed',
    },
  },
  events: ['onChange'],
}

export default meta
