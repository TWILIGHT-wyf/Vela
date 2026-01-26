import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'CountUp',
  componentName: 'CountUp',
  title: '数字动画',
  version: '1.0.0',
  category: 'KPI',
  props: {
    value: {
      name: 'value',
      label: '结束值',
      setter: 'NumberSetter',
      defaultValue: 100,
      group: '数据',
    },
    startValue: {
      name: 'startValue',
      label: '起始值',
      setter: 'NumberSetter',
      defaultValue: 0,
      group: '数据',
    },
    duration: {
      name: 'duration',
      label: '动画时长(秒)',
      setter: 'NumberSetter',
      defaultValue: 2,
      group: '动画',
    },
    decimals: {
      name: 'decimals',
      label: '小数位数',
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
    separator: {
      name: 'separator',
      label: '千位分隔符',
      setter: 'StringSetter',
      defaultValue: ',',
      group: '基础',
    },
    useEasing: {
      name: 'useEasing',
      label: '使用缓动',
      setter: 'BooleanSetter',
      defaultValue: true,
      group: '动画',
    },
    valueColor: {
      name: 'valueColor',
      label: '数值颜色',
      setter: 'ColorSetter',
      defaultValue: '#303133',
      group: '样式',
    },
    valueFontSize: {
      name: 'valueFontSize',
      label: '数值字体大小',
      setter: 'NumberSetter',
      defaultValue: 32,
      group: '样式',
    },
    backgroundColor: {
      name: 'backgroundColor',
      label: '背景颜色',
      setter: 'ColorSetter',
      defaultValue: 'transparent',
      group: '样式',
    },
  },
  events: ['onComplete'],
  defaultSize: {
    width: 150,
    height: 60,
  },
}

export default meta
