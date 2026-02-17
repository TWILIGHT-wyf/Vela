import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'SearchBox',
  title: '搜索框',
  version: '1.0.0',
  category: '表单',
  props: {
    placeholder: {
      name: 'placeholder',
      label: '占位文本',
      setter: 'StringSetter',
      defaultValue: '请输入搜索内容',
      group: '基础',
    },
    defaultValue: {
      name: 'defaultValue',
      label: '默认值',
      setter: 'StringSetter',
      defaultValue: '',
      group: '基础',
    },
    clearable: {
      name: 'clearable',
      label: '可清空',
      setter: 'BooleanSetter',
      defaultValue: true,
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
    prefixIcon: {
      name: 'prefixIcon',
      label: '前缀图标',
      setter: 'StringSetter',
      defaultValue: '',
      group: '基础',
    },
    suffixIcon: {
      name: 'suffixIcon',
      label: '后缀图标',
      setter: 'StringSetter',
      defaultValue: '',
      group: '基础',
    },
    inputWidth: {
      name: 'inputWidth',
      label: '输入框宽度',
      setter: 'StringSetter',
      defaultValue: '100%',
      group: '尺寸',
    },
    showSearchButton: {
      name: 'showSearchButton',
      label: '显示搜索按钮',
      setter: 'BooleanSetter',
      defaultValue: true,
      group: '基础',
    },
    buttonText: {
      name: 'buttonText',
      label: '按钮文本',
      setter: 'StringSetter',
      defaultValue: '搜索',
      group: '基础',
    },
    buttonType: {
      name: 'buttonType',
      label: '按钮类型',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '主要', value: 'primary' },
          { label: '成功', value: 'success' },
          { label: '警告', value: 'warning' },
          { label: '危险', value: 'danger' },
          { label: '信息', value: 'info' },
          { label: '默认', value: 'default' },
        ],
      },
      defaultValue: 'primary',
      group: '样式',
    },
    padding: {
      name: 'padding',
      label: '内边距',
      setter: 'NumberSetter',
      defaultValue: 16,
      group: '样式',
    },
    backgroundColor: {
      name: 'backgroundColor',
      label: '背景颜色',
      setter: 'ColorSetter',
      defaultValue: 'transparent',
      group: '样式',
    },
    borderColor: {
      name: 'borderColor',
      label: '边框颜色',
      setter: 'ColorSetter',
      defaultValue: '#dcdfe6',
      group: '样式',
    },
  },
  events: ['onSearch', 'onChange', 'onClear'],
  defaultSize: {
    width: 250,
    height: 40,
  },
}

export default meta
