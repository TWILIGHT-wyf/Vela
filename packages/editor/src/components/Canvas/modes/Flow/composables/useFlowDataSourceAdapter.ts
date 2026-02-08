/**
 * Flow 模式数据源适配器 Composable
 *
 * 职责：
 * - 在 Editor 层处理数据源逻辑，使 Materials 组件保持纯净
 * - 根据组件的 dataSource 配置获取远程数据
 * - 将远程数据与本地 props 合并，生成最终的 resolvedProps
 *
 * 与 Free 模式的区别：
 * - Free 模式每个组件单独处理（useDataSourceAdapter 接收 Ref<NodeSchema>）
 * - Flow 模式批量处理（getResolvedProps 接收 NodeSchema）
 */
import { ref, watch, onUnmounted } from 'vue'
import type { NodeSchema } from '@vela/core'
import {
  extractNumberArray,
  extractStringArray,
  extractString,
  extractNumber,
  extract2DArray,
  extractSankeyNodes,
  extractSankeyLinks,
} from '@vela/ui'
import axios, { type AxiosRequestConfig } from 'axios'

/**
 * 数据源配置接口
 */
interface DataSourceConfig {
  enabled?: boolean
  url?: string
  method?: string
  headers?: Record<string, string>
  body?: string
  interval?: number
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
    if (dsConfig.dataPath) {
      const data = extractNumberArray(remoteData, dsConfig.dataPath)
      if (data) result.data = data
    }

    if (dsConfig.xAxisPath) {
      const xAxisData = extractStringArray(remoteData, dsConfig.xAxisPath)
      if (xAxisData) result.xAxisData = xAxisData
    }

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
    if (dsConfig.dataPath || dsConfig.valuePath) {
      const path = dsConfig.valuePath || dsConfig.dataPath
      const value = extractNumber(remoteData, path, undefined as unknown as number)
      if (value !== undefined) result.value = value
    }

    if (dsConfig.namePath) {
      const name = extractString(remoteData, dsConfig.namePath)
      if (name) result.name = name
    }

    if (dsConfig.minPath) {
      const min = extractNumber(remoteData, dsConfig.minPath, undefined as unknown as number)
      if (min !== undefined) result.min = min
    }

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
  LineChart: lineBarChartAdapter,
  BarChart: lineBarChartAdapter,
  StackedBarChart: lineBarChartAdapter,
  PieChart: pieChartAdapter,
  DoughnutChart: pieChartAdapter,
  GaugeChart: gaugeChartAdapter,
  RadarChart: radarChartAdapter,
  ScatterChart: scatterChartAdapter,
  SankeyChart: sankeyChartAdapter,
  FunnelChart: funnelChartAdapter,
}

/**
 * 默认适配器
 */
const defaultAdapter: ChartDataAdapter = (props) => props

/**
 * 解析 JSON 字符串类型的 option
 */
function parseOption(option: unknown): Record<string, unknown> | undefined {
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

/**
 * Flow 模式数据源适配器 Hook
 *
 * 与 Free 模式不同，Flow 模式使用函数式方法处理每个节点
 * 因为 Flow 模式渲染的是节点数组，而不是单个节点
 */
export function useFlowDataSourceAdapter() {
  // 缓存数据源请求结果
  const dataCache = ref<Map<string, unknown>>(new Map())
  const intervalIds = new Map<string, number>()

  /**
   * 获取数据源数据（带缓存）
   */
  async function fetchDataSource(nodeId: string, dsConfig: DataSourceConfig) {
    if (!dsConfig.enabled || !dsConfig.url) return

    try {
      const config: AxiosRequestConfig = {
        method: dsConfig.method || 'GET',
        url: dsConfig.url,
        headers: dsConfig.headers || {},
      }

      if (dsConfig.method && ['POST', 'PUT', 'DELETE'].includes(dsConfig.method) && dsConfig.body) {
        try {
          config.data = JSON.parse(dsConfig.body)
        } catch {
          return
        }
      }

      const response = await axios(config)
      dataCache.value.set(nodeId, response.data)

      // 设置定时刷新
      if (dsConfig.interval && dsConfig.interval > 0) {
        // 清除旧的定时器
        const oldIntervalId = intervalIds.get(nodeId)
        if (oldIntervalId) {
          clearInterval(oldIntervalId)
        }

        // 设置新的定时器
        const intervalId = window.setInterval(() => {
          fetchDataSource(nodeId, dsConfig)
        }, dsConfig.interval * 1000)
        intervalIds.set(nodeId, intervalId)
      }
    } catch (err) {
      console.error(`[FlowDataSourceAdapter] Fetch error for node ${nodeId}:`, err)
    }
  }

  /**
   * 获取解析后的 props
   */
  function getResolvedProps(node: NodeSchema): Record<string, unknown> {
    const baseProps = { ...node.props }

    // 处理 option 字段
    if (baseProps.option) {
      baseProps.option = parseOption(baseProps.option)
    }

    const dsConfig = node.dataSource as DataSourceConfig | undefined
    if (!dsConfig?.enabled) {
      return baseProps
    }

    // 触发数据获取（如果还没有缓存）
    if (!dataCache.value.has(node.id)) {
      fetchDataSource(node.id, dsConfig)
    }

    const remoteData = dataCache.value.get(node.id)
    if (!remoteData) {
      return baseProps
    }

    // 根据组件类型选择适配器
    const componentName = node.component || node.componentName || ''
    const adapter = adapterMap[componentName] || defaultAdapter
    return adapter(baseProps, remoteData, dsConfig)
  }

  // 清理定时器
  onUnmounted(() => {
    intervalIds.forEach((id) => clearInterval(id))
    intervalIds.clear()
  })

  return {
    getResolvedProps,
    dataCache,
  }
}
