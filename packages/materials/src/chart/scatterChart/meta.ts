import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  componentName: 'ScatterChart',
  title: '散点图',
  category: '图表',
  props: {
    title: {
      title: '图表标题',
      setter: 'StringSetter',
      defaultValue: '',
    },
    showLegend: {
      title: '显示图例',
      setter: 'BooleanSetter',
      defaultValue: true,
    },
    showGrid: {
      title: '显示网格',
      setter: 'BooleanSetter',
      defaultValue: true,
    },
    symbolSize: {
      title: '点大小',
      setter: 'NumberSetter',
      defaultValue: 10,
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
    data: {
      title: '数据',
      setter: 'JsonSetter',
      defaultValue: [
        [10.0, 8.04],
        [8.0, 6.95],
        [13.0, 7.58],
        [9.0, 8.81],
        [11.0, 8.33],
        [14.0, 9.96],
        [6.0, 7.24],
        [4.0, 4.26],
        [12.0, 10.84],
        [7.0, 4.82],
        [5.0, 5.68],
      ],
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
