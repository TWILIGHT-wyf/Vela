import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'Stat',
  componentName: 'Stat',
  title: '统计指标',
  version: '1.0.0',
  category: '数据',
  props: {
    title: {
      name: 'title',
      label: '标题',
      setter: 'StringSetter',
      defaultValue: '总销售额',
      group: '基础',
    },
    value: {
      name: 'value',
      label: '数值',
      setter: 'NumberSetter',
      defaultValue: 12345,
      group: '数据',
    },
    precision: {
      name: 'precision',
      label: '精度',
      setter: 'NumberSetter',
      defaultValue: 0,
      group: '数据',
    },
    prefix: {
      name: 'prefix',
      label: '前缀',
      setter: 'StringSetter',
      defaultValue: '',
      group: '基础',
    },
    suffix: {
      name: 'suffix',
      label: '后缀',
      setter: 'StringSetter',
      defaultValue: '',
      group: '基础',
    },
    trend: {
      name: 'trend',
      label: '趋势',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '无', value: 'none' },
          { label: '上升', value: 'up' },
          { label: '下降', value: 'down' },
        ],
      },
      defaultValue: 'none',
      group: '数据',
    },
    trendValue: {
      name: 'trendValue',
      label: '趋势值',
      setter: 'StringSetter',
      defaultValue: '',
      group: '数据',
    },
    backgroundColor: {
      name: 'backgroundColor',
      label: '背景颜色',
      setter: 'ColorSetter',
      defaultValue: '#fff',
      group: '样式',
    },
    borderColor: {
      name: 'borderColor',
      label: '边框颜色',
      setter: 'ColorSetter',
      defaultValue: '#e0e0e0',
      group: '样式',
    },
    borderRadius: {
      name: 'borderRadius',
      label: '边框圆角',
      setter: 'NumberSetter',
      defaultValue: 8,
      group: '样式',
    },
    titleColor: {
      name: 'titleColor',
      label: '标题颜色',
      setter: 'ColorSetter',
      defaultValue: '#333',
      group: '样式',
    },
    valueColor: {
      name: 'valueColor',
      label: '数值颜色',
      setter: 'ColorSetter',
      defaultValue: '#3f8600',
      group: '样式',
    },
    valueFontSize: {
      name: 'valueFontSize',
      label: '数值字体大小',
      setter: 'NumberSetter',
      defaultValue: 24,
      group: '样式',
    },
  },
  events: [],
  defaultSize: {
    width: 200,
    height: 120,
  },
}

export default meta
