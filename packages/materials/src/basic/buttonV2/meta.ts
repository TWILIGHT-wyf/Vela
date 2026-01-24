import type { MaterialMeta } from '@vela/core/types'

/**
 * ButtonV2 物料元数据
 *
 * V2 特性：
 * 1. 使用 ObjectSetter 进行样式分组
 * 2. properties 字段定义子属性结构
 * 3. 编辑器可以根据 properties 渲染分组表单
 */
const meta: MaterialMeta = {
  name: 'ButtonV2',
  componentName: 'ButtonV2',
  title: '按钮 V2',
  version: '2.0.0',
  category: '基础控件',

  props: {
    // 基础属性（原子属性，保持扁平）
    text: {
      name: 'text',
      label: '按钮文本',
      setter: 'StringSetter',
      defaultValue: '按钮',
      description: '按钮上显示的文字',
      group: '基础',
    },
    type: {
      name: 'type',
      label: '按钮类型',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '主要按钮', value: 'primary' },
          { label: '成功按钮', value: 'success' },
          { label: '警告按钮', value: 'warning' },
          { label: '危险按钮', value: 'danger' },
          { label: '信息按钮', value: 'info' },
          { label: '默认按钮', value: 'default' },
        ],
      },
      defaultValue: 'primary',
      description: '按钮的主题类型',
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
    plain: {
      name: 'plain',
      label: '朴素按钮',
      setter: 'BooleanSetter',
      defaultValue: false,
      group: '基础',
    },
    round: {
      name: 'round',
      label: '圆角按钮',
      setter: 'BooleanSetter',
      defaultValue: false,
      group: '基础',
    },
    disabled: {
      name: 'disabled',
      label: '禁用状态',
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

    // V2: 样式分组（使用 ObjectSetter）
    style: {
      name: 'style',
      label: '样式配置',
      setter: 'ObjectSetter',
      description: '按钮的样式配置（V2 语义分组）',
      group: '样式',
      collapsed: false, // 默认展开
      defaultValue: {},

      // 子属性定义
      properties: {
        backgroundColor: {
          name: 'backgroundColor',
          label: '背景颜色',
          setter: 'ColorSetter',
          defaultValue: '',
          description: '自定义背景颜色（覆盖主题色）',
        },
        textColor: {
          name: 'textColor',
          label: '文字颜色',
          setter: 'ColorSetter',
          defaultValue: '',
          description: '自定义文字颜色',
        },
        fontSize: {
          name: 'fontSize',
          label: '字体大小',
          setter: 'NumberSetter',
          defaultValue: 14,
          setterProps: {
            min: 12,
            max: 48,
            step: 1,
          },
          description: '字体大小（像素）',
        },
        fontWeight: {
          name: 'fontWeight',
          label: '字体粗细',
          setter: 'SelectSetter',
          setterProps: {
            options: [
              { label: '正常', value: 400 },
              { label: '中等', value: 500 },
              { label: '粗体', value: 600 },
              { label: '超粗', value: 700 },
            ],
          },
          defaultValue: 400,
        },
        borderRadius: {
          name: 'borderRadius',
          label: '圆角',
          setter: 'NumberSetter',
          defaultValue: 4,
          setterProps: {
            min: 0,
            max: 50,
            step: 1,
          },
          description: '边框圆角（像素）',
        },
      },
    },
  },

  events: ['onClick'],

  defaultSize: {
    width: 120,
    height: 40,
  },
}

export default meta
