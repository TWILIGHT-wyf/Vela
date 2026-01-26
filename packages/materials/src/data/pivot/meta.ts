import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'Pivot',
  componentName: 'Pivot',
  title: '数据透视表',
  version: '1.0.0',
  category: '数据展示',
  props: {
    data: {
      name: 'data',
      label: '数据源',
      setter: 'JsonSetter',
      defaultValue: [],
      group: '数据',
    },
    rows: {
      name: 'rows',
      label: '行字段',
      setter: 'JsonSetter',
      defaultValue: [],
      group: '数据',
    },
    columns: {
      name: 'columns',
      label: '列字段',
      setter: 'JsonSetter',
      defaultValue: [],
      group: '数据',
    },
    values: {
      name: 'values',
      label: '值字段',
      setter: 'JsonSetter',
      defaultValue: [],
      group: '数据',
    },
    aggregator: {
      name: 'aggregator',
      label: '聚合函数',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '求和', value: 'sum' },
          { label: '计数', value: 'count' },
          { label: '平均值', value: 'average' },
          { label: '最大值', value: 'max' },
          { label: '最小值', value: 'min' },
        ],
      },
      defaultValue: 'sum',
      group: '计算',
    },
  },
  events: [],
  defaultSize: {
    width: 600,
    height: 400,
  },
}

export default meta
