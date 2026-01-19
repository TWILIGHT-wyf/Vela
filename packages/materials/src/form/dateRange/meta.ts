import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  componentName: 'DateRange',
  title: '日期范围选择',
  category: '基础控件',
  props: {
    defaultValue: {
      title: '默认日期范围',
      setter: 'JsonSetter',
      defaultValue: [],
    },
    startPlaceholder: {
      title: '开始日期占位文本',
      setter: 'StringSetter',
      defaultValue: '开始日期',
    },
    endPlaceholder: {
      title: '结束日期占位文本',
      setter: 'StringSetter',
      defaultValue: '结束日期',
    },
    rangeSeparator: {
      title: '分隔符',
      setter: 'StringSetter',
      defaultValue: '至',
    },
    format: {
      title: '显示格式',
      setter: 'StringSetter',
      defaultValue: 'YYYY-MM-DD',
    },
    valueFormat: {
      title: '绑定值格式',
      setter: 'StringSetter',
      defaultValue: 'YYYY-MM-DD',
    },
    clearable: {
      title: '可清空',
      setter: 'BooleanSetter',
      defaultValue: true,
    },
    editable: {
      title: '可手动输入',
      setter: 'BooleanSetter',
      defaultValue: true,
    },
    enableShortcuts: {
      title: '启用快捷选项',
      setter: 'BooleanSetter',
      defaultValue: true,
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
    pickerWidth: {
      title: '选择器宽度',
      setter: 'StringSetter',
      defaultValue: '100%',
    },
    borderColor: {
      title: '边框颜色',
      setter: 'ColorSetter',
      defaultValue: '#dcdfe6',
    },
  },
  events: ['onChange', 'onClear'],
}

export default meta
