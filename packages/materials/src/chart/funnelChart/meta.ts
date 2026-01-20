import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  componentName: 'FunnelChart',
  title: '漏斗图',
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
    showLabel: {
      title: '显示标签',
      setter: 'BooleanSetter',
      defaultValue: true,
    },
    sort: {
      title: '排序',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '降序', value: 'descending' },
          { label: '升序', value: 'ascending' },
          { label: '无', value: 'none' },
        ],
      },
      defaultValue: 'descending',
    },
    gap: {
      title: '间距',
      setter: 'NumberSetter',
      defaultValue: 0,
    },
    data: {
      title: '数据',
      setter: 'JsonSetter',
      defaultValue: [
        { name: '阶段1', value: 100 },
        { name: '阶段2', value: 80 },
        { name: '阶段3', value: 60 },
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
