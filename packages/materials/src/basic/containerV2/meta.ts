import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'ContainerV2',
  title: '容器 V2',
  version: '2.0.0',
  category: '布局',
  isContainer: true, // 标记为容器，允许拖入子组件

  props: {
    // 1. 布局配置
    layout: {
      name: 'layout',
      label: '布局设置',
      setter: 'ObjectSetter',
      group: '布局',
      properties: {
        display: {
          name: 'display',
          label: '模式',
          setter: 'SelectSetter',
          setterProps: {
            options: [
              { label: '块级布局', value: 'block' },
              { label: '弹性布局', value: 'flex' },
            ],
          },
          defaultValue: 'block',
        },
        direction: {
          name: 'direction',
          label: '方向',
          setter: 'SelectSetter',
          setterProps: {
            options: [
              { label: '水平', value: 'row' },
              { label: '垂直', value: 'column' },
            ],
          },
          visible: (props: any) => props.layout?.display === 'flex',
          defaultValue: 'row',
        },
        justify: {
          name: 'justify',
          label: '主轴对齐',
          setter: 'SelectSetter',
          setterProps: {
            options: [
              { label: '起点对齐', value: 'flex-start' },
              { label: '居中对齐', value: 'center' },
              { label: '终点对齐', value: 'flex-end' },
              { label: '两端对齐', value: 'space-between' },
              { label: '环绕对齐', value: 'space-around' },
            ],
          },
          visible: (props: any) => props.layout?.display === 'flex',
          defaultValue: 'flex-start',
        },
        align: {
          name: 'align',
          label: '交叉对齐',
          setter: 'SelectSetter',
          setterProps: {
            options: [
              { label: '起点对齐', value: 'flex-start' },
              { label: '居中对齐', value: 'center' },
              { label: '终点对齐', value: 'flex-end' },
              { label: '拉伸', value: 'stretch' },
            ],
          },
          visible: (props: any) => props.layout?.display === 'flex',
          defaultValue: 'stretch',
        },
        gap: {
          name: 'gap',
          label: '间距',
          setter: 'NumberSetter',
          visible: (props: any) => props.layout?.display === 'flex',
          defaultValue: 0,
        },
      },
    },

    // 2. 样式配置
    style: {
      name: 'style',
      label: '样式设置',
      setter: 'ObjectSetter',
      group: '样式',
      properties: {
        background: {
          name: 'background',
          label: '背景',
          setter: 'ObjectSetter',
          properties: {
            color: { name: 'color', label: '颜色', setter: 'ColorSetter' },
            image: { name: 'image', label: '图片', setter: 'ImageSetter' },
          },
        },
        border: {
          name: 'border',
          label: '边框',
          setter: 'ObjectSetter',
          properties: {
            width: { name: 'width', label: '宽度', setter: 'NumberSetter', defaultValue: 0 },
            style: {
              name: 'style',
              label: '样式',
              setter: 'SelectSetter',
              setterProps: {
                options: [
                  { label: '实线', value: 'solid' },
                  { label: '虚线', value: 'dashed' },
                  { label: '点线', value: 'dotted' },
                ],
              },
              defaultValue: 'solid',
            },
            color: { name: 'color', label: '颜色', setter: 'ColorSetter', defaultValue: '#dcdfe6' },
            radius: { name: 'radius', label: '圆角', setter: 'NumberSetter', defaultValue: 0 },
          },
        },
        spacing: {
          name: 'spacing',
          label: '间距',
          setter: 'ObjectSetter',
          properties: {
            padding: { name: 'padding', label: '内边距', setter: 'NumberSetter', defaultValue: 0 },
            // margin: { name: 'margin', label: '外边距', setter: 'NumberSetter', defaultValue: 0 }
          },
        },
        shadow: {
          name: 'shadow',
          label: '阴影',
          setter: 'StringSetter', // 可以改为专门的 BoxShadowSetter
          defaultValue: '',
        },
      },
    },
  },

  events: ['onClick', 'onMouseEnter', 'onMouseLeave'],

  defaultSize: {
    width: 300,
    height: 200,
  },
}

export default meta
