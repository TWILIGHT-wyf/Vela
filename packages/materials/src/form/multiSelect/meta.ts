import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  componentName: 'MultiSelect',
  title: '多选选择器',
  category: '基础控件',
  props: {
    options: {
      title: '选项数据',
      setter: 'JsonSetter',
      defaultValue: [],
    },
    defaultValue: {
      title: '默认值',
      setter: 'JsonSetter',
      defaultValue: [],
    },
    placeholder: {
      title: '占位文本',
      setter: 'StringSetter',
      defaultValue: '请选择',
    },
    clearable: {
      title: '可清空',
      setter: 'BooleanSetter',
      defaultValue: true,
    },
    filterable: {
      title: '可搜索',
      setter: 'BooleanSetter',
      defaultValue: false,
    },
    collapseTags: {
      title: '折叠标签',
      setter: 'BooleanSetter',
      defaultValue: true,
    },
    collapseTagsTooltip: {
      title: '显示标签提示',
      setter: 'BooleanSetter',
      defaultValue: true,
    },
    maxCollapseTags: {
      title: '最大显示标签数',
      setter: 'NumberSetter',
      defaultValue: 2,
    },
    selectWidth: {
      title: '选择器宽度',
      setter: 'StringSetter',
      defaultValue: '100%',
    },
    borderColor: {
      title: '边框颜色',
      setter: 'ColorSetter',
      defaultValue: '#dcdfe6',
    },
  },
  events: ['onChange', 'onClear'],
}

export default meta
