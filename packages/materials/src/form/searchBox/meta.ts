import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  componentName: 'SearchBox',
  title: '搜索框',
  category: '基础控件',
  props: {
    placeholder: {
      title: '占位文本',
      setter: 'StringSetter',
      defaultValue: '请输入搜索内容',
    },
    defaultValue: {
      title: '默认值',
      setter: 'StringSetter',
      defaultValue: '',
    },
    clearable: {
      title: '可清空',
      setter: 'BooleanSetter',
      defaultValue: true,
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
    prefixIcon: {
      title: '前缀图标',
      setter: 'StringSetter',
      defaultValue: '',
    },
    suffixIcon: {
      title: '后缀图标',
      setter: 'StringSetter',
      defaultValue: '',
    },
    inputWidth: {
      title: '输入框宽度',
      setter: 'StringSetter',
      defaultValue: '100%',
    },
    borderColor: {
      title: '边框颜色',
      setter: 'ColorSetter',
      defaultValue: '#dcdfe6',
    },
  },
  events: ['onSearch', 'onChange', 'onClear'],
}

export default meta
