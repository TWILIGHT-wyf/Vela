<template>
  <div class="v-funnel-chart" :style="{ width: '100%', height: '100%' }">
    <v-chart :option="finalOption" autoresize class="echart" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { FunnelChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import type { EChartsOption } from 'echarts'

// 注册 ECharts 组件
use([TitleComponent, TooltipComponent, LegendComponent, FunnelChart, CanvasRenderer])

// 定义标准的 Props，不含任何业务逻辑 ID
const props = defineProps<{
  // 基础数据 Props
  data?: Array<{ name: string; value: number }>

  // 样式配置 Props
  title?: string
  seriesName?: string
  left?: string
  top?: string
  bottom?: string
  width?: string
  min?: number
  max?: number
  minSize?: string
  maxSize?: string
  sort?: 'descending' | 'ascending' | 'none'
  gap?: number
  showLabel?: boolean
  labelPosition?: 'left' | 'right' | 'inside'
  labelFormatter?: string
  showLabelLine?: boolean
  labelLineLength?: number
  borderColor?: string
  borderWidth?: number

  // 高级覆盖
  option?: EChartsOption
}>()

// 默认值配置
const defaultData = [
  { name: '展示', value: 100 },
  { name: '访问', value: 80 },
  { name: '咨询', value: 60 },
  { name: '订单', value: 40 },
  { name: '成交', value: 20 },
]

// 计算最终 Option
const finalOption = computed<EChartsOption>(() => {
  // 如果有高级配置 option，优先使用
  if (props.option && Object.keys(props.option).length > 0) return props.option

  const data = props.data && props.data.length ? props.data : defaultData
  const seriesName = props.seriesName || 'Funnel'

  return {
    title: {
      text: props.title || '',
      left: 'center',
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}',
    },
    legend: {
      bottom: 10,
      data: data.map((d) => d.name),
    },
    series: [
      {
        name: seriesName,
        type: 'funnel',
        left: props.left || '10%',
        top: props.top || '20%',
        bottom: props.bottom || '20%',
        width: props.width || '80%',
        min: props.min || 0,
        max: props.max || 100,
        minSize: props.minSize || '0%',
        maxSize: props.maxSize || '100%',
        sort: props.sort || 'descending',
        gap: props.gap || 2,
        label: {
          show: props.showLabel !== false,
          position: props.labelPosition || 'inside',
          formatter: props.labelFormatter || '{b}: {c}',
        },
        labelLine: {
          show: props.showLabelLine !== false,
          length: props.labelLineLength || 10,
        },
        itemStyle: {
          borderColor: props.borderColor || '#fff',
          borderWidth: props.borderWidth || 1,
        },
        emphasis: {
          label: {
            fontSize: 20,
          },
        },
        data: data,
      },
    ],
  }
})
</script>

<style scoped>
.v-funnel-chart {
  width: 100%;
  height: 100%;
}

.echart {
  width: 100%;
  height: 100%;
}
</style>
