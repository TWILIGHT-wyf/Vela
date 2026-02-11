<template>
  <BaseIframe v-bind="iframeProps" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { vIframe as BaseIframe, useDataSource, extractWithFallback } from '@vela/ui'

type DataSourceLike = {
  urlField?: string
  [key: string]: unknown
}

const props = withDefaults(
  defineProps<{
    src?: string
    url?: string
    title?: string
    sandbox?: string
    allow?: string
    placeholder?: string
    showMask?: boolean
    backgroundColor?: string
    borderRadius?: number
    border?: string
    opacity?: number
    dataSource?: DataSourceLike
  }>(),
  {
    src: '',
    url: '',
    title: 'iframe',
    placeholder: '请设置 iframe 地址',
    showMask: true,
    backgroundColor: '#ffffff',
    borderRadius: 0,
    border: '1px solid #dcdfe6',
    opacity: 100,
  },
)

// 数据源
const dataSourceRef = computed(() => props.dataSource)
const { data: dataSourceData } = useDataSource(dataSourceRef)

// iframe 地址
const iframeUrl = computed(() => {
  // 优先使用数据源
  if (dataSourceData.value) {
    const urlField: string = props.dataSource?.urlField || 'url'
    return extractWithFallback<string>(dataSourceData.value, urlField, '')
  }
  // 使用 props 中的 url
  return String(props.url || props.src || '')
})

// 聚合 props
const iframeProps = computed(() => {
  return {
    url: iframeUrl.value,
    title: props.title ? String(props.title) : 'iframe',
    sandbox: props.sandbox ? String(props.sandbox) : undefined,
    allow: props.allow ? String(props.allow) : undefined,
    placeholder: props.placeholder ? String(props.placeholder) : '请设置 iframe 地址',
    showMask: props.showMask,
    backgroundColor: props.backgroundColor,
    borderRadius: props.borderRadius,
    border: props.border,
    opacity: props.opacity,
  }
})
</script>
