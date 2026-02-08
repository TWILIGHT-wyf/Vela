import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'List',
  title: '列表',
  version: '1.0.0',
  category: '数据展示',
  props: {
    data: {
      name: 'data',
      label: '列表数据',
      setter: 'JsonSetter',
      defaultValue: [],
      group: '数据',
    },
    itemLayout: {
      name: 'itemLayout',
      label: '布局方式',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '水平', value: 'horizontal' },
          { label: '垂直', value: 'vertical' },
        ],
      },
      defaultValue: 'horizontal',
      group: '布局',
    },
    bordered: {
      name: 'bordered',
      label: '边框',
      setter: 'BooleanSetter',
      defaultValue: false,
      group: '样式',
    },
    split: {
      name: 'split',
      label: '分割线',
      setter: 'BooleanSetter',
      defaultValue: true,
      group: '样式',
    },
  },
  events: ['onItemClick'],
  defaultSize: {
    width: 400,
    height: 300,
  },
}

export default meta
