import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'Grid',
  title: '网格编排',
  version: '1.0.0',
  category: '布局',
  isContainer: true,
  props: {
    columns: {
      name: 'columns',
      label: '列模板',
      setter: 'StringSetter',
      defaultValue: 'repeat(3, 1fr)',
      group: '布局',
    },
    rows: {
      name: 'rows',
      label: '行模板',
      setter: 'StringSetter',
      defaultValue: 'auto',
      group: '布局',
    },
    gap: {
      name: 'gap',
      label: '网格间距',
      setter: 'StringSetter',
      defaultValue: '16px',
      group: '布局',
    },
    rowGap: {
      name: 'rowGap',
      label: '行间距',
      setter: 'StringSetter',
      defaultValue: '',
      group: '布局',
    },
    columnGap: {
      name: 'columnGap',
      label: '列间距',
      setter: 'StringSetter',
      defaultValue: '',
      group: '布局',
    },
    autoFlow: {
      name: 'autoFlow',
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
      setter: 'StringSetter',
      defaultValue: '16px',
      group: '样式',
    },
    borderRadius: {
      name: 'borderRadius',
      label: '圆角',
      setter: 'StringSetter',
      defaultValue: '4px',
      group: '样式',
    },
    minHeight: {
      name: 'minHeight',
      label: '最小高度',
      setter: 'StringSetter',
      defaultValue: '200px',
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
