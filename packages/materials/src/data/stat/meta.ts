import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  componentName: 'Stat',
  title: '统计指标',
  category: '数据',
  props: {
    title: {
      title: '标题',
      setter: 'StringSetter',
      defaultValue: '总销售额',
    },
    value: {
      title: '数值',
      setter: 'NumberSetter',
      defaultValue: 0,
    },
    precision: {
      title: '精度',
      setter: 'NumberSetter',
      defaultValue: 0,
    },
    prefix: {
      title: '前缀',
      setter: 'StringSetter',
      defaultValue: '',
    },
    suffix: {
      title: '后缀',
      setter: 'StringSetter',
      defaultValue: '',
    },
    trend: {
      title: '趋势',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '无', value: 'none' },
          { label: '上升', value: 'up' },
          { label: '下降', value: 'down' },
        ],
      },
      defaultValue: 'none',
    },
    trendValue: {
      title: '趋势值',
      setter: 'StringSetter',
      defaultValue: '',
    },
    backgroundColor: {
      title: '背景颜色',
      setter: 'ColorSetter',
      defaultValue: '#fff',
    },
    borderColor: {
      title: '边框颜色',
      setter: 'ColorSetter',
      defaultValue: '#e0e0e0',
    },
    borderRadius: {
      title: '边框圆角',
      setter: 'NumberSetter',
      defaultValue: 8,
    },
    titleColor: {
      title: '标题颜色',
      setter: 'ColorSetter',
      defaultValue: '#333',
    },
    valueColor: {
      title: '数值颜色',
      setter: 'ColorSetter',
      defaultValue: '#3f8600',
    },
    valueFontSize: {
      title: '数值字体大小',
      setter: 'NumberSetter',
      defaultValue: 24,
    },
  },
  events: [],
}

export default meta
