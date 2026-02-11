import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'Grid',
  title: '网格编排',
  version: '1.0.0',
  category: '布局容器',
  isContainer: true,
  props: {
    gridTemplateColumns: {
      name: 'gridTemplateColumns',
      label: '列模板',
      setter: 'StringSetter',
      defaultValue: 'repeat(3, 1fr)',
      group: '布局',
    },
    gridTemplateRows: {
      name: 'gridTemplateRows',
      label: '行模板',
      setter: 'StringSetter',
      defaultValue: 'auto',
      group: '布局',
    },
    gridGap: {
      name: 'gridGap',
      label: '间距(px)',
      setter: 'NumberSetter',
      defaultValue: 16,
      group: '布局',
    },
    gridAutoFlow: {
      name: 'gridAutoFlow',
      label: '自动流动',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '行', value: 'row' },
          { label: '列', value: 'column' },
          { label: '密集行', value: 'row dense' },
          { label: '密集列', value: 'column dense' },
        ],
      },
      defaultValue: 'row',
      group: '布局',
    },
    backgroundColor: {
      name: 'backgroundColor',
      label: '背景颜色',
      setter: 'ColorSetter',
      defaultValue: '#ffffff',
      group: '外观',
    },
    padding: {
      name: 'padding',
      label: '内边距',
      setter: 'NumberSetter',
      defaultValue: 16,
      group: '样式',
    },
    border: {
      name: 'border',
      label: '边框',
      setter: 'StringSetter',
      defaultValue: '1px solid #e5e7eb',
      group: '样式',
    },
    borderRadius: {
      name: 'borderRadius',
      label: '圆角',
      setter: 'NumberSetter',
      defaultValue: 4,
      group: '样式',
    },
    textColor: {
      name: 'textColor',
      label: '文字颜色',
      setter: 'ColorSetter',
      defaultValue: '#333333',
      group: '样式',
    },
    minHeight: {
      name: 'minHeight',
      label: '最小高度(px)',
      setter: 'NumberSetter',
      defaultValue: 200,
      group: '尺寸',
    },
  },
  events: [],
  defaultSize: {
    width: 400,
    height: 300,
  },
}

export default meta
