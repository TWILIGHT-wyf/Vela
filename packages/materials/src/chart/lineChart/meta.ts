import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  componentName: 'LineChart',
  title: '折线图',
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
    showSymbol: {
      title: '显示标记点',
      setter: 'BooleanSetter',
      defaultValue: true,
    },
    smooth: {
      title: '平滑曲线',
      setter: 'BooleanSetter',
      defaultValue: false,
    },
    showArea: {
      title: '区域填充',
      setter: 'BooleanSetter',
      defaultValue: false,
    },
    lineColor: {
      title: '线条颜色',
      setter: 'ColorSetter',
      defaultValue: '#409eff',
    },
    lineWidth: {
      title: '线条宽度',
      setter: 'NumberSetter',
      defaultValue: 2,
    },
    xAxisData: {
      title: 'X轴数据',
      setter: 'JsonSetter',
      defaultValue: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    data: {
      title: '数据',
      setter: 'JsonSetter',
      defaultValue: [150, 230, 224, 218, 135, 147, 260],
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
