/**
 * 数据源适配器 Composable
 *
 * 职责：
 * - 在 Editor 层处理数据源逻辑，使 Materials 组件保持纯净
 * - 根据组件的 dataSource 配置获取远程数据
 * - 将远程数据与本地 props 合并，生成最终的 resolvedProps
 *
 * 设计原则：
 * - Materials 组件只接收 props，不知道数据源的存在
 * - 数据源适配逻辑集中在 Editor 层
 * - 支持不同组件类型的数据映射规则
 */
import { computed, type Ref } from 'vue'
import type { NodeSchema } from '@vela/core'
import {
  useDataSource,
  extractNumberArray,
  extractStringArray,
  extractString,
  extractNumber,
  extract2DArray,
  extractSankeyNodes,
  extractSankeyLinks,
} from '@vela/ui'
import { useComponent } from '@/stores/component'

/**
 * 数据源配置接口（扩展 NodeSchema 的 dataSource）
 */
interface DataSourceConfig {
  enabled?: boolean
  url?: string
  method?: string
  headers?: Record<string, string>
  body?: string
  interval?: number
  // 数据路径映射
  dataPath?: string
  xAxisPath?: string
  seriesNamePath?: string
  labelsPath?: string
  valuePath?: string
  namePath?: string
  minPath?: string
  maxPath?: string
  nodesPath?: string
  linksPath?: string
}

/**
 * 图表类型到数据适配器的映射
 */
type ChartDataAdapter = (
  props: Record<string, unknown>,
  remoteData: unknown,
  dsConfig: DataSourceConfig,
) => Record<string, unknown>

/**
 * 折线图 / 柱状图数据适配
 */
const lineBarChartAdapter: ChartDataAdapter = (props, remoteData, dsConfig) => {
  const result = { ...props }

  if (remoteData && dsConfig.enabled) {
    // 提取 Y 轴数据
    if (dsConfig.dataPath) {
      const data = extractNumberArray(remoteData, dsConfig.dataPath)
      if (data) result.data = data
    }

    // 提取 X 轴数据
    if (dsConfig.xAxisPath) {
      const xAxisData = extractStringArray(remoteData, dsConfig.xAxisPath)
      if (xAxisData) result.xAxisData = xAxisData
    }

    // 提取系列名称
    if (dsConfig.seriesNamePath) {
      const seriesName = extractString(remoteData, dsConfig.seriesNamePath)
      if (seriesName) result.seriesName = seriesName
    }
  }

  return result
}

/**
 * 饼图数据适配
 */
const pieChartAdapter: ChartDataAdapter = (props, remoteData, dsConfig) => {
  const result = { ...props }

  if (remoteData && dsConfig.enabled) {
    const values = extractNumberArray(remoteData, dsConfig.dataPath)
    const labels = extractStringArray(remoteData, dsConfig.labelsPath)

    if (values || labels) {
      const defaultLabels = (idx: number) => `Category ${idx + 1}`
      const finalValues = values || []
      const finalLabels = labels || finalValues.map((_, idx) => defaultLabels(idx))
      const len = Math.min(finalValues.length, finalLabels.length)

      result.data = finalLabels.slice(0, len).map((name, idx) => ({
        name,
        value: finalValues[idx] || 0,
      }))
    }
  }

  return result
}

/**
 * 仪表盘数据适配
 */
const gaugeChartAdapter: ChartDataAdapter = (props, remoteData, dsConfig) => {
  const result = { ...props }

  if (remoteData && dsConfig.enabled) {
    // 提取值
    if (dsConfig.dataPath || dsConfig.valuePath) {
      const path = dsConfig.valuePath || dsConfig.dataPath
      const value = extractNumber(remoteData, path, undefined as unknown as number)
      if (value !== undefined) result.value = value
    }

    // 提取名称
    if (dsConfig.namePath) {
      const name = extractString(remoteData, dsConfig.namePath)
      if (name) result.name = name
    }

    // 提取最小值
    if (dsConfig.minPath) {
      const min = extractNumber(remoteData, dsConfig.minPath, undefined as unknown as number)
      if (min !== undefined) result.min = min
    }

    // 提取最大值
    if (dsConfig.maxPath) {
      const max = extractNumber(remoteData, dsConfig.maxPath, undefined as unknown as number)
      if (max !== undefined) result.max = max
    }
  }

  return result
}

/**
 * 雷达图数据适配
 */
const radarChartAdapter: ChartDataAdapter = (props, remoteData, dsConfig) => {
  const result = { ...props }

  if (remoteData && dsConfig.enabled) {
    if (dsConfig.dataPath) {
      const data = extractNumberArray(remoteData, dsConfig.dataPath)
      if (data) result.data = data
    }

    if (dsConfig.labelsPath) {
      const indicator = extractStringArray(remoteData, dsConfig.labelsPath)
      if (indicator) result.indicator = indicator.map((name) => ({ name, max: 100 }))
    }
  }

  return result
}

/**
 * 散点图数据适配
 */
const scatterChartAdapter: ChartDataAdapter = (props, remoteData, dsConfig) => {
  const result = { ...props }

  if (remoteData && dsConfig.enabled && dsConfig.dataPath) {
    const data = extract2DArray(remoteData, dsConfig.dataPath)
    if (data) result.data = data
  }

  return result
}

/**
 * 桑基图数据适配
 */
const sankeyChartAdapter: ChartDataAdapter = (props, remoteData, dsConfig) => {
  const result = { ...props }

  if (remoteData && dsConfig.enabled) {
    if (dsConfig.nodesPath) {
      const nodes = extractSankeyNodes(remoteData, dsConfig.nodesPath)
      if (nodes) result.nodes = nodes
    }

    if (dsConfig.linksPath) {
      const links = extractSankeyLinks(remoteData, dsConfig.linksPath)
      if (links) result.links = links
    }
  }

  return result
}

/**
 * 漏斗图数据适配
 */
const funnelChartAdapter: ChartDataAdapter = (props, remoteData, dsConfig) => {
  const result = { ...props }

  if (remoteData && dsConfig.enabled) {
    const values = extractNumberArray(remoteData, dsConfig.dataPath)
    const labels = extractStringArray(remoteData, dsConfig.labelsPath)

    if (values || labels) {
      const finalValues = values || []
      const finalLabels = labels || finalValues.map((_, idx) => `Step ${idx + 1}`)
      const len = Math.min(finalValues.length, finalLabels.length)

      result.data = finalLabels.slice(0, len).map((name, idx) => ({
        name,
        value: finalValues[idx] || 0,
      }))
    }
  }

  return result
}

/**
 * 组件名称到适配器的映射
 */
const adapterMap: Record<string, ChartDataAdapter> = {
  // 折线图系列
  LineChart: lineBarChartAdapter,
  // 柱状图系列
  BarChart: lineBarChartAdapter,
  StackedBarChart: lineBarChartAdapter,
  // 饼图系列
  PieChart: pieChartAdapter,
  DoughnutChart: pieChartAdapter,
  // 仪表盘
  GaugeChart: gaugeChartAdapter,
  // 雷达图
  RadarChart: radarChartAdapter,
  // 散点图
  ScatterChart: scatterChartAdapter,
  // 桑基图
  SankeyChart: sankeyChartAdapter,
  // 漏斗图
  FunnelChart: funnelChartAdapter,
}

/**
 * 默认适配器（直接返回 props）
 */
const defaultAdapter: ChartDataAdapter = (props) => props

/**
 * 数据源适配器 Hook
 *
 * @param node - 组件节点的响应式引用
 * @returns resolvedProps - 合并数据源后的最终 props
 */
export function useDataSourceAdapter(node: Ref<NodeSchema>) {
  const componentStore = useComponent()

  // 获取数据源配置
  const dataSourceConfig = computed(() => node.value.dataSource as DataSourceConfig | undefined)

  // 使用 useDataSource 获取远程数据
  const { data: remoteData, loading, error } = useDataSource(dataSourceConfig)

  // 解析 JSON 字符串类型的 option
  const parseOption = (option: unknown): Record<string, unknown> | undefined => {
    if (!option) return undefined
    if (typeof option === 'string') {
      try {
        return JSON.parse(option)
      } catch {
        return undefined
      }
    }
    return option as Record<string, unknown>
  }

  // 计算最终的 props
  const resolvedProps = computed(() => {
    // 订阅 styleVersion 以触发响应式更新
    // 当 props 或 style 通过 store 更新时，styleVersion 会递增
    const _v = componentStore.styleVersion[node.value.id]

    const baseProps = { ...node.value.props }

    // 处理 option 字段（可能是 JSON 字符串）
    if (baseProps.option) {
      baseProps.option = parseOption(baseProps.option)
    }

    // 如果没有启用数据源，直接返回基础 props
    const dsConfig = dataSourceConfig.value
    if (!dsConfig?.enabled || !remoteData.value) {
      return baseProps
    }

    // 根据组件类型选择适配器
    const adapter = adapterMap[node.value.componentName] || defaultAdapter
    return adapter(baseProps, remoteData.value, dsConfig)
  })

  return {
    resolvedProps,
    loading,
    error,
    remoteData,
  }
}
