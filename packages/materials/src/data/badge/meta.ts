import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  componentName: 'Badge',
  title: '徽章',
  category: 'KPI',
  props: {
    value: {
      title: '显示值',
      setter: 'StringSetter',
      defaultValue: '',
    },
    max: {
      title: '最大值',
      setter: 'NumberSetter',
      defaultValue: 99,
    },
    type: {
      title: '类型',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '主要', value: 'primary' },
          { label: '成功', value: 'success' },
          { label: '警告', value: 'warning' },
          { label: '危险', value: 'danger' },
          { label: '信息', value: 'info' },
        ],
      },
      defaultValue: 'primary',
    },
    isDot: {
      title: '显示为小圆点',
      setter: 'BooleanSetter',
      defaultValue: false,
    },
    hidden: {
      title: '隐藏徽章',
      setter: 'BooleanSetter',
      defaultValue: false,
    },
    backgroundColor: {
      title: '背景颜色',
      setter: 'ColorSetter',
      defaultValue: '#409eff',
    },
    textColor: {
      title: '文字颜色',
      setter: 'ColorSetter',
      defaultValue: '#fff',
    },
    fontSize: {
      title: '字体大小',
      setter: 'NumberSetter',
      defaultValue: 12,
    },
  },
  events: [],
}

export default meta
