import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'TimePicker',
  title: '时间选择',
  version: '1.0.0',
  category: '表单',
  props: {
    value: {
      name: 'value',
      label: '当前值',
      title: '当前值',
      setter: 'StringSetter',
      defaultValue: '',
      group: '基础',
    },
    placeholder: {
      name: 'placeholder',
      label: '占位文本',
      title: '占位文本',
      setter: 'StringSetter',
      defaultValue: '请选择时间',
      group: '基础',
    },
    format: {
      name: 'format',
      label: '显示格式',
      title: '显示格式',
      setter: 'StringSetter',
      defaultValue: 'HH:mm:ss',
      group: '格式',
    },
    valueFormat: {
      name: 'valueFormat',
      label: '值格式',
      title: '值格式',
      setter: 'StringSetter',
      defaultValue: 'HH:mm:ss',
      group: '格式',
    },
    clearable: {
      name: 'clearable',
      label: '可清空',
      title: '可清空',
      setter: 'BooleanSetter',
      defaultValue: true,
      group: '交互',
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
    pickerWidth: {
      name: 'pickerWidth',
      label: '选择器宽度',
      title: '选择器宽度',
      setter: 'NumberSetter',
      defaultValue: 100,
      description: '宽度百分比 (0-100)',
      group: '尺寸',
    },
    padding: {
      name: 'padding',
      label: '内边距',
      title: '内边距',
      setter: 'NumberSetter',
      defaultValue: 8,
      group: '尺寸',
    },
  },
  events: ['onChange'],
  defaultSize: {
    width: 220,
    height: 40,
  },
}

export default meta
