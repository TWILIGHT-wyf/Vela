<template>
  <div class="v-pie-chart" :style="{ width: '100%', height: '100%' }">
    <v-chart :option="finalOption" autoresize class="echart" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import type { EChartsOption } from 'echarts'

// 注册 ECharts 组件
use([TitleComponent, TooltipComponent, LegendComponent, PieChart, CanvasRenderer])

// 定义标准的 Props，不含任何业务逻辑 ID
const props = defineProps<{
  // 基础数据 Props
  data?: Array<{ name: string; value: number }>

  // 样式配置 Props
  title?: string
  titleAlign?: 'left' | 'center' | 'right'
  titleSize?: number
  titleColor?: string
  seriesName?: string
  radius?: string
  centerX?: string
  centerY?: string
  showLegend?: boolean
  legendOrient?: 'horizontal' | 'vertical'
  legendLeft?: string
  legendTop?: string
  showLabel?: boolean
  labelFormatter?: string

  // 高级覆盖
  option?: EChartsOption
}>()

// 默认值配置
const defaultData = [
  { name: 'Category A', value: 335 },
  { name: 'Category B', value: 310 },
  { name: 'Category C', value: 234 },
  { name: 'Category D', value: 135 },
  { name: 'Category E', value: 148 },
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
      formatter: '{a} <br/>{b}: {c} ({d}%)',
    },
    legend: {
      show: props.showLegend !== false,
      orient: props.legendOrient || 'horizontal',
      left: props.legendLeft || 'center',
      top: props.legendTop || 'bottom',
    },
    series: [
      {
        name: seriesName,
        type: 'pie',
        radius: props.radius || '60%',
        center: [props.centerX || '50%', props.centerY || '50%'],
        data: data,
        label: {
          show: props.showLabel !== false,
          formatter: props.labelFormatter || '{b}: {c}',
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
.v-pie-chart {
  width: 100%;
  height: 100%;
}
</style>
