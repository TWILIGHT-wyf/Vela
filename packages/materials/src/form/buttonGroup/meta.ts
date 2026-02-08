import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'ButtonGroup',
  title: '按钮组',
  version: '1.0.0',
  category: '基础控件',
  props: {
    buttons: {
      name: 'buttons',
      label: '按钮配置',
      setter: 'JsonSetter',
      defaultValue: [],
      group: '数据',
    },
    size: {
      name: 'size',
      label: '尺寸',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '大', value: 'large' },
          { label: '默认', value: 'default' },
          { label: '小', value: 'small' },
        ],
      },
      defaultValue: 'default',
      group: '样式',
    },
    type: {
      name: 'type',
      label: '按钮类型',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '主要', value: 'primary' },
          { label: '成功', value: 'success' },
          { label: '警告', value: 'warning' },
          { label: '危险', value: 'danger' },
          { label: '信息', value: 'info' },
          { label: '默认', value: '' },
        ],
      },
      defaultValue: 'primary',
      group: '样式',
    },
  },
  events: ['onClick'],
  defaultSize: {
    width: 200,
    height: 40,
  },
}

export default meta
