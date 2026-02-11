import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'Upload',
  title: '文件上传',
  version: '1.0.0',
  category: '表单',
  props: {
    value: {
      name: 'value',
      label: '文件列表',
      title: '文件列表',
      setter: 'JsonSetter',
      defaultValue: [],
      group: '数据',
    },
    action: {
      name: 'action',
      label: '上传地址',
      title: '上传地址',
      setter: 'StringSetter',
      defaultValue: '#',
      group: '基础',
    },
    multiple: {
      name: 'multiple',
      label: '多选',
      title: '多选',
      setter: 'BooleanSetter',
      defaultValue: false,
      group: '交互',
    },
    limit: {
      name: 'limit',
      label: '数量上限',
      title: '数量上限',
      setter: 'NumberSetter',
      defaultValue: 3,
      group: '交互',
    },
    disabled: {
      name: 'disabled',
      label: '禁用',
      title: '禁用',
      setter: 'BooleanSetter',
      defaultValue: false,
      group: '交互',
    },
    accept: {
      name: 'accept',
      label: '文件类型',
      title: '文件类型',
      setter: 'StringSetter',
      defaultValue: '',
      group: '基础',
    },
    autoUpload: {
      name: 'autoUpload',
      label: '自动上传',
      title: '自动上传',
      setter: 'BooleanSetter',
      defaultValue: false,
      group: '交互',
    },
    listType: {
      name: 'listType',
      label: '列表类型',
      title: '列表类型',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '文本', value: 'text' },
          { label: '图片', value: 'picture' },
          { label: '卡片', value: 'picture-card' },
        ],
      },
      defaultValue: 'text',
      group: '样式',
    },
    buttonText: {
      name: 'buttonText',
      label: '按钮文案',
      title: '按钮文案',
      setter: 'StringSetter',
      defaultValue: '点击上传',
      group: '基础',
    },
    tip: {
      name: 'tip',
      label: '提示文本',
      title: '提示文本',
      setter: 'StringSetter',
      defaultValue: '',
      group: '基础',
    },
  },
  events: ['onChange'],
  defaultSize: {
    width: 260,
    height: 120,
  },
}

export default meta
