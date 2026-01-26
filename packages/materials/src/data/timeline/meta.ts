import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'Timeline',
  componentName: 'Timeline',
  title: '时间线',
  version: '1.0.0',
  category: '数据展示',
  props: {
    data: {
      name: 'data',
      label: '时间线数据',
      setter: 'JsonSetter',
      defaultValue: [],
      group: '数据',
    },
    mode: {
      name: 'mode',
      label: '排列模式',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '左侧', value: 'left' },
          { label: '右侧', value: 'right' },
          { label: '交替', value: 'alternate' },
        ],
      },
      defaultValue: 'left',
      group: '布局',
    },
    reverse: {
      name: 'reverse',
      label: '倒序',
      setter: 'BooleanSetter',
      defaultValue: false,
      group: '布局',
    },
  },
  events: ['onItemClick'],
  defaultSize: {
    width: 400,
    height: 300,
  },
}

export default meta
