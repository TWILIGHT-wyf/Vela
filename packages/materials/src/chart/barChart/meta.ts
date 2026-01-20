import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  componentName: 'BarChart',
  title: '柱状图',
  category: '图表',
  props: {
    title: {
      title: '图表标题',
      setter: 'StringSetter',
      defaultValue: '',
    },
    seriesName: {
      title: '系列名称',
      setter: 'StringSetter',
      defaultValue: 'Series',
    },
    showLegend: {
      title: '显示图例',
      setter: 'BooleanSetter',
      defaultValue: true,
    },
    legendPosition: {
      title: '图例位置',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '顶部', value: 'top' },
          { label: '底部', value: 'bottom' },
          { label: '左侧', value: 'left' },
          { label: '右侧', value: 'right' },
        ],
      },
      defaultValue: 'top',
    },
    showTooltip: {
      title: '显示提示',
      setter: 'BooleanSetter',
      defaultValue: true,
    },
    showGrid: {
      title: '显示网格',
      setter: 'BooleanSetter',
      defaultValue: true,
    },
    showLabel: {
      title: '显示标签',
      setter: 'BooleanSetter',
      defaultValue: false,
    },
    barColor: {
      title: '柱子颜色',
      setter: 'ColorSetter',
      defaultValue: '#409eff',
    },
    barWidth: {
      title: '柱宽度',
      setter: 'StringSetter',
      defaultValue: '60%',
    },
    borderRadius: {
      title: '柱圆角',
      setter: 'NumberSetter',
      defaultValue: 0,
    },
    xAxisName: {
      title: 'X轴名称',
      setter: 'StringSetter',
      defaultValue: '',
    },
    yAxisName: {
      title: 'Y轴名称',
      setter: 'StringSetter',
      defaultValue: '',
    },
    xAxisData: {
      title: 'X轴数据',
      setter: 'JsonSetter',
      defaultValue: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    data: {
      title: '数据',
      setter: 'JsonSetter',
      defaultValue: [120, 200, 150, 180, 270, 210, 220],
    },
    option: {
      title: '高级配置(JSON)',
      setter: 'JsonSetter',
      defaultValue: {},
    },
  },
  events: [],
}

export default meta
