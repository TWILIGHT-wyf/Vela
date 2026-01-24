import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'GridBox',
  componentName: 'GridBox',
  title: '网格布局',
  version: '1.0.0',
  category: '布局',
  isContainer: true, // 核心：允许拖入子组件

  props: {
    // 布局配置
    layout: {
      name: 'layout',
      label: '网格设置',
      setter: 'ObjectSetter',
      group: '布局',
      properties: {
        columns: {
          name: 'columns',
          label: '列数',
          setter: 'NumberSetter',
          defaultValue: 2,
          setterProps: { min: 1, max: 12, step: 1 },
        },
        gap: { name: 'gap', label: '间距', setter: 'NumberSetter', defaultValue: 10 },
        rowGap: { name: 'rowGap', label: '行间距', setter: 'NumberSetter' },
        autoRows: {
          name: 'autoRows',
          label: '行高策略',
          setter: 'StringSetter',
          defaultValue: 'minmax(100px, auto)',
          description: 'CSS Grid auto-rows 属性',
        },
        alignItems: {
          name: 'alignItems',
          label: '垂直对齐',
          setter: 'SelectSetter',
          setterProps: {
            options: [
              { label: '拉伸', value: 'stretch' },
              { label: '顶部', value: 'start' },
              { label: '底部', value: 'end' },
              { label: '居中', value: 'center' },
            ],
          },
          defaultValue: 'stretch',
        },
        justifyItems: {
          name: 'justifyItems',
          label: '水平对齐',
          setter: 'SelectSetter',
          setterProps: {
            options: [
              { label: '拉伸', value: 'stretch' },
              { label: '左对齐', value: 'start' },
              { label: '右对齐', value: 'end' },
              { label: '居中', value: 'center' },
            ],
          },
          defaultValue: 'stretch',
        },
      },
    },
  },

  defaultSize: {
    width: 400,
    height: 300,
  },
}

export default meta
