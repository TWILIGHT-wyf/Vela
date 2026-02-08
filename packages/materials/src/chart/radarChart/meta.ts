import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'RadarChart',
  title: '雷达图',
  version: '1.0.0',
  category: '图表',
  props: {
    title: {
      name: 'title',
      label: '图表标题',
      setter: 'StringSetter',
      defaultValue: '',
      group: '基础',
    },
    seriesName: {
      name: 'seriesName',
      label: '系列名称',
      setter: 'StringSetter',
      defaultValue: 'Radar',
      group: '基础',
    },
    radarShape: {
      name: 'radarShape',
      label: '雷达形状',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '多边形', value: 'polygon' },
          { label: '圆形', value: 'circle' },
        ],
      },
      defaultValue: 'polygon',
      group: '样式',
    },
    splitNumber: {
      name: 'splitNumber',
      label: '分割段数',
      setter: 'NumberSetter',
      defaultValue: 5,
      group: '样式',
    },
    axisNameColor: {
      name: 'axisNameColor',
      label: '轴名称颜色',
      setter: 'ColorSetter',
      defaultValue: '#333',
      group: '样式',
    },
    showArea: {
      name: 'showArea',
      label: '显示区域填充',
      setter: 'BooleanSetter',
      defaultValue: true,
      group: '样式',
    },
    areaOpacity: {
      name: 'areaOpacity',
      label: '填充透明度',
      setter: 'SliderSetter',
      setterProps: {
        min: 0,
        max: 1,
        step: 0.1,
      },
      defaultValue: 0.3,
      group: '样式',
    },
    indicators: {
      name: 'indicators',
      label: '指标',
      setter: 'JsonSetter',
      defaultValue: [
        { name: '销售', max: 100 },
        { name: '管理', max: 100 },
        { name: '技术', max: 100 },
        { name: '客服', max: 100 },
      ],
      group: '数据',
    },
    seriesData: {
      name: 'seriesData',
      label: '系列数据',
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
      group: '数据',
    },
    option: {
      name: 'option',
      label: '高级配置(JSON)',
      setter: 'JsonSetter',
      defaultValue: {},
      group: '高级',
    },
  },
  events: [],
  defaultSize: {
    width: 400,
    height: 300,
  },
}

export default meta
