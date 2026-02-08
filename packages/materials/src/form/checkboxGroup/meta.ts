import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'CheckboxGroup',
  title: '复选框组',
  version: '1.0.0',
  category: '基础控件',
  props: {
    options: {
      name: 'options',
      label: '选项数据',
      setter: 'JsonSetter',
      defaultValue: [],
      group: '数据',
    },
    defaultValue: {
      name: 'defaultValue',
      label: '默认选中值',
      setter: 'JsonSetter',
      defaultValue: [],
      group: '基础',
    },
    min: {
      name: 'min',
      label: '最少选中数',
      setter: 'NumberSetter',
      defaultValue: 0,
      group: '交互',
    },
    max: {
      name: 'max',
      label: '最多选中数',
      setter: 'NumberSetter',
      defaultValue: 0,
      group: '交互',
    },
    disabled: {
      name: 'disabled',
      label: '禁用',
      setter: 'BooleanSetter',
      defaultValue: false,
      group: '交互',
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
    direction: {
      name: 'direction',
      label: '布局方向',
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
    checkedColor: {
      name: 'checkedColor',
      label: '选中颜色',
      setter: 'ColorSetter',
      defaultValue: '#409eff',
      group: '样式',
    },
  },
  events: ['onChange'],
  defaultSize: {
    width: 300,
    height: 40,
  },
}

export default meta
