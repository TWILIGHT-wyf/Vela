import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'Text', // 必填字段
  componentName: 'Text', // 兼容字段
  title: '文本',
  version: '1.0.0', // 必填字段
  category: '基础组件',
  props: {
    content: {
      name: 'content',
      label: '内容',
      title: '内容',
      setter: 'StringSetter',
      defaultValue: '文本内容',
    },
  },
  styles: {
    fontSize: {
      name: 'fontSize',
      label: '字体大小',
      title: '字体大小',
      setter: 'StringSetter',
      defaultValue: 16,
      group: '文字',
    },
    color: {
      name: 'color',
      label: '文字颜色',
      title: '文字颜色',
      setter: 'ColorSetter',
      defaultValue: '#000000',
      group: '文字',
    },
    fontWeight: {
      name: 'fontWeight',
      label: '字体粗细',
      title: '字体粗细',
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
      group: '文字',
    },
    textAlign: {
      name: 'textAlign',
      label: '对齐方式',
      title: '对齐方式',
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
      group: '文字',
    },
    lineHeight: {
      name: 'lineHeight',
      label: '行高',
      title: '行高',
      setter: 'NumberSetter',
      defaultValue: 1.2,
      group: '文字',
    },
    letterSpacing: {
      name: 'letterSpacing',
      label: '字间距',
      title: '字间距',
      setter: 'NumberSetter',
      defaultValue: 0,
      group: '文字',
    },
    opacity: {
      name: 'opacity',
      label: '透明度',
      title: '透明度',
      setter: 'SliderSetter',
      setterProps: {
        min: 0,
        max: 100,
        step: 1,
      },
      defaultValue: 100,
      group: '外观',
    },
  },
  events: ['onClick'],
}

export default meta
