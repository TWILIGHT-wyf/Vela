<template>
  <div class="v-doughnut-chart" :style="{ width: '100%', height: '100%' }">
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
  innerRadius?: string
  outerRadius?: string
  centerX?: string
  centerY?: string
  borderRadius?: number
  borderColor?: string
  borderWidth?: number
  showLegend?: boolean
  legendOrient?: 'horizontal' | 'vertical'
  legendLeft?: string
  legendTop?: string
  showLabel?: boolean
  labelFormatter?: string
  showLabelLine?: boolean

  // 高级覆盖
  option?: EChartsOption
}>()

// 默认值配置
const defaultData = [
  { name: 'Direct', value: 335 },
  { name: 'Email', value: 310 },
  { name: 'Union Ads', value: 234 },
  { name: 'Video Ads', value: 135 },
  { name: 'Search Engine', value: 1548 },
]

// 计算最终 Option
const finalOption = computed<EChartsOption>(() => {
  // 如果有高级配置 option，优先使用
  if (props.option && Object.keys(props.option).length > 0) return props.option

  const data = props.data && props.data.length ? props.data : defaultData
  const seriesName = props.seriesName || 'Access From'

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
        radius: [props.innerRadius || '40%', props.outerRadius || '70%'],
        center: [props.centerX || '50%', props.centerY || '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: props.borderRadius || 10,
          borderColor: props.borderColor || '#fff',
          borderWidth: props.borderWidth || 2,
        },
        label: {
          show: props.showLabel !== false,
          formatter: props.labelFormatter || '{b}: {c}',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: props.showLabelLine !== false,
        },
        data: data,
      },
    ],
  }
})
</script>

<style scoped>
.v-doughnut-chart {
  width: 100%;
  height: 100%;
}
</style>
