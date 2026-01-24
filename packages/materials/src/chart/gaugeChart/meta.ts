import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  componentName: 'GaugeChart',
  title: '仪表盘',
  category: '图表',
  props: {
    title: {
      title: '图表标题',
      setter: 'StringSetter',
      defaultValue: '',
    },
    value: {
      title: '数值',
      setter: 'NumberSetter',
      defaultValue: 75,
    },
    name: {
      title: '名称',
      setter: 'StringSetter',
      defaultValue: '完成率',
    },
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
    startAngle: {
      title: '起始角度',
      setter: 'NumberSetter',
      defaultValue: 225,
    },
    endAngle: {
      title: '结束角度',
      setter: 'NumberSetter',
      defaultValue: -45,
    },
    axisLineColor: {
      title: '轴线颜色配置',
      setter: 'JsonSetter',
      defaultValue: [
        [0.3, '#67e0e3'],
        [0.7, '#37a2da'],
        [1, '#fd666d'],
      ],
    },
    progressWidth: {
      title: '进度条宽度',
      setter: 'NumberSetter',
      defaultValue: 10,
    },
    pointerColor: {
      title: '指针颜色',
      setter: 'ColorSetter',
      defaultValue: 'auto',
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
