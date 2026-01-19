import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  componentName: 'Video',
  title: '视频',
  category: '媒体',
  props: {
    src: {
      title: '视频地址',
      setter: 'StringSetter',
      defaultValue: '',
    },
    poster: {
      title: '封面图',
      setter: 'StringSetter',
      defaultValue: '',
    },
    controls: {
      title: '显示控件',
      setter: 'BooleanSetter',
      defaultValue: true,
    },
    autoplay: {
      title: '自动播放',
      setter: 'BooleanSetter',
      defaultValue: false,
    },
    loop: {
      title: '循环播放',
      setter: 'BooleanSetter',
      defaultValue: false,
    },
    muted: {
      title: '静音',
      setter: 'BooleanSetter',
      defaultValue: false,
    },
  },
  events: ['onPlay', 'onPause', 'onEnded'],
}

export default meta
