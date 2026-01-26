import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'Page',
  componentName: 'Page',
  title: '页面容器',
  version: '1.0.0',
  category: '布局容器',
  isContainer: true,
  props: {
    backgroundColor: {
      name: 'backgroundColor',
      label: '背景颜色',
      setter: 'ColorSetter',
      defaultValue: 'transparent',
      group: '样式',
    },
    padding: {
      name: 'padding',
      label: '内边距',
      setter: 'NumberSetter',
      defaultValue: 0,
      group: '布局',
    },
    minHeight: {
      name: 'minHeight',
      label: '最小高度',
      setter: 'StringSetter',
      defaultValue: '100%',
      group: '尺寸',
    },
    width: {
      name: 'width',
      label: '宽度',
      setter: 'StringSetter',
      defaultValue: '100%',
      group: '尺寸',
    },
    height: {
      name: 'height',
      label: '高度',
      setter: 'StringSetter',
      defaultValue: '100%',
      group: '尺寸',
    },
  },
  events: [],
  defaultSize: {
    width: 1920,
    height: 1080,
  },
}

export default meta
