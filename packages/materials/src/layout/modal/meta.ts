import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'Modal',
  title: '对话框',
  version: '1.0.0',
  category: '布局',
  isContainer: true,
  props: {
    visible: {
      name: 'visible',
      label: '显示对话框',
      setter: 'BooleanSetter',
      defaultValue: false,
      group: '基础',
    },
    title: {
      name: 'title',
      label: '标题',
      setter: 'StringSetter',
      defaultValue: '对话框标题',
      group: '基础',
    },
    width: {
      name: 'width',
      label: '宽度',
      setter: 'StringSetter',
      defaultValue: '50%',
      group: '尺寸',
    },
    fullscreen: {
      name: 'fullscreen',
      label: '全屏',
      setter: 'BooleanSetter',
      defaultValue: false,
      group: '尺寸',
    },
    closeOnClickModal: {
      name: 'closeOnClickModal',
      label: '点击遮罩关闭',
      setter: 'BooleanSetter',
      defaultValue: true,
      group: '交互',
    },
    closable: {
      name: 'closable',
      label: '显示关闭按钮',
      setter: 'BooleanSetter',
      defaultValue: true,
      group: '交互',
    },
    showFooter: {
      name: 'showFooter',
      label: '显示底部',
      setter: 'BooleanSetter',
      defaultValue: true,
      group: '交互',
    },
    content: {
      name: 'content',
      label: '内容',
      setter: 'StringSetter',
      defaultValue: '这是对话框内容',
      group: '内容',
    },
    cancelText: {
      name: 'cancelText',
      label: '取消按钮文本',
      setter: 'StringSetter',
      defaultValue: '取消',
      group: '交互',
    },
    confirmText: {
      name: 'confirmText',
      label: '确认按钮文本',
      setter: 'StringSetter',
      defaultValue: '确定',
      group: '交互',
    },
    backgroundColor: {
      name: 'backgroundColor',
      label: '背景颜色',
      setter: 'ColorSetter',
      defaultValue: '#ffffff',
      group: '外观',
    },
    textColor: {
      name: 'textColor',
      label: '文本颜色',
      setter: 'ColorSetter',
      defaultValue: '#333333',
      group: '外观',
    },
  },
  events: ['onClose', 'onOpen'],
  defaultSize: {
    width: 500,
    height: 300,
  },
}

export default meta
