import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  componentName: 'RadarChart',
  title: '雷达图',
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
    radarShape: {
      title: '雷达形状',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '多边形', value: 'polygon' },
          { label: '圆形', value: 'circle' },
        ],
      },
      defaultValue: 'polygon',
    },
    showArea: {
      title: '显示区域填充',
      setter: 'BooleanSetter',
      defaultValue: true,
    },
    indicators: {
      title: '指标',
      setter: 'JsonSetter',
      defaultValue: [
        { name: '销售', max: 100 },
        { name: '管理', max: 100 },
        { name: '技术', max: 100 },
        { name: '客服', max: 100 },
      ],
    },
    seriesData: {
      title: '系列数据',
      setter: 'JsonSetter',
      defaultValue: [
        {
          name: '预算',
          value: [80, 90, 80, 80],
        },
        {
          name: '开销',
          value: [70, 80, 90, 60],
        },
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
