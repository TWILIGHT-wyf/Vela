import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  componentName: 'Switch',
  title: '开关',
  category: '基础控件',
  props: {
    defaultValue: {
      title: '默认值',
      setter: 'BooleanSetter',
      defaultValue: false,
    },
    activeText: {
      title: '开启时文字',
      setter: 'StringSetter',
      defaultValue: '',
    },
    inactiveText: {
      title: '关闭时文字',
      setter: 'StringSetter',
      defaultValue: '',
    },
    width: {
      title: '宽度(px)',
      setter: 'NumberSetter',
      defaultValue: 40,
    },
    inlinePrompt: {
      title: '文字内嵌',
      setter: 'BooleanSetter',
      defaultValue: false,
    },
    disabled: {
      title: '禁用',
      setter: 'BooleanSetter',
      defaultValue: false,
    },
    loading: {
      title: '加载中',
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
    activeColor: {
      title: '开启颜色',
      setter: 'ColorSetter',
      defaultValue: '#409eff',
    },
    inactiveColor: {
      title: '关闭颜色',
      setter: 'ColorSetter',
      defaultValue: '#dcdfe6',
    },
  },
  events: ['onChange'],
}

export default meta
