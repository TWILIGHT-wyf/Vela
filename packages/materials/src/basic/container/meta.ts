import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'Container',
  title: '容器',
  version: '1.0.0',
  category: '基础',
  isContainer: true,
  props: {
    padding: {
      name: 'padding',
      label: '内边距',
      setter: 'StringSetter',
      defaultValue: '12px',
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
      defaultValue: '320px',
      group: '尺寸',
    },
    height: {
      name: 'height',
      label: '高度',
      setter: 'StringSetter',
      defaultValue: '220px',
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
