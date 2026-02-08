import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'Text',
  title: '文本',
  version: '1.0.0',
  category: '基础组件',
  props: {
    content: {
      name: 'content',
      label: '内容',
      setter: 'StringSetter',
      defaultValue: '文本内容',
      group: '基础',
    },
    fontSize: {
      name: 'fontSize',
      label: '字体大小',
      setter: 'NumberSetter',
      defaultValue: 16,
      group: '样式',
    },
    color: {
      name: 'color',
      label: '文字颜色',
      setter: 'ColorSetter',
      defaultValue: '#000000',
      group: '样式',
    },
    fontWeight: {
      name: 'fontWeight',
      label: '字体粗细',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '正常', value: 'normal' },
          { label: '粗体', value: 'bold' },
          { label: '细体', value: 'lighter' },
          { label: '100', value: 100 },
          { label: '200', value: 200 },
          { label: '300', value: 300 },
          { label: '400', value: 400 },
          { label: '500', value: 500 },
          { label: '600', value: 600 },
          { label: '700', value: 700 },
          { label: '800', value: 800 },
          { label: '900', value: 900 },
        ],
      },
      defaultValue: 'normal',
      group: '样式',
    },
    textAlign: {
      name: 'textAlign',
      label: '对齐方式',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '左对齐', value: 'left' },
          { label: '居中', value: 'center' },
          { label: '右对齐', value: 'right' },
          { label: '两端对齐', value: 'justify' },
        ],
      },
      defaultValue: 'left',
      group: '样式',
    },
    lineHeight: {
      name: 'lineHeight',
      label: '行高',
      setter: 'NumberSetter',
      defaultValue: 1.2,
      group: '样式',
    },
    letterSpacing: {
      name: 'letterSpacing',
      label: '字间距',
      setter: 'NumberSetter',
      defaultValue: 0,
      group: '样式',
    },
    paddingX: {
      name: 'paddingX',
      label: '水平内边距',
      setter: 'NumberSetter',
      defaultValue: 0,
      group: '样式',
    },
    paddingY: {
      name: 'paddingY',
      label: '垂直内边距',
      setter: 'NumberSetter',
      defaultValue: 0,
      group: '样式',
    },
    opacity: {
      name: 'opacity',
      label: '透明度',
      setter: 'SliderSetter',
      setterProps: {
        min: 0,
        max: 100,
        step: 1,
      },
      defaultValue: 100,
      group: '样式',
    },
  },
  events: ['onClick'],
  defaultSize: {
    width: 120,
    height: 32,
  },
}

export default meta
