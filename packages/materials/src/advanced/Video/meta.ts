import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'Video',
  title: '视频',
  version: '1.0.0',
  category: '媒体',
  props: {
    url: {
      name: 'url',
      label: '视频地址',
      setter: 'StringSetter',
      defaultValue: '',
      group: '基础',
    },
    poster: {
      name: 'poster',
      label: '封面图',
      setter: 'StringSetter',
      defaultValue: '',
      group: '基础',
    },
    controls: {
      name: 'controls',
      label: '显示控件',
      setter: 'BooleanSetter',
      defaultValue: true,
      group: '交互',
    },
    autoplay: {
      name: 'autoplay',
      label: '自动播放',
      setter: 'BooleanSetter',
      defaultValue: false,
      group: '交互',
    },
    loop: {
      name: 'loop',
      label: '循环播放',
      setter: 'BooleanSetter',
      defaultValue: false,
      group: '交互',
    },
    muted: {
      name: 'muted',
      label: '静音',
      setter: 'BooleanSetter',
      defaultValue: false,
      group: '交互',
    },
    placeholder: {
      name: 'placeholder',
      label: '占位文本',
      setter: 'StringSetter',
      defaultValue: '请设置视频地址',
      group: '基础',
    },
    objectFit: {
      name: 'objectFit',
      label: '填充模式',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '包含', value: 'contain' },
          { label: '填充', value: 'fill' },
          { label: '覆盖', value: 'cover' },
          { label: '无', value: 'none' },
        ],
      },
      defaultValue: 'contain',
      group: '样式',
    },
    backgroundColor: {
      name: 'backgroundColor',
      label: '背景颜色',
      setter: 'ColorSetter',
      defaultValue: '#000000',
      group: '样式',
    },
    borderRadius: {
      name: 'borderRadius',
      label: '圆角',
      setter: 'NumberSetter',
      defaultValue: 0,
      group: '样式',
    },
    opacity: {
      name: 'opacity',
      label: '不透明度',
      setter: 'SliderSetter',
      setterProps: {
        min: 0,
        max: 100,
        step: 1,
      },
      defaultValue: 100,
      group: '样式',
    },
  },
  events: ['onPlay', 'onPause', 'onEnded'],
  defaultSize: {
    width: 640,
    height: 360,
  },
}

export default meta
