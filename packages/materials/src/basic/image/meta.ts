import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'Image',
  componentName: 'Image',
  title: '图片',
  version: '1.0.0',
  category: '基础组件',
  props: {
    url: {
      name: 'url',
      label: '图片地址',
      title: '图片地址',
      setter: 'ImageSetter',
      defaultValue: 'https://via.placeholder.com/300x200?text=Image',
      group: '基础',
    },
    alt: {
      name: 'alt',
      label: '替代文本',
      title: '替代文本',
      setter: 'StringSetter',
      defaultValue: '',
      group: '基础',
    },
    fit: {
      name: 'fit',
      label: '适应方式',
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
      group: '基础',
    },
    lazy: {
      name: 'lazy',
      label: '懒加载',
      title: '懒加载',
      setter: 'BooleanSetter',
      defaultValue: false,
      group: '交互',
    },
    preview: {
      name: 'preview',
      label: '开启预览',
      title: '开启预览',
      setter: 'BooleanSetter',
      defaultValue: false,
      group: '交互',
    },
    placeholder: {
      name: 'placeholder',
      label: '占位文本',
      title: '占位文本',
      setter: 'StringSetter',
      defaultValue: '请设置图片地址',
      group: '基础',
    },
  },
  styles: {
    backgroundColor: {
      name: 'backgroundColor',
      label: '背景颜色',
      title: '背景颜色',
      setter: 'ColorSetter',
      defaultValue: 'transparent',
      group: '外观',
    },
    borderRadius: {
      name: 'borderRadius',
      label: '圆角',
      title: '圆角',
      setter: 'StringSetter',
      defaultValue: 0,
      group: '外观',
    },
    opacity: {
      name: 'opacity',
      label: '透明度',
      title: '透明度',
      setter: 'SliderSetter',
      setterProps: {
        min: 0,
        max: 1,
        step: 0.1,
      },
      defaultValue: 1,
      group: '外观',
    },
  },
  events: ['onLoad', 'onError'],
  defaultSize: {
    width: 300,
    height: 200,
  },
}

export default meta
