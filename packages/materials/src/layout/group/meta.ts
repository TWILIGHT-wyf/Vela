import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  componentName: 'Group',
  title: '组合容器',
  category: '布局容器',
  props: {
    opacity: {
      title: '透明度',
      setter: 'NumberSetter',
      setterProps: {
        min: 0,
        max: 1,
        step: 0.1,
      },
      defaultValue: 1,
    },
    rotation: {
      title: '旋转角度',
      setter: 'NumberSetter',
      defaultValue: 0,
    },
    borderRadius: {
      title: '圆角',
      setter: 'NumberSetter',
      defaultValue: 0,
    },
    backgroundColor: {
      title: '背景颜色',
      setter: 'ColorSetter',
      defaultValue: 'transparent',
    },
    border: {
      title: '边框',
      setter: 'StringSetter',
      defaultValue: 'none',
    },
    showPlaceholder: {
      title: '显示占位符',
      setter: 'BooleanSetter',
      defaultValue: true,
    },
    placeholder: {
      title: '占位符文本',
      setter: 'StringSetter',
      defaultValue: '组合',
    },
  },
  events: ['onToggle'],
}

export default meta
