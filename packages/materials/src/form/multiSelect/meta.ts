import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'MultiSelect',
  title: '多选选择器',
  version: '1.0.0',
  category: '基础控件',
  props: {
    options: {
      name: 'options',
      label: '选项数据',
      setter: 'JsonSetter',
      defaultValue: [],
      group: '数据',
    },
    defaultValue: {
      name: 'defaultValue',
      label: '默认值',
      setter: 'JsonSetter',
      defaultValue: [],
      group: '基础',
    },
    placeholder: {
      name: 'placeholder',
      label: '占位文本',
      setter: 'StringSetter',
      defaultValue: '请选择',
      group: '基础',
    },
    clearable: {
      name: 'clearable',
      label: '可清空',
      setter: 'BooleanSetter',
      defaultValue: true,
      group: '交互',
    },
    filterable: {
      name: 'filterable',
      label: '可搜索',
      setter: 'BooleanSetter',
      defaultValue: false,
      group: '交互',
    },
    collapseTags: {
      name: 'collapseTags',
      label: '折叠标签',
      setter: 'BooleanSetter',
      defaultValue: true,
      group: '显示',
    },
    collapseTagsTooltip: {
      name: 'collapseTagsTooltip',
      label: '显示标签提示',
      setter: 'BooleanSetter',
      defaultValue: true,
      group: '显示',
    },
    maxCollapseTags: {
      name: 'maxCollapseTags',
      label: '最大显示标签数',
      setter: 'NumberSetter',
      defaultValue: 2,
      group: '显示',
    },
    selectWidth: {
      name: 'selectWidth',
      label: '选择器宽度',
      setter: 'StringSetter',
      defaultValue: '100%',
      group: '尺寸',
    },
    borderColor: {
      name: 'borderColor',
      label: '边框颜色',
      setter: 'ColorSetter',
      defaultValue: '#dcdfe6',
      group: '样式',
    },
  },
  events: ['onChange', 'onClear'],
  defaultSize: {
    width: 200,
    height: 40,
  },
}

export default meta
