<template>
  <WrappedBarChart v-bind="normalizedProps" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { vBarChart } from '@vela/ui'
import { defineMaterial, createPropsAdapter } from '../../../utils'
import type { EChartsOption } from 'echarts'

// 1. 定义 Props 适配器 (用于将旧数据结构转为新结构 - 如果有需要)
// 这里我们主要关注将新结构转为旧 UI 组件需要的扁平结构，所以 propsAdapter 主要用于处理传入 Material 的原始 props
// 但实际上，我们更需要在 normalizedProps 中做 "Config Object -> Flat Props" 的转换
const propsAdapter = createPropsAdapter({
  // 如果有旧的 flat props 传入，可以尝试在这里做初步转换，或者直接在 normalizedProps 处理
  // 这里暂时留空，依靠下面的 normalizedProps 做核心转换
})

// 2. 使用 HOC 包装
const WrappedBarChart = defineMaterial(vBarChart, {
  name: 'BarChartV2',
  connectData: true, // 启用数据源
  connectEvent: true,
  propsAdapter,
})

// 3. 定义 V2 Props 结构
interface ChartConfig {
  title?: {
    text?: string
    align?: 'left' | 'center' | 'right'
  }
  axis?: {
    x?: {
      name?: string
      data?: string[] // 静态数据
    }
    y?: {
      name?: string
    }
  }
  series?: {
    name?: string
    color?: string
    width?: string
    radius?: number
  }
  legend?: {
    show?: boolean
    position?: 'top' | 'bottom' | 'left' | 'right'
  }
  tooltip?: {
    show?: boolean
  }
}

const props = withDefaults(
  defineProps<{
    // 注入的数据 (from useDataSource)
    data?: number[]
    loading?: boolean
    error?: string | null

    // V2 配置对象
    config?: ChartConfig

    // 高级覆盖
    option?: EChartsOption

    // 兼容旧属性 (可选)
    title?: string
    seriesName?: string
  }>(),
  {
    config: () => ({}),
    data: () => [],
  },
)

// 4. 转换逻辑: Config Object + Data -> Flat UI Props
const normalizedProps = computed(() => {
  const { config, data, option } = props

  // 提取配置
  const titleText = config.title?.text || props.title
  const xAxisData = config.axis?.x?.data
  const seriesName = config.series?.name || props.seriesName
  const barColor = config.series?.color
  const barWidth = config.series?.width
  const borderRadius = config.series?.radius

  return {
    // 数据透传
    data: data,
    xAxisData: xAxisData,

    // 样式映射
    title: titleText,
    seriesName: seriesName,
    barColor: barColor,
    barWidth: barWidth,
    borderRadius: borderRadius,

    // 轴配置
    xAxisName: config.axis?.x?.name,
    yAxisName: config.axis?.y?.name,

    // 其他配置
    showLegend: config.legend?.show,
    legendPosition: config.legend?.position,
    showTooltip: config.tooltip?.show,

    // 高级配置透传
    option: option,

    // 加载状态 (UI组件可能需要处理 loading)
    // 目前 v-chart 可能没暴露 loading prop，但我们可以扩展
    loading: props.loading,
  }
})

defineOptions({
  inheritAttrs: false,
})
</script>
