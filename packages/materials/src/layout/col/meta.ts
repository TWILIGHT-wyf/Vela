import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'Col',
  componentName: 'Col',
  title: '列容器',
  version: '1.0.0',
  category: '布局容器',
  isContainer: true,
  props: {
    span: {
      name: 'span',
      label: '栅格占位',
      setter: 'NumberSetter',
      defaultValue: 12,
      group: '布局',
    },
    offset: {
      name: 'offset',
      label: '左偏移',
      setter: 'NumberSetter',
      defaultValue: 0,
      group: '布局',
    },
    push: {
      name: 'push',
      label: '向右推',
      setter: 'NumberSetter',
      defaultValue: 0,
      group: '布局',
    },
    pull: {
      name: 'pull',
      label: '向左拉',
      setter: 'NumberSetter',
      defaultValue: 0,
      group: '布局',
    },
    xs: {
      name: 'xs',
      label: '<768px',
      setter: 'NumberSetter',
      defaultValue: 24,
      group: '响应式',
    },
    sm: {
      name: 'sm',
      label: '>=768px',
      setter: 'NumberSetter',
      defaultValue: 12,
      group: '响应式',
    },
    md: {
      name: 'md',
      label: '>=992px',
      setter: 'NumberSetter',
      defaultValue: 12,
      group: '响应式',
    },
    lg: {
      name: 'lg',
      label: '>=1200px',
      setter: 'NumberSetter',
      defaultValue: 12,
      group: '响应式',
    },
    xl: {
      name: 'xl',
      label: '>=1920px',
      setter: 'NumberSetter',
      defaultValue: 12,
      group: '响应式',
    },
    backgroundColor: {
      name: 'backgroundColor',
      label: '背景颜色',
      setter: 'ColorSetter',
      defaultValue: '#ffffff',
      group: '样式',
    },
    minHeight: {
      name: 'minHeight',
      label: '最小高度(px)',
      setter: 'NumberSetter',
      defaultValue: 100,
      group: '尺寸',
    },
  },
  events: [],
  defaultSize: {
    width: 300,
    height: 100,
  },
}

export default meta
