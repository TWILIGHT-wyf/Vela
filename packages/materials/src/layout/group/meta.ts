import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'Group',
  title: '组合容器',
  version: '1.0.0',
  category: '基础',
  isContainer: true,
  props: {
    opacity: {
      name: 'opacity',
      label: '透明度',
      setter: 'NumberSetter',
      setterProps: {
        min: 0,
        max: 1,
        step: 0.1,
      },
      defaultValue: 1,
      group: '样式',
    },
    rotation: {
      name: 'rotation',
      label: '旋转角度',
      setter: 'NumberSetter',
      defaultValue: 0,
      group: '变换',
    },
    borderRadius: {
      name: 'borderRadius',
      label: '圆角',
      setter: 'NumberSetter',
      defaultValue: 0,
      group: '样式',
    },
    backgroundColor: {
      name: 'backgroundColor',
      label: '背景颜色',
      setter: 'ColorSetter',
      defaultValue: 'transparent',
      group: '样式',
    },
    border: {
      name: 'border',
      label: '边框',
      setter: 'StringSetter',
      defaultValue: 'none',
      group: '样式',
    },
    showPlaceholder: {
      name: 'showPlaceholder',
      label: '显示占位符',
      setter: 'BooleanSetter',
      defaultValue: true,
      group: '显示',
    },
    placeholder: {
      name: 'placeholder',
      label: '占位符文本',
      setter: 'StringSetter',
      defaultValue: '组合',
      group: '显示',
    },
  },
  events: ['onToggle'],
  defaultSize: {
    width: 300,
    height: 200,
  },
}

export default meta
