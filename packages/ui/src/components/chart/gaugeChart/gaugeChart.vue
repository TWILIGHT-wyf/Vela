<template>
  <div class="v-gauge-chart" :style="{ width: '100%', height: '100%' }">
    <v-chart :option="finalOption" autoresize class="echart" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { GaugeChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import type { EChartsOption } from 'echarts'

// 注册 ECharts 组件
use([TitleComponent, TooltipComponent, GaugeChart, CanvasRenderer])

// 定义标准的 Props，不含任何业务逻辑 ID
const props = defineProps<{
  // 基础数据 Props
  value?: number
  name?: string
  min?: number
  max?: number

  // 样式配置 Props
  title?: string
  startAngle?: number
  endAngle?: number
  splitNumber?: number
  showProgress?: boolean
  progressWidth?: number
  axisLineWidth?: number
  axisLineColor?: Array<[number, string]>
  pointerColor?: string
  pointerLength?: string
  pointerWidth?: number
  showAxisTick?: boolean
  axisTickSplitNumber?: number
  showSplitLine?: boolean
  splitLineLength?: number
  showAxisLabel?: boolean
  axisLabelDistance?: number
  axisLabelFontSize?: number
  detailFormatter?: string
  detailFontSize?: number
  detailOffsetX?: string
  detailOffsetY?: string

  // 高级覆盖
  option?: EChartsOption
}>()

// 计算最终 Option
const finalOption = computed<EChartsOption>(() => {
  // 如果有高级配置 option，优先使用
  if (props.option && Object.keys(props.option).length > 0) return props.option

  const value = props.value ?? 75
  const name = props.name || 'Progress'
  const min = props.min ?? 0
  const max = props.max ?? 100

  return {
    title: {
      text: props.title || '',
      left: 'center',
    },
    tooltip: {
      formatter: '{b}: {c}',
    },
    series: [
      {
        name: name,
        type: 'gauge',
        min: min,
        max: max,
        startAngle: props.startAngle || 225,
        endAngle: props.endAngle || -45,
        splitNumber: props.splitNumber || 10,
        progress: {
          show: props.showProgress !== false,
          width: props.progressWidth || 10,
        },
        axisLine: {
          lineStyle: {
            width: props.axisLineWidth || 10,
            color: props.axisLineColor || [
              [0.3, '#67e0e3'],
              [0.7, '#37a2da'],
              [1, '#fd666d'],
            ],
          },
        },
        pointer: {
          itemStyle: {
            color: props.pointerColor || 'auto',
          },
          length: props.pointerLength || '70%',
          width: props.pointerWidth || 8,
        },
        axisTick: {
          show: props.showAxisTick !== false,
          splitNumber: props.axisTickSplitNumber || 5,
        },
        splitLine: {
          show: props.showSplitLine !== false,
          length: props.splitLineLength || 15,
        },
        axisLabel: {
          show: props.showAxisLabel !== false,
          distance: props.axisLabelDistance || 25,
          fontSize: props.axisLabelFontSize || 12,
        },
        detail: {
          valueAnimation: true,
          formatter: props.detailFormatter || '{value}',
          fontSize: props.detailFontSize || 20,
          offsetCenter: [props.detailOffsetX || '0%', props.detailOffsetY || '70%'],
        },
        data: [
          {
            value: value,
            name: name,
          },
        ],
      },
    ],
  }
})
</script>

<style scoped>
.v-gauge-chart {
  width: 100%;
  height: 100%;
}
</style>
