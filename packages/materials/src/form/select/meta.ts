import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  componentName: 'Select',
  title: '下拉选择',
  category: '基础控件',
  props: {
    options: {
      title: '选项数据',
      setter: 'JsonSetter',
      defaultValue: [],
    },
    defaultValue: {
      title: '默认值',
      setter: 'StringSetter',
      defaultValue: '',
    },
    placeholder: {
      title: '占位文本',
      setter: 'StringSetter',
      defaultValue: '请选择',
    },
    clearable: {
      title: '可清空',
      setter: 'BooleanSetter',
      defaultValue: true,
    },
    filterable: {
      title: '可搜索',
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
    labelField: {
      title: '标签字段名',
      setter: 'StringSetter',
      defaultValue: 'label',
    },
    valueField: {
      title: '值字段名',
      setter: 'StringSetter',
      defaultValue: 'value',
    },
    emptyText: {
      title: '空数据文本',
      setter: 'StringSetter',
      defaultValue: '暂无选项',
    },
    selectWidth: {
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
