import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'Pagination',
  title: '分页器',
  version: '1.0.0',
  category: '导航',
  props: {
    total: {
      name: 'total',
      label: '总条数',
      setter: 'NumberSetter',
      defaultValue: 100,
      group: '数据',
    },
    currentPage: {
      name: 'currentPage',
      label: '当前页',
      setter: 'NumberSetter',
      defaultValue: 1,
      group: '数据',
    },
    pageSize: {
      name: 'pageSize',
      label: '每页条数',
      setter: 'NumberSetter',
      defaultValue: 10,
      group: '数据',
    },
    pageSizes: {
      name: 'pageSizes',
      label: '可选每页条数',
      setter: 'JsonSetter',
      defaultValue: [10, 20, 50, 100],
      group: '数据',
    },
    layout: {
      name: 'layout',
      label: '布局',
      setter: 'StringSetter',
      defaultValue: 'prev, pager, next, sizes, total',
      group: '布局',
    },
    background: {
      name: 'background',
      label: '显示背景',
      setter: 'BooleanSetter',
      defaultValue: true,
      group: '样式',
    },
    small: {
      name: 'small',
      label: '小尺寸',
      setter: 'BooleanSetter',
      defaultValue: false,
      group: '样式',
    },
    backgroundColor: {
      name: 'backgroundColor',
      label: '背景颜色',
      setter: 'ColorSetter',
      defaultValue: 'transparent',
      group: '样式',
    },
  },
  events: ['onCurrentChange', 'onSizeChange'],
  defaultSize: {
    width: 400,
    height: 40,
  },
}

export default meta
