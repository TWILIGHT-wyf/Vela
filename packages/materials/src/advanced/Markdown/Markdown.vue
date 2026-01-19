<template>
  <BaseMarkdown v-bind="markdownProps" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useComponent } from '@vela/editor/stores/component'
import { vMarkdown as BaseMarkdown, useDataSource, extractWithFallback } from '@vela/ui'

const props = defineProps<{
  id: string
}>()

const { componentStore } = storeToRefs(useComponent())

const comp = computed(() => componentStore.value.find((c) => c.id === props.id))

// 数据源
const dataSourceRef = computed(() => comp.value?.dataSource)
const { data: dataSourceData } = useDataSource(dataSourceRef)

// Markdown 内容
const markdownContent = computed(() => {
  // 优先使用数据源
  if (dataSourceData.value) {
    const contentField: string = (comp.value?.dataSource?.contentField as string) || 'content'
    return extractWithFallback<string>(dataSourceData.value, contentField, '')
  }
  // 使用 props 中的 content
  return String(comp.value?.props?.content || '# Markdown 内容\n\n请输入 Markdown 文本...')
})

// 聚合 props
const markdownProps = computed(() => {
  const s = comp.value?.style || {}

  return {
    content: markdownContent.value,
    padding: s.padding || 16,
    backgroundColor: s.backgroundColor || '#ffffff',
    textColor: s.textColor || '#333333',
    fontSize: s.fontSize || 14,
    lineHeight: s.lineHeight || 1.6,
    borderRadius: s.borderRadius || 0,
    border: s.border || 'none',
    fontFamily: s.fontFamily || 'inherit',
  }
})
</script>
