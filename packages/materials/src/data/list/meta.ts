import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'List',
  title: '列表',
  version: '1.0.0',
  category: '数据',
  props: {
    data: {
      name: 'data',
      label: '列表数据',
      setter: 'JsonSetter',
      defaultValue: [],
      group: '数据',
    },
    titleField: {
      name: 'titleField',
      label: '标题字段',
      setter: 'StringSetter',
      defaultValue: 'title',
      group: '字段映射',
    },
    descriptionField: {
      name: 'descriptionField',
      label: '描述字段',
      setter: 'StringSetter',
      defaultValue: 'description',
      group: '字段映射',
    },
    extraField: {
      name: 'extraField',
      label: '额外信息字段',
      setter: 'StringSetter',
      defaultValue: 'extra',
      group: '字段映射',
    },
    showBorder: {
      name: 'showBorder',
      label: '显示边框',
      setter: 'BooleanSetter',
      defaultValue: true,
      group: '显示',
    },
    showSplit: {
      name: 'showSplit',
      label: '分割线',
      setter: 'BooleanSetter',
      defaultValue: true,
      group: '显示',
    },
    loading: {
      name: 'loading',
      label: '加载状态',
      setter: 'BooleanSetter',
      defaultValue: false,
      group: '状态',
    },
    emptyText: {
      name: 'emptyText',
      label: '空数据提示',
      setter: 'StringSetter',
      defaultValue: '暂无数据',
      group: '状态',
    },
    size: {
      name: 'size',
      label: '尺寸',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '小', value: 'small' },
          { label: '默认', value: 'default' },
          { label: '大', value: 'large' },
        ],
      },
      defaultValue: 'default',
      group: '样式',
    },
  },
  events: ['onItemClick'],
  defaultSize: {
    width: 400,
    height: 300,
  },
}

export default meta
