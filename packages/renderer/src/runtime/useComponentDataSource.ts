import { computed, toRef, type Ref } from 'vue'
import type { Component } from '@vela/core/types/components'
import {
  useDataSource,
  extractWithFallback,
  extractNumber,
  extractStringArray,
  extractNumberArray,
  getValueByPath,
  // Charts utils
  extractSankeyNodes,
  extractSankeyLinks,
  extract2DArray,
} from '@vela/ui'

/**
 * 运行时数据源处理 Hook
 * 负责从 dataSource 配置中获取数据，并根据组件类型映射到 props
 */
export function useComponentDataSource(component: Ref<any>) {
  const dataSourceRef = computed(() => component.value.dataSource)
  const { data: remoteData } = useDataSource(dataSourceRef)

  const dataSourceProps = computed(() => {
    const comp = component.value
    const ds = comp.dataSource
    const data = remoteData.value

    if (!ds?.enabled || !data) {
      return {}
    }

    const type = comp.type || comp.componentName
    const props: Record<string, unknown> = {}

    try {
      // 1. 通用映射 (如果配置了 generic mapping)
      // TODO: Schema 支持 fields 映射配置

      // 2. 组件特定映射
      switch (type) {
        case 'Text':
        case 'KpiText': // 兼容旧名
          props.content = extractWithFallback(data, ds.dataPath, comp.props?.content)
          break

        case 'Image':
          if (ds.urlField) props.src = extractWithFallback(data, ds.urlField, comp.props?.src)
          break

        case 'Video':
          if (ds.urlField) props.url = extractWithFallback(data, ds.urlField, comp.props?.url)
          if (ds.posterField)
            props.poster = extractWithFallback(data, ds.posterField, comp.props?.poster)
          break

        case 'Iframe':
          if (ds.urlField) props.url = extractWithFallback(data, ds.urlField, comp.props?.url)
          break

        case 'Html':
        case 'Markdown':
          if (ds.contentField)
            props.content = extractWithFallback(data, ds.contentField, comp.props?.content)
          break

        case 'Progress':
          if (ds.valuePath)
            props.percentage = extractNumber(data, ds.valuePath, comp.props?.percentage as number)
          if (ds.statusPath)
            props.status = extractWithFallback(data, ds.statusPath, comp.props?.status)
          break

        case 'Stat':
          if (ds.titlePath) props.title = extractWithFallback(data, ds.titlePath, comp.props?.title)
          if (ds.valuePath)
            props.value = extractNumber(data, ds.valuePath, comp.props?.value as number)
          if (ds.changePath)
            props.change = extractNumber(data, ds.changePath, comp.props?.change as number)
          break

        // Charts
        case 'StackedBarChart':
        case 'BarChart':
        case 'LineChart':
          if (ds.xAxisPath) props.xAxisData = extractStringArray(data, ds.xAxisPath)
          if (ds.seriesNamesPath) props.seriesNames = extractStringArray(data, ds.seriesNamesPath)
          if (ds.seriesDataPath) props.seriesData = getValueByPath(data, ds.seriesDataPath)
          break

        case 'PieChart':
        case 'DoughnutChart':
        case 'FunnelChart':
          if (ds.dataPath) {
            const values = extractNumberArray(data, ds.dataPath)
            const labels = extractStringArray(data, ds.labelsPath)
            if (values && labels) {
              // Combine to [{name, value}]
              const len = Math.min(values.length, labels.length)
              props.data = labels.slice(0, len).map((name, i) => ({ name, value: values[i] }))
            } else if (ds.dataPath) {
              // Try generic extraction if path points to array of objects
              props.data = getValueByPath(data, ds.dataPath)
            }
          }
          break

        case 'ScatterChart':
          if (ds.dataPath) props.data = extract2DArray(data, ds.dataPath)
          break

        case 'SankeyChart':
          if (ds.nodesPath) props.data = extractSankeyNodes(data, ds.nodesPath) // Prop name is 'data' for nodes in some charts
          if (ds.linksPath) props.links = extractSankeyLinks(data, ds.linksPath)
          break

        case 'Table':
        case 'List':
        case 'Timeline':
        case 'CardGrid':
        case 'Pivot':
          // Most list/table components expect 'data' prop
          if (ds.dataPath) props.data = getValueByPath(data, ds.dataPath)
          break

        case 'Select':
        case 'MultiSelect':
        case 'CheckboxGroup':
        case 'RadioGroup':
          // Option based components
          if (ds.dataPath) {
            const list = getValueByPath(data, ds.dataPath)
            if (Array.isArray(list)) {
              // Map to options
              const labelField = (comp.props?.labelField as string) || 'label'
              const valueField = (comp.props?.valueField as string) || 'value'
              props.options = list.map((item) => {
                if (typeof item !== 'object') return { label: String(item), value: String(item) }
                return {
                  label: item[labelField],
                  value: item[valueField],
                }
              })
            }
          }
          break
      }
    } catch (e) {
      console.warn('[useComponentDataSource] Error adapting data:', e)
    }

    return props
  })

  return { dataSourceProps }
}
