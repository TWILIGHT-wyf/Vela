import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'Row',
  title: '行容器',
  version: '1.0.0',
  category: '布局容器',
  isContainer: true,
  props: {
    gutter: {
      name: 'gutter',
      label: '栅格间隔',
      setter: 'NumberSetter',
      defaultValue: 0,
      group: '布局',
    },
    justify: {
      name: 'justify',
      label: '水平排列',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '左对齐', value: 'start' },
          { label: '居中', value: 'center' },
          { label: '右对齐', value: 'end' },
          { label: '两端对齐', value: 'space-between' },
          { label: '环绕对齐', value: 'space-around' },
          { label: '均匀对齐', value: 'space-evenly' },
        ],
      },
      defaultValue: 'start',
      group: '布局',
    },
    align: {
      name: 'align',
      label: '垂直对齐',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '顶部', value: 'top' },
          { label: '居中', value: 'middle' },
          { label: '底部', value: 'bottom' },
        ],
      },
      defaultValue: 'top',
      group: '布局',
    },
    tag: {
      name: 'tag',
      label: 'HTML标签',
      setter: 'StringSetter',
      defaultValue: 'div',
      group: '基础',
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
    width: 600,
    height: 100,
  },
}

export default meta
