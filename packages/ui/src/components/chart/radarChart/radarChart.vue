<template>
  <div class="v-radar-chart" :style="{ width: '100%', height: '100%' }">
    <v-chart :option="finalOption" autoresize class="echart" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { RadarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  RadarComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import type { EChartsOption } from 'echarts'

// 注册 ECharts 组件
use([TitleComponent, TooltipComponent, LegendComponent, RadarComponent, RadarChart, CanvasRenderer])

// 定义标准的 Props，不含任何业务逻辑 ID
const props = defineProps<{
  // 基础数据 Props
  indicators?: Array<{ name: string; max: number }>
  seriesData?: Array<{ name: string; value: number[] }>

  // 样式配置 Props
  title?: string
  seriesName?: string
  radarShape?: 'polygon' | 'circle'
  splitNumber?: number
  axisNameColor?: string
  showArea?: boolean
  areaOpacity?: number

  // 高级覆盖
  option?: EChartsOption
}>()

// 默认值配置
const defaultIndicators = [
  { name: '销售', max: 100 },
  { name: '管理', max: 100 },
  { name: '技术', max: 100 },
  { name: '客服', max: 100 },
  { name: '研发', max: 100 },
  { name: '市场', max: 100 },
]

const defaultSeriesData = [
  { name: '预算', value: [43, 85, 70, 75, 68, 92] },
  { name: '实际开销', value: [50, 90, 60, 82, 73, 85] },
]

// 计算最终 Option
const finalOption = computed<EChartsOption>(() => {
  // 如果有高级配置 option，优先使用
  if (props.option && Object.keys(props.option).length > 0) return props.option

  const indicators =
    props.indicators && props.indicators.length ? props.indicators : defaultIndicators
  const seriesData =
    props.seriesData && props.seriesData.length ? props.seriesData : defaultSeriesData
  const seriesName = props.seriesName || 'Radar'

  return {
    title: {
      text: props.title || '',
      left: 'center',
    },
    tooltip: {
      trigger: 'item',
    },
    legend: {
      bottom: 10,
      data: seriesData.map((s) => s.name),
    },
    radar: {
      indicator: indicators,
      shape: props.radarShape || 'polygon',
      splitNumber: props.splitNumber || 5,
      axisName: {
        color: props.axisNameColor || '#333',
      },
    },
    series: [
      {
        name: seriesName,
        type: 'radar',
        data: seriesData,
        areaStyle: props.showArea
          ? {
              opacity: props.areaOpacity || 0.3,
            }
          : undefined,
      },
    ],
  }
})
</script>

<style scoped>
.v-radar-chart {
  width: 100%;
  height: 100%;
}
</style>
