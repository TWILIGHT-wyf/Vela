import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  componentName: 'StackedBarChart',
  title: '堆叠柱状图',
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
    xAxisData: {
      title: 'X轴数据',
      setter: 'JsonSetter',
      defaultValue: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    seriesData: {
      title: '系列数据',
      setter: 'JsonSetter',
      defaultValue: [
        [120, 132, 101, 134, 90, 230, 210],
        [220, 182, 191, 234, 290, 330, 310],
        [150, 232, 201, 154, 190, 330, 410],
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
