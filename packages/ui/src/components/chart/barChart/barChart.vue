<template>
  <div class="v-bar-chart" :style="{ width: '100%', height: '100%' }">
    <v-chart :option="finalOption" autoresize class="echart" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import type { EChartsOption } from 'echarts'

// 注册 ECharts 组件
use([TitleComponent, TooltipComponent, GridComponent, LegendComponent, BarChart, CanvasRenderer])

// 定义标准的 Props，不含任何业务逻辑 ID
const props = defineProps<{
  // 基础数据 Props
  data?: number[]
  xAxisData?: string[]
  seriesName?: string

  // 样式配置 Props
  title?: string
  barColor?: string
  barWidth?: string
  borderRadius?: number | number[]
  showTooltip?: boolean
  showLegend?: boolean
  legendPosition?: 'top' | 'bottom' | 'left' | 'right'
  showGrid?: boolean
  xAxisName?: string
  yAxisName?: string
  showXAxisLine?: boolean
  showXAxisLabel?: boolean
  showYAxisLine?: boolean
  showYAxisLabel?: boolean
  showLabel?: boolean

  // 高级覆盖
  option?: EChartsOption
}>()

// 默认值配置
const defaultData = [120, 200, 150, 180, 270, 210, 220]
const defaultXAxis = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// 计算最终 Option
const finalOption = computed<EChartsOption>(() => {
  // 如果有高级配置 option，优先使用
  if (props.option && Object.keys(props.option).length > 0) return props.option

  const data = props.data && props.data.length ? props.data : defaultData
  const xAxisData = props.xAxisData && props.xAxisData.length ? props.xAxisData : defaultXAxis
  const seriesName = props.seriesName || 'Series'

  return {
    // 标题
    title: props.title
      ? {
          text: props.title,
          left: 'center',
          textStyle: {
            fontSize: 16,
          },
        }
      : undefined,

    // 提示框
    tooltip:
      props.showTooltip !== false
        ? {
            trigger: 'axis',
            axisPointer: {
              type: 'shadow',
            },
          }
        : undefined,

    // 图例
    legend:
      props.showLegend !== false
        ? {
            [(props.legendPosition as string) || 'top']: 10,
            data: [seriesName],
          }
        : undefined,

    // 网格
    grid: {
      left: '6%',
      right: '6%',
      bottom: '8%',
      top: props.title ? '15%' : '10%',
      containLabel: true,
      show: props.showGrid !== false,
    },

    // X 轴
    xAxis: {
      type: 'category',
      data: xAxisData,
      name: props.xAxisName || '',
      nameLocation: 'middle',
      nameGap: 30,
      axisLine: {
        show: props.showXAxisLine !== false,
      },
      axisLabel: {
        show: props.showXAxisLabel !== false,
      },
      splitLine: {
        show: false,
      },
    },

    // Y 轴
    yAxis: {
      type: 'value',
      name: props.yAxisName || '',
      nameLocation: 'middle',
      nameGap: 50,
      axisLine: {
        show: props.showYAxisLine !== false,
      },
      axisLabel: {
        show: props.showYAxisLabel !== false,
      },
      splitLine: {
        show: props.showGrid !== false,
      },
    },

    // 系列
    series: [
      {
        name: seriesName,
        type: 'bar',
        data: data,
        barWidth: props.barWidth || '60%',
        itemStyle: {
          color: props.barColor || '#5470c6',
          borderRadius: props.borderRadius || 0,
        },
        label: props.showLabel
          ? {
              show: true,
              position: 'top',
              fontSize: 12,
            }
          : undefined,
      },
    ],
  }
})
</script>

<style scoped>
.v-bar-chart {
  width: 100%;
  height: 100%;
}
</style>
