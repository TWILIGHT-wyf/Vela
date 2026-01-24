<template>
  <div class="v-stacked-bar-chart" :style="{ width: '100%', height: '100%' }">
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
  xAxisData?: string[]
  seriesNames?: string[]
  seriesData?: number[][]

  // 样式配置 Props
  title?: string
  colors?: string[]
  barWidth?: string
  borderRadius?: number
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
const defaultXAxis = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const defaultSeriesNames = ['Series 1', 'Series 2', 'Series 3']
const defaultSeriesData = [
  [120, 132, 101, 134, 90, 230, 210],
  [220, 182, 191, 234, 290, 330, 310],
  [150, 232, 201, 154, 190, 330, 410],
]
const defaultColors = ['#5470c6', '#91cc75', '#fac858']

// 计算最终 Option
const finalOption = computed<EChartsOption>(() => {
  // 如果有高级配置 option，优先使用
  if (props.option && Object.keys(props.option).length > 0) return props.option

  const xAxisData = props.xAxisData && props.xAxisData.length ? props.xAxisData : defaultXAxis
  const seriesNames =
    props.seriesNames && props.seriesNames.length ? props.seriesNames : defaultSeriesNames
  const seriesData =
    props.seriesData && props.seriesData.length ? props.seriesData : defaultSeriesData
  const colors = props.colors && props.colors.length ? props.colors : defaultColors

  return {
    color: colors,
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
            data: seriesNames,
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
    series: seriesData.map((data, index) => ({
      name: seriesNames[index] || `Series ${index + 1}`,
      type: 'bar',
      stack: 'total',
      data: data,
      barWidth: props.barWidth || '60%',
      itemStyle: {
        borderRadius: index === seriesData.length - 1 ? props.borderRadius || 0 : 0,
      },
      label: props.showLabel
        ? {
            show: true,
            position: 'inside',
            fontSize: 12,
          }
        : undefined,
    })),
  }
})
</script>

<style scoped>
.v-stacked-bar-chart {
  width: 100%;
  height: 100%;
}
</style>
