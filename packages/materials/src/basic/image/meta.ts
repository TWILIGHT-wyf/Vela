import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  componentName: 'Image',
  title: '图片',
  category: '基础组件',
  props: {
    src: {
      title: '图片地址',
      setter: 'StringSetter',
      defaultValue: '',
    },
    alt: {
      title: '替代文本',
      setter: 'StringSetter',
      defaultValue: '',
    },
    fit: {
      title: '适应方式',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '填充', value: 'fill' },
          { label: '包含', value: 'contain' },
          { label: '覆盖', value: 'cover' },
          { label: '无', value: 'none' },
          { label: '缩小', value: 'scale-down' },
        ],
      },
      defaultValue: 'cover',
    },
    lazy: {
      title: '懒加载',
      setter: 'BooleanSetter',
      defaultValue: false,
    },
  },
  events: ['onLoad', 'onError'],
}

export default meta
