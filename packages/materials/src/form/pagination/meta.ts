import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  componentName: 'Pagination',
  title: '分页器',
  category: '基础控件',
  props: {
    total: {
      title: '总条数',
      setter: 'NumberSetter',
      defaultValue: 100,
    },
    currentPage: {
      title: '当前页',
      setter: 'NumberSetter',
      defaultValue: 1,
    },
    pageSize: {
      title: '每页条数',
      setter: 'NumberSetter',
      defaultValue: 10,
    },
    pageSizes: {
      title: '可选每页条数',
      setter: 'JsonSetter',
      defaultValue: [10, 20, 50, 100],
    },
    layout: {
      title: '布局',
      setter: 'StringSetter',
      defaultValue: 'prev, pager, next, sizes, total',
    },
    background: {
      title: '显示背景',
      setter: 'BooleanSetter',
      defaultValue: true,
    },
    small: {
      title: '小尺寸',
      setter: 'BooleanSetter',
      defaultValue: false,
    },
    backgroundColor: {
      title: '背景颜色',
      setter: 'ColorSetter',
      defaultValue: 'transparent',
    },
  },
  events: ['onCurrentChange', 'onSizeChange'],
}

export default meta
