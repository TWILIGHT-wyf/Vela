import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'Box',
  componentName: 'Box',
  title: '占位盒',
  version: '1.0.0',
  category: 'KPI',
  props: {
    content: {
      name: 'content',
      label: '占位文本',
      setter: 'StringSetter',
      defaultValue: '占位内容',
      group: '基础',
    },
    backgroundColor: {
      name: 'backgroundColor',
      label: '背景颜色',
      setter: 'ColorSetter',
      defaultValue: '#f5f7fa',
      group: '样式',
    },
    borderRadius: {
      name: 'borderRadius',
      label: '圆角',
      setter: 'NumberSetter',
      defaultValue: 4,
      group: '样式',
    },
    borderWidth: {
      name: 'borderWidth',
      label: '边框宽度',
      setter: 'NumberSetter',
      defaultValue: 1,
      group: '样式',
    },
    borderColor: {
      name: 'borderColor',
      label: '边框颜色',
      setter: 'ColorSetter',
      defaultValue: '#dcdfe6',
      group: '样式',
    },
    borderStyle: {
      name: 'borderStyle',
      label: '边框样式',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '实线', value: 'solid' },
          { label: '虚线', value: 'dashed' },
          { label: '点线', value: 'dotted' },
          { label: '双线', value: 'double' },
        ],
      },
      defaultValue: 'dashed',
      group: '样式',
    },
    textColor: {
      name: 'textColor',
      label: '文字颜色',
      setter: 'ColorSetter',
      defaultValue: '#909399',
      group: '样式',
    },
    fontSize: {
      name: 'fontSize',
      label: '字体大小',
      setter: 'NumberSetter',
      defaultValue: 14,
      group: '样式',
    },
    textAlign: {
      name: 'textAlign',
      label: '文字对齐',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '左对齐', value: 'left' },
          { label: '居中', value: 'center' },
          { label: '右对齐', value: 'right' },
        ],
      },
      defaultValue: 'center',
      group: '布局',
    },
  },
  events: [],
  defaultSize: {
    width: 200,
    height: 100,
  },
}

export default meta
