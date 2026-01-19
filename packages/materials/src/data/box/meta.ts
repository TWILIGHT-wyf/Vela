import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  componentName: 'Box',
  title: '占位盒',
  category: 'KPI',
  props: {
    text: {
      title: '占位文本',
      setter: 'StringSetter',
      defaultValue: '占位内容',
    },
    backgroundColor: {
      title: '背景颜色',
      setter: 'ColorSetter',
      defaultValue: '#f5f7fa',
    },
    borderRadius: {
      title: '圆角',
      setter: 'NumberSetter',
      defaultValue: 4,
    },
    borderWidth: {
      title: '边框宽度',
      setter: 'NumberSetter',
      defaultValue: 1,
    },
    borderColor: {
      title: '边框颜色',
      setter: 'ColorSetter',
      defaultValue: '#dcdfe6',
    },
    borderStyle: {
      title: '边框样式',
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
    },
    textColor: {
      title: '文字颜色',
      setter: 'ColorSetter',
      defaultValue: '#909399',
    },
    fontSize: {
      title: '字体大小',
      setter: 'NumberSetter',
      defaultValue: 14,
    },
    textAlign: {
      title: '文字对齐',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '左对齐', value: 'left' },
          { label: '居中', value: 'center' },
          { label: '右对齐', value: 'right' },
        ],
      },
      defaultValue: 'center',
    },
  },
  events: [],
}

export default meta
