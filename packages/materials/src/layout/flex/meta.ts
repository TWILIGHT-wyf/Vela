import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'Flex',
  title: '弹性布局',
  version: '1.0.0',
  category: '布局容器',
  isContainer: true,
  props: {
    flexDirection: {
      name: 'flexDirection',
      label: '主轴方向',
      title: '主轴方向',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '水平', value: 'row' },
          { label: '垂直', value: 'column' },
        ],
      },
      defaultValue: 'row',
      group: '布局',
    },
    justifyContent: {
      name: 'justifyContent',
      label: '主轴对齐',
      title: '主轴对齐',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '起点', value: 'flex-start' },
          { label: '终点', value: 'flex-end' },
          { label: '居中', value: 'center' },
          { label: '两端', value: 'space-between' },
          { label: '周围', value: 'space-around' },
          { label: '均匀', value: 'space-evenly' },
        ],
      },
      defaultValue: 'flex-start',
      group: '布局',
    },
    alignItems: {
      name: 'alignItems',
      label: '交叉轴对齐',
      title: '交叉轴对齐',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '起点', value: 'flex-start' },
          { label: '终点', value: 'flex-end' },
          { label: '居中', value: 'center' },
          { label: '基线', value: 'baseline' },
          { label: '拉伸', value: 'stretch' },
        ],
      },
      defaultValue: 'stretch',
      group: '布局',
    },
    flexWrap: {
      name: 'flexWrap',
      label: '换行',
      title: '换行',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '不换行', value: 'nowrap' },
          { label: '换行', value: 'wrap' },
          { label: '反向换行', value: 'wrap-reverse' },
        ],
      },
      defaultValue: 'nowrap',
      group: '布局',
    },
    gap: {
      name: 'gap',
      label: '间距(px)',
      title: '间距(px)',
      setter: 'NumberSetter',
      defaultValue: 16,
      group: '布局',
    },
    backgroundColor: {
      name: 'backgroundColor',
      label: '背景颜色',
      title: '背景颜色',
      setter: 'ColorSetter',
      defaultValue: '#ffffff',
      group: '外观',
    },
    minHeight: {
      name: 'minHeight',
      label: '最小高度(px)',
      title: '最小高度(px)',
      setter: 'NumberSetter',
      defaultValue: 100,
      group: '尺寸',
    },
  },
  events: [],
  defaultSize: {
    width: 400,
    height: 200,
  },
}

export default meta
