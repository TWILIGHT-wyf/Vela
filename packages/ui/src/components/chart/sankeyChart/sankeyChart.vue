<template>
  <div class="v-sankey-chart" :style="{ width: '100%', height: '100%' }">
    <v-chart :option="finalOption" autoresize class="echart" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { SankeyChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import type { EChartsOption } from 'echarts'

// 注册 ECharts 组件
use([TitleComponent, TooltipComponent, SankeyChart, CanvasRenderer])

// Sankey 节点类型
interface SankeyNode {
  name: string
  value?: number
  depth?: number
  itemStyle?: Record<string, unknown>
}

// Sankey 连接类型
interface SankeyLink {
  source: string
  target: string
  value: number
}

// 定义标准的 Props，不含任何业务逻辑 ID
const props = defineProps<{
  // 基础数据 Props
  data?: SankeyNode[]
  links?: SankeyLink[]

  // 样式配置 Props
  title?: string
  orient?: 'horizontal' | 'vertical'
  left?: string
  top?: string
  right?: string
  bottom?: string
  nodeWidth?: number
  nodeGap?: number
  layoutIterations?: number
  nodeAlign?: 'left' | 'right' | 'justify'
  showLabel?: boolean
  labelPosition?: 'left' | 'right' | 'top' | 'bottom'
  labelFontSize?: number
  labelColor?: string
  lineColor?: string
  lineOpacity?: number
  lineCurveness?: number

  // 高级覆盖
  option?: EChartsOption
}>()

// 默认值配置
const defaultNodes: SankeyNode[] = [
  { name: 'a' },
  { name: 'b' },
  { name: 'c' },
  { name: 'd' },
  { name: 'e' },
  { name: 'f' },
]

const defaultLinks: SankeyLink[] = [
  { source: 'a', target: 'b', value: 5 },
  { source: 'a', target: 'c', value: 3 },
  { source: 'b', target: 'd', value: 8 },
  { source: 'b', target: 'e', value: 3 },
  { source: 'c', target: 'e', value: 4 },
  { source: 'd', target: 'f', value: 6 },
  { source: 'e', target: 'f', value: 5 },
]

// 计算最终 Option
const finalOption = computed<EChartsOption>(() => {
  // 如果有高级配置 option，优先使用
  if (props.option && Object.keys(props.option).length > 0) return props.option

  const data = props.data && props.data.length ? props.data : defaultNodes
  const links = props.links && props.links.length ? props.links : defaultLinks

  return {
    title: {
      text: props.title || '',
      left: 'center',
    },
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
    },
    series: [
      {
        type: 'sankey',
        data: data,
        links: links,
        emphasis: {
          focus: 'adjacency',
        },
        orient: props.orient || 'horizontal',
        left: props.left || '5%',
        top: props.top || '10%',
        right: props.right || '20%',
        bottom: props.bottom || '10%',
        nodeWidth: props.nodeWidth || 20,
        nodeGap: props.nodeGap || 8,
        layoutIterations: props.layoutIterations || 32,
        nodeAlign: props.nodeAlign || 'justify',
        label: {
          show: props.showLabel !== false,
          position: props.labelPosition || 'right',
          fontSize: props.labelFontSize || 12,
          color: props.labelColor || '#000',
        },
        lineStyle: {
          color: props.lineColor || 'source',
          opacity: props.lineOpacity || 0.2,
          curveness: props.lineCurveness || 0.5,
        },
      },
    ],
  }
})
</script>

<style scoped>
.v-sankey-chart {
  width: 100%;
  height: 100%;
}

.echart {
  width: 100%;
  height: 100%;
}
</style>
