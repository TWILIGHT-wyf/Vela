import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'Container',
  title: '容器',
  version: '1.0.0',
  category: '基础',
  isContainer: true,
  props: {
    tag: {
      name: 'tag',
      label: '语义标签',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: 'div', value: 'div' },
          { label: 'section', value: 'section' },
          { label: 'article', value: 'article' },
          { label: 'main', value: 'main' },
          { label: 'aside', value: 'aside' },
          { label: 'header', value: 'header' },
          { label: 'footer', value: 'footer' },
          { label: 'nav', value: 'nav' },
          { label: 'form', value: 'form' },
        ],
      },
      defaultValue: 'div',
      group: '语义',
    },
    role: {
      name: 'role',
      label: 'ARIA Role',
      setter: 'StringSetter',
      defaultValue: '',
      group: '语义',
    },
    ariaLabel: {
      name: 'ariaLabel',
      label: 'ARIA Label',
      setter: 'StringSetter',
      defaultValue: '',
      group: '语义',
    },
    padding: {
      name: 'padding',
      label: '内边距',
      setter: 'StringSetter',
      defaultValue: '0',
      group: '容器',
    },
    backgroundColor: {
      name: 'backgroundColor',
      label: '背景颜色',
      setter: 'ColorSetter',
      defaultValue: 'transparent',
      group: '容器',
    },
    overflow: {
      name: 'overflow',
      label: '溢出处理',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '可见', value: 'visible' },
          { label: '隐藏', value: 'hidden' },
          { label: '滚动', value: 'scroll' },
          { label: '自动', value: 'auto' },
        ],
      },
      defaultValue: 'visible',
      group: '容器',
    },
  },
  styles: {
    width: {
      name: 'width',
      label: '宽度',
      setter: 'StringSetter',
      defaultValue: '',
      group: '尺寸',
    },
    height: {
      name: 'height',
      label: '高度',
      setter: 'StringSetter',
      defaultValue: '',
      group: '尺寸',
    },
    minHeight: {
      name: 'minHeight',
      label: '最小高度',
      setter: 'StringSetter',
      defaultValue: '120px',
      group: '尺寸',
    },
    maxWidth: {
      name: 'maxWidth',
      label: '最大宽度',
      setter: 'StringSetter',
      defaultValue: '',
      group: '尺寸',
    },
    margin: {
      name: 'margin',
      label: '外边距',
      setter: 'StringSetter',
      defaultValue: '0',
      group: '间距',
    },
    border: {
      name: 'border',
      label: '边框',
      setter: 'StringSetter',
      defaultValue: 'none',
      group: '外观',
    },
    borderRadius: {
      name: 'borderRadius',
      label: '圆角',
      setter: 'StringSetter',
      defaultValue: '0',
      group: '外观',
    },
    boxShadow: {
      name: 'boxShadow',
      label: '阴影',
      setter: 'StringSetter',
      defaultValue: '',
      group: '外观',
    },
  },
  events: [],
  defaultSize: {
    width: 320,
    height: 220,
  },
}

export default meta
