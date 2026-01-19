<template>
  <BaseIframe v-bind="iframeProps" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useComponent } from '@vela/editor/stores/component'
import { vIframe as BaseIframe, useDataSource, extractWithFallback } from '@vela/ui'

const props = defineProps<{
  id: string
}>()

const { componentStore } = storeToRefs(useComponent())

const comp = computed(() => componentStore.value.find((c) => c.id === props.id))

// 数据源
const dataSourceRef = computed(() => comp.value?.dataSource)
const { data: dataSourceData } = useDataSource(dataSourceRef)

// iframe 地址
const iframeUrl = computed(() => {
  // 优先使用数据源
  if (dataSourceData.value) {
    const urlField: string = (comp.value?.dataSource?.urlField as string) || 'url'
    return extractWithFallback<string>(dataSourceData.value, urlField, '')
  }
  // 使用 props 中的 url
  return String(comp.value?.props?.url || '')
})

// 聚合 props
const iframeProps = computed(() => {
  const p = comp.value?.props || {}
  const s = comp.value?.style || {}

  return {
    url: iframeUrl.value,
    title: p.title ? String(p.title) : 'iframe',
    sandbox: p.sandbox ? String(p.sandbox) : undefined,
    allow: p.allow ? String(p.allow) : undefined,
    placeholder: p.placeholder ? String(p.placeholder) : '请设置 iframe 地址',
    showMask: true, // 编辑模式默认显示遮罩
    backgroundColor: s.backgroundColor || '#ffffff',
    borderRadius: s.borderRadius || 0,
    border: s.border || '1px solid #dcdfe6',
    opacity: s.opacity || 100,
  }
})
</script>
