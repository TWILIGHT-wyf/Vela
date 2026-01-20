import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  componentName: 'PieChart',
  title: '饼图',
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
    showLabel: {
      title: '显示标签',
      setter: 'BooleanSetter',
      defaultValue: true,
    },
    radius: {
      title: '饼图半径',
      setter: 'StringSetter',
      defaultValue: '50%',
    },
    roseType: {
      title: '南丁格尔图',
      setter: 'BooleanSetter',
      defaultValue: false,
    },
    data: {
      title: '数据',
      setter: 'JsonSetter',
      defaultValue: [
        { name: '类型A', value: 335 },
        { name: '类型B', value: 234 },
        { name: '类型C', value: 154 },
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
