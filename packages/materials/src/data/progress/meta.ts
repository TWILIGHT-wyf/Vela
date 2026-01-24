import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  componentName: 'Progress',
  title: '进度条',
  category: '数据',
  props: {
    percentage: {
      title: '进度百分比',
      setter: 'NumberSetter',
      defaultValue: 50,
    },
    type: {
      title: '类型',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '线型', value: 'line' },
          { label: '圆形', value: 'circle' },
          { label: '仪表盘', value: 'dashboard' },
        ],
      },
      defaultValue: 'line',
    },
    status: {
      title: '状态',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '默认', value: '' },
          { label: '成功', value: 'success' },
          { label: '警告', value: 'warning' },
          { label: '异常', value: 'exception' },
        ],
      },
      defaultValue: '',
    },
    strokeWidth: {
      title: '进度条高度/宽度',
      setter: 'NumberSetter',
      defaultValue: 20,
    },
    textInside: {
      title: '内置文字',
      setter: 'BooleanSetter',
      defaultValue: false,
    },
    showText: {
      title: '显示文字',
      setter: 'BooleanSetter',
      defaultValue: true,
    },
    circleWidth: {
      title: '圆形进度条宽度',
      setter: 'NumberSetter',
      defaultValue: 126,
    },
    trackColor: {
      title: '轨道颜色',
      setter: 'ColorSetter',
      defaultValue: '#e4e7ed',
    },
    barColor: {
      title: '进度条颜色',
      setter: 'ColorSetter',
      defaultValue: '#409eff',
    },
    textColor: {
      title: '文字颜色',
      setter: 'ColorSetter',
      defaultValue: '#606266',
    },
  },
  events: [],
}

export default meta
