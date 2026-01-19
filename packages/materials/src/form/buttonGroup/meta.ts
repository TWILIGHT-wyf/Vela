import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  componentName: 'ButtonGroup',
  title: '按钮组',
  category: '基础控件',
  props: {
    buttons: {
      title: '按钮配置',
      setter: 'JsonSetter',
      defaultValue: [],
    },
    size: {
      title: '尺寸',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '大', value: 'large' },
          { label: '默认', value: 'default' },
          { label: '小', value: 'small' },
        ],
      },
      defaultValue: 'default',
    },
    type: {
      title: '按钮类型',
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
    },
  },
  events: ['onClick'],
}

export default meta
