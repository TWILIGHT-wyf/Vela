import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  componentName: 'CheckboxGroup',
  title: '复选框组',
  category: '基础控件',
  props: {
    options: {
      title: '选项数据',
      setter: 'JsonSetter',
      defaultValue: [],
    },
    defaultValue: {
      title: '默认选中值',
      setter: 'JsonSetter',
      defaultValue: [],
    },
    min: {
      title: '最少选中数',
      setter: 'NumberSetter',
      defaultValue: 0,
    },
    max: {
      title: '最多选中数',
      setter: 'NumberSetter',
      defaultValue: 0,
    },
    disabled: {
      title: '禁用',
      setter: 'BooleanSetter',
      defaultValue: false,
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
    direction: {
      title: '布局方向',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '水平', value: 'horizontal' },
          { label: '垂直', value: 'vertical' },
        ],
      },
      defaultValue: 'horizontal',
    },
    checkedColor: {
      title: '选中颜色',
      setter: 'ColorSetter',
      defaultValue: '#409eff',
    },
  },
  events: ['onChange'],
}

export default meta
