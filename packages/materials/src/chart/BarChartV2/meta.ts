import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'BarChartV2',
  componentName: 'BarChartV2',
  title: '柱状图 V2',
  version: '2.0.0',
  category: '图表',

  // 启用容器模式 (如果需要)
  isContainer: false,

  props: {
    // 1. 数据源配置
    dataSource: {
      name: 'dataSource',
      label: '数据源',
      setter: 'ObjectSetter', // 或者专门的 DataSourceSetter
      group: '数据',
      description: '配置图表的数据来源',
      properties: {
        type: {
          name: 'type',
          label: '类型',
          setter: 'SelectSetter',
          setterProps: {
            options: [
              { label: '静态数据', value: 'static' },
              { label: 'API 接口', value: 'api' },
            ],
          },
          defaultValue: 'static',
        },
        url: {
          name: 'url',
          label: '接口地址',
          setter: 'StringSetter',
          visible: (props: any) => props.dataSource?.type === 'api',
        },
        // ... 其他数据源配置
      },
    },

    // 2. 视觉配置 (分组)
    config: {
      name: 'config',
      label: '图表配置',
      setter: 'ObjectSetter',
      group: '配置',
      properties: {
        // 标题分组
        title: {
          name: 'title',
          label: '标题设置',
          setter: 'ObjectSetter',
          properties: {
            text: {
              name: 'text',
              label: '标题内容',
              setter: 'StringSetter',
              defaultValue: '柱状图',
            },
            align: {
              name: 'align',
              label: '对齐方式',
              setter: 'SelectSetter',
              setterProps: {
                options: [
                  { label: '居左', value: 'left' },
                  { label: '居中', value: 'center' },
                  { label: '居右', value: 'right' },
                ],
              },
              defaultValue: 'center',
            },
          },
        },
        // 坐标轴分组
        axis: {
          name: 'axis',
          label: '坐标轴',
          setter: 'ObjectSetter',
          properties: {
            x: {
              name: 'x',
              label: 'X轴',
              setter: 'ObjectSetter',
              properties: {
                name: { name: 'name', label: '名称', setter: 'StringSetter' },
                data: {
                  name: 'data',
                  label: '静态类目',
                  setter: 'JsonSetter',
                  defaultValue: ['A', 'B', 'C', 'D', 'E'],
                },
              },
            },
            y: {
              name: 'y',
              label: 'Y轴',
              setter: 'ObjectSetter',
              properties: {
                name: { name: 'name', label: '名称', setter: 'StringSetter' },
              },
            },
          },
        },
        // 系列分组
        series: {
          name: 'series',
          label: '系列设置',
          setter: 'ObjectSetter',
          properties: {
            name: { name: 'name', label: '系列名', setter: 'StringSetter', defaultValue: 'Sales' },
            color: { name: 'color', label: '颜色', setter: 'ColorSetter', defaultValue: '#409eff' },
            width: { name: 'width', label: '柱宽度', setter: 'StringSetter', defaultValue: '60%' },
            radius: { name: 'radius', label: '圆角', setter: 'NumberSetter', defaultValue: 0 },
          },
        },
      },
    },

    // 3. 高级配置 (JSON)
    option: {
      name: 'option',
      label: 'ECharts Option',
      setter: 'JsonSetter',
      group: '高级',
      description: '覆盖原生 ECharts 配置',
    },
  },

  events: ['onClick', 'onHover'],

  defaultSize: {
    width: 400,
    height: 300,
  },
}

export default meta
