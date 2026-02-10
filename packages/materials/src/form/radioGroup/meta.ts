import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'RadioGroup',
  title: '单选组',
  version: '1.0.0',
  category: '表单',
  props: {
    options: {
      name: 'options',
      label: '选项数据',
      title: '选项数据',
      setter: 'JsonSetter',
      defaultValue: [],
      group: '数据',
    },
    modelValue: {
      name: 'modelValue',
      label: '默认值',
      title: '默认值',
      setter: 'StringSetter',
      defaultValue: '',
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
    direction: {
      name: 'direction',
      label: '布局方向',
      title: '布局方向',
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
    optionType: {
      name: 'optionType',
      label: '选项样式',
      title: '选项样式',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '默认', value: 'default' },
          { label: '按钮', value: 'button' },
        ],
      },
      defaultValue: 'default',
      group: '样式',
    },
    gap: {
      name: 'gap',
      label: '选项间距',
      title: '选项间距',
      setter: 'NumberSetter',
      defaultValue: 12,
      group: '布局',
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
    width: 280,
    height: 40,
  },
}

export default meta
