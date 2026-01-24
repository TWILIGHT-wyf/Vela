import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'BaseButton',
  componentName: 'BaseButton', // 注册名称
  title: '基础按钮',
  version: '1.0.0', // 新架构首版
  category: '基础',

  props: {
    // 1. 基础属性 (Flat)
    text: {
      name: 'text',
      label: '按钮文本',
      setter: 'StringSetter',
      defaultValue: '按钮',
      group: '基础',
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
          { label: '默认', value: 'default' },
        ],
      },
      defaultValue: 'primary',
      group: '基础',
    },
    size: {
      name: 'size',
      label: '尺寸',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '大', value: 'large' },
          { label: '中', value: 'default' },
          { label: '小', value: 'small' },
        ],
      },
      defaultValue: 'default',
      group: '基础',
    },
    icon: {
      name: 'icon',
      label: '图标',
      setter: 'StringSetter', // 后续可以是 IconSetter
      group: '基础',
    },

    // 2. 状态属性
    disabled: {
      name: 'disabled',
      label: '禁用',
      setter: 'BooleanSetter',
      defaultValue: false,
      group: '状态',
    },
    loading: {
      name: 'loading',
      label: '加载中',
      setter: 'BooleanSetter',
      defaultValue: false,
      group: '状态',
    },
    plain: {
      name: 'plain',
      label: '朴素模式',
      setter: 'BooleanSetter',
      defaultValue: false,
      group: '样式',
    },
    round: {
      name: 'round',
      label: '圆角模式',
      setter: 'BooleanSetter',
      defaultValue: false,
      group: '样式',
    },
    circle: {
      name: 'circle',
      label: '圆形按钮',
      setter: 'BooleanSetter',
      defaultValue: false,
      group: '样式',
    },

    // 3. 样式配置 (Object Group)
    styleConfig: {
      name: 'styleConfig',
      label: '自定义样式',
      setter: 'ObjectSetter',
      group: '样式',
      properties: {
        backgroundColor: { name: 'backgroundColor', label: '背景色', setter: 'ColorSetter' },
        textColor: { name: 'textColor', label: '文字颜色', setter: 'ColorSetter' },
        borderColor: { name: 'borderColor', label: '边框颜色', setter: 'ColorSetter' },
        fontSize: {
          name: 'fontSize',
          label: '字号',
          setter: 'NumberSetter',
          setterProps: { min: 12, max: 48, step: 1 },
        },
        borderRadius: {
          name: 'borderRadius',
          label: '圆角(px)',
          setter: 'NumberSetter',
        },
      },
    },
  },

  events: ['onClick'],

  defaultSize: {
    width: 100,
    height: 32,
  },
}

export default meta
