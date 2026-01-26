import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'Badge',
  componentName: 'Badge',
  title: '徽章',
  version: '1.0.0',
  category: '数据',
  props: {
    value: {
      name: 'value',
      label: '显示值',
      setter: 'StringSetter',
      defaultValue: '1',
      group: '基础',
    },
    slotText: {
      name: 'slotText',
      label: '内容文本',
      setter: 'StringSetter',
      defaultValue: '徽章内容',
      group: '基础',
    },
    max: {
      name: 'max',
      label: '最大值',
      setter: 'NumberSetter',
      defaultValue: 99,
      group: '数据',
    },
    type: {
      name: 'type',
      label: '类型',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '主要', value: 'primary' },
          { label: '成功', value: 'success' },
          { label: '警告', value: 'warning' },
          { label: '危险', value: 'danger' },
          { label: '信息', value: 'info' },
        ],
      },
      defaultValue: 'primary',
      group: '样式',
    },
    isDot: {
      name: 'isDot',
      label: '显示为小圆点',
      setter: 'BooleanSetter',
      defaultValue: false,
      group: '显示',
    },
    hidden: {
      name: 'hidden',
      label: '隐藏徽章',
      setter: 'BooleanSetter',
      defaultValue: false,
      group: '显示',
    },
    backgroundColor: {
      name: 'backgroundColor',
      label: '背景颜色',
      setter: 'ColorSetter',
      defaultValue: '#409eff',
      group: '样式',
    },
    textColor: {
      name: 'textColor',
      label: '文字颜色',
      setter: 'ColorSetter',
      defaultValue: '#fff',
      group: '样式',
    },
    fontSize: {
      name: 'fontSize',
      label: '字体大小',
      setter: 'NumberSetter',
      defaultValue: 12,
      group: '样式',
    },
  },
  events: [],
  defaultSize: {
    width: 100,
    height: 40,
  },
}

export default meta
