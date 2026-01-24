import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'KpiCard',
  componentName: 'KpiCard',
  title: '指标卡',
  version: '1.0.0',
  category: '数据',

  props: {
    // 1. 数据源
    dataSource: {
      name: 'dataSource',
      label: '数据源',
      setter: 'ObjectSetter',
      group: '数据',
      properties: {
        type: {
          name: 'type',
          label: '类型',
          setter: 'SelectSetter',
          setterProps: {
            options: [
              { label: '静态数据', value: 'static' },
              { label: 'API', value: 'api' },
            ],
          },
          defaultValue: 'static',
        },
        url: {
          name: 'url',
          label: 'API地址',
          setter: 'StringSetter',
          visible: (props: any) => props.dataSource?.type === 'api',
        },
      },
    },

    // 2. 头部配置
    header: {
      name: 'header',
      label: '头部',
      setter: 'ObjectSetter',
      group: '配置',
      properties: {
        title: { name: 'title', label: '标题', setter: 'StringSetter', defaultValue: '总销售额' },
        tooltip: { name: 'tooltip', label: '提示', setter: 'StringSetter' },
      },
    },

    // 3. 内容配置
    content: {
      name: 'content',
      label: '数值',
      setter: 'ObjectSetter',
      group: '配置',
      properties: {
        value: {
          name: 'value',
          label: '数值',
          setter: 'StringSetter', // 支持表达式，或者是 NumberSetter
          defaultValue: 12580,
          description: '支持绑定表达式 {{ data.field }}',
        },
        prefix: { name: 'prefix', label: '前缀', setter: 'StringSetter', defaultValue: '¥' },
        suffix: { name: 'suffix', label: '后缀', setter: 'StringSetter' },
        precision: { name: 'precision', label: '精度', setter: 'NumberSetter', defaultValue: 0 },
        separator: {
          name: 'separator',
          label: '千分位',
          setter: 'BooleanSetter',
          defaultValue: true,
        },
      },
    },

    // 4. 底部/趋势配置
    footer: {
      name: 'footer',
      label: '趋势',
      setter: 'ObjectSetter',
      group: '配置',
      properties: {
        trend: {
          name: 'trend',
          label: '趋势详情',
          setter: 'ObjectSetter',
          properties: {
            label: { name: 'label', label: '描述', setter: 'StringSetter', defaultValue: '周同比' },
            value: { name: 'value', label: '幅度', setter: 'StringSetter', defaultValue: '12%' },
            type: {
              name: 'type',
              label: '方向',
              setter: 'SelectSetter',
              setterProps: {
                options: [
                  { label: '上升', value: 'up' },
                  { label: '下降', value: 'down' },
                  { label: '持平', value: 'normal' },
                ],
              },
              defaultValue: 'up',
            },
          },
        },
      },
    },

    // 5. 样式配置
    styleConfig: {
      name: 'styleConfig',
      label: '样式',
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
        padding: { name: 'padding', label: '内边距', setter: 'NumberSetter', defaultValue: 16 },
        shadow: { name: 'shadow', label: '阴影', setter: 'StringSetter' },

        // 文字样式
        titleColor: { name: 'titleColor', label: '标题色', setter: 'ColorSetter' },
        valueColor: { name: 'valueColor', label: '数值色', setter: 'ColorSetter' },
        valueSize: {
          name: 'valueSize',
          label: '数值字号',
          setter: 'NumberSetter',
          defaultValue: 24,
        },
      },
    },
  },

  defaultSize: {
    width: 240,
    height: 140,
  },
}

export default meta
