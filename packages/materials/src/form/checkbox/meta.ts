import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'Checkbox',
  title: '复选框',
  version: '1.0.0',
  category: '表单',
  props: {
    modelValue: {
      name: 'modelValue',
      label: '默认选中',
      title: '默认选中',
      setter: 'BooleanSetter',
      defaultValue: false,
      group: '基础',
    },
    label: {
      name: 'label',
      label: '文案',
      title: '文案',
      setter: 'StringSetter',
      defaultValue: '复选框',
      group: '基础',
    },
    disabled: {
      name: 'disabled',
      label: '禁用',
      title: '禁用',
      setter: 'BooleanSetter',
      defaultValue: false,
      group: '交互',
    },
    indeterminate: {
      name: 'indeterminate',
      label: '半选状态',
      title: '半选状态',
      setter: 'BooleanSetter',
      defaultValue: false,
      group: '交互',
    },
    size: {
      name: 'size',
      label: '尺寸',
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
      group: '样式',
    },
    trueValue: {
      name: 'trueValue',
      label: '选中值',
      title: '选中值',
      setter: 'JsonSetter',
      defaultValue: true,
      group: '交互',
    },
    falseValue: {
      name: 'falseValue',
      label: '未选中值',
      title: '未选中值',
      setter: 'JsonSetter',
      defaultValue: false,
      group: '交互',
    },
    padding: {
      name: 'padding',
      label: '内边距',
      title: '内边距',
      setter: 'NumberSetter',
      defaultValue: 8,
      group: '尺寸',
    },
    backgroundColor: {
      name: 'backgroundColor',
      label: '背景颜色',
      title: '背景颜色',
      setter: 'ColorSetter',
      defaultValue: 'transparent',
      group: '样式',
    },
  },
  events: ['onChange'],
  defaultSize: {
    width: 140,
    height: 40,
  },
}

export default meta
