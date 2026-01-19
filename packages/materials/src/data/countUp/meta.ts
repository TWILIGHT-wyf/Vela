import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  componentName: 'CountUp',
  title: '数字动画',
  category: 'KPI',
  props: {
    endValue: {
      title: '结束值',
      setter: 'NumberSetter',
      defaultValue: 100,
    },
    startValue: {
      title: '起始值',
      setter: 'NumberSetter',
      defaultValue: 0,
    },
    duration: {
      title: '动画时长(秒)',
      setter: 'NumberSetter',
      defaultValue: 2,
    },
    decimals: {
      title: '小数位数',
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
    separator: {
      title: '千位分隔符',
      setter: 'StringSetter',
      defaultValue: ',',
    },
    useEasing: {
      title: '使用缓动',
      setter: 'BooleanSetter',
      defaultValue: true,
    },
    valueColor: {
      title: '数值颜色',
      setter: 'ColorSetter',
      defaultValue: '#303133',
    },
    valueFontSize: {
      title: '数值字体大小',
      setter: 'NumberSetter',
      defaultValue: 32,
    },
    backgroundColor: {
      title: '背景颜色',
      setter: 'ColorSetter',
      defaultValue: 'transparent',
    },
  },
  events: ['onComplete'],
}

export default meta
