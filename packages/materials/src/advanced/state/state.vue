<template>
  <BaseState v-bind="componentProps" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { vState as BaseState, useDataSource, extractWithFallback } from '@vela/ui'

type DataSourceLike = {
  stateField?: string
  [key: string]: unknown
}

const props = withDefaults(
  defineProps<{
    title?: string
    state?: string | Record<string, unknown>
    stateData?: Record<string, unknown>
    initialState?: Record<string, unknown>
    viewMode?: 'list' | 'json' | 'table'
    placeholder?: string
    padding?: number
    backgroundColor?: string
    textColor?: string
    fontSize?: number
    lineHeight?: number
    borderRadius?: number
    border?: string
    fontFamily?: string
    dataSource?: DataSourceLike
  }>(),
  {
    title: '状态管理器',
    state: '{}',
    stateData: () => ({}),
    initialState: () => ({}),
    viewMode: 'list',
    placeholder: '暂无状态数据',
    padding: 16,
    backgroundColor: '#2d2d2d',
    textColor: '#cccccc',
    fontSize: 14,
    lineHeight: 1.6,
    borderRadius: 4,
    border: '1px solid #3c3c3c',
    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
  },
)

const dataSourceRef = computed(() => props.dataSource)
const { data: dataSourceData } = useDataSource(dataSourceRef)

const resolvedStateData = computed<Record<string, unknown>>(() => {
  if (dataSourceData.value) {
    const stateField = props.dataSource?.stateField || 'state'
    return extractWithFallback<Record<string, unknown>>(dataSourceData.value, stateField, {})
  }

  if (props.stateData && Object.keys(props.stateData).length > 0) {
    return props.stateData
  }

  if (props.initialState && Object.keys(props.initialState).length > 0) {
    return props.initialState
  }

  if (typeof props.state === 'object' && props.state !== null) {
    return props.state
  }

  const stateStr = String(props.state || '{}')
  try {
    return JSON.parse(stateStr) as Record<string, unknown>
  } catch {
    return {}
  }
})

const componentProps = computed(() => ({
  title: props.title,
  stateData: resolvedStateData.value,
  viewMode: props.viewMode,
  placeholder: props.placeholder,
  padding: props.padding,
  backgroundColor: props.backgroundColor,
  textColor: props.textColor,
  fontSize: props.fontSize,
  lineHeight: props.lineHeight,
  borderRadius: props.borderRadius,
  border: props.border,
  fontFamily: props.fontFamily,
}))
</script>
