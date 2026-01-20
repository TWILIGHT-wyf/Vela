import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  componentName: 'SankeyChart',
  title: '桑基图',
  category: '图表',
  props: {
    title: {
      title: '图表标题',
      setter: 'StringSetter',
      defaultValue: '',
    },
    showLabel: {
      title: '显示标签',
      setter: 'BooleanSetter',
      defaultValue: true,
    },
    nodeWidth: {
      title: '节点宽度',
      setter: 'NumberSetter',
      defaultValue: 20,
    },
    nodeGap: {
      title: '节点间距',
      setter: 'NumberSetter',
      defaultValue: 8,
    },
    nodeAlign: {
      title: '对齐方式',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '靠左', value: 'left' },
          { label: '靠右', value: 'right' },
          { label: '居中', value: 'justify' },
        ],
      },
      defaultValue: 'justify',
    },
    orient: {
      title: '布局方向',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '水平', value: 'horizontal' },
          { label: '垂直', value: 'vertical' },
        ],
      },
      defaultValue: 'horizontal',
    },
    data: {
      title: '节点数据',
      setter: 'JsonSetter',
      defaultValue: [
        { name: 'a' },
        { name: 'b' },
        { name: 'c' },
        { name: 'd' },
        { name: 'e' },
        { name: 'f' },
      ],
    },
    links: {
      title: '连线数据',
      setter: 'JsonSetter',
      defaultValue: [
        { source: 'a', target: 'b', value: 5 },
        { source: 'a', target: 'c', value: 3 },
        { source: 'b', target: 'd', value: 8 },
        { source: 'b', target: 'e', value: 3 },
        { source: 'c', target: 'e', value: 4 },
        { source: 'd', target: 'f', value: 6 },
        { source: 'e', target: 'f', value: 5 },
      ],
    },
    option: {
      title: '高级配置(JSON)',
      setter: 'JsonSetter',
      defaultValue: {},
    },
  },
  events: [],
}

export default meta
