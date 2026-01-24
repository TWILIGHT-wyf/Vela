<template>
  <div class="v-scatter-chart" :style="{ width: '100%', height: '100%' }">
    <v-chart :option="finalOption" autoresize class="echart" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { ScatterChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import type { EChartsOption } from 'echarts'

// 注册 ECharts 组件
use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  ScatterChart,
  CanvasRenderer,
])

// 定义标准的 Props，不含任何业务逻辑 ID
const props = defineProps<{
  // 基础数据 Props
  data?: Array<[number, number]>

  // 样式配置 Props
  title?: string
  titleAlign?: 'left' | 'center' | 'right'
  titleSize?: number
  titleColor?: string
  seriesName?: string
  symbolSize?: number
  color?: string
  opacity?: number
  showLegend?: boolean
  legendLeft?: string
  legendTop?: string
  gridLeft?: string
  gridRight?: string
  gridBottom?: string
  gridTop?: string
  xAxisName?: string
  yAxisName?: string
  showXAxisSplitLine?: boolean
  showYAxisSplitLine?: boolean

  // 高级覆盖
  option?: EChartsOption
}>()

// 默认值配置
const defaultData: Array<[number, number]> = [
  [10.0, 8.04],
  [8.07, 6.95],
  [13.0, 7.58],
  [9.05, 8.81],
  [11.0, 8.33],
  [14.0, 7.66],
  [13.4, 6.81],
  [10.0, 6.33],
  [14.0, 8.96],
  [12.5, 6.82],
]

// 计算最终 Option
const finalOption = computed<EChartsOption>(() => {
  // 如果有高级配置 option，优先使用
  if (props.option && Object.keys(props.option).length > 0) return props.option

  const data = props.data && props.data.length ? props.data : defaultData
  const seriesName = props.seriesName || 'Data'

  return {
    title: {
      text: props.title || '',
      left: props.titleAlign || 'center',
      textStyle: {
        fontSize: props.titleSize || 16,
        color: props.titleColor || '#333',
      },
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: unknown) => {
        const p = params as { seriesName: string; value: [number, number] }
        return `${p.seriesName}<br/>${p.value[0]}, ${p.value[1]}`
      },
    },
    legend: {
      show: props.showLegend !== false,
      left: props.legendLeft || 'center',
      top: props.legendTop || 'bottom',
    },
    grid: {
      left: props.gridLeft || '10%',
      right: props.gridRight || '10%',
      bottom: props.gridBottom || '15%',
      top: props.gridTop || '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      name: props.xAxisName || '',
      nameLocation: 'middle',
      nameGap: 30,
      splitLine: {
        show: props.showXAxisSplitLine !== false,
      },
    },
    yAxis: {
      type: 'value',
      name: props.yAxisName || '',
      nameLocation: 'middle',
      nameGap: 40,
      splitLine: {
        show: props.showYAxisSplitLine !== false,
      },
    },
    series: [
      {
        name: seriesName,
        type: 'scatter',
        symbolSize: props.symbolSize || 10,
        data: data,
        itemStyle: {
          color: props.color || '#5470c6',
          opacity: props.opacity || 0.8,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  }
})
</script>

<style scoped>
.v-scatter-chart {
  width: 100%;
  height: 100%;
}
</style>
