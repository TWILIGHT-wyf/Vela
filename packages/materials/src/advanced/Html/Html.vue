<template>
  <BaseHtml v-bind="htmlProps" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useComponent } from '@vela/editor/stores/component'
import { vHtml as BaseHtml, useDataSource, extractWithFallback } from '@vela/ui'

const props = defineProps<{
  id: string
}>()

const { componentStore } = storeToRefs(useComponent())

const comp = computed(() => componentStore.value.find((c) => c.id === props.id))

// 数据源
const dataSourceRef = computed(() => comp.value?.dataSource)
const { data: dataSourceData } = useDataSource(dataSourceRef)

// HTML 内容
const htmlContent = computed(() => {
  // 优先使用数据源
  if (dataSourceData.value) {
    const contentField: string = (comp.value?.dataSource?.contentField as string) || 'content'
    return extractWithFallback<string>(dataSourceData.value, contentField, '')
  }
  // 使用 props 中的 content
  return String(comp.value?.props?.content || '<p>请输入 HTML 内容...</p>')
})

// 聚合 props
const htmlProps = computed(() => {
  const p = comp.value?.props || {}
  const s = comp.value?.style || {}

  return {
    content: htmlContent.value,
    sanitize: p.sanitize !== false,
    allowedTags: p.allowedTags ? String(p.allowedTags) : undefined,
    allowedAttributes: p.allowedAttributes ? String(p.allowedAttributes) : undefined,
    padding: s.padding || 16,
    backgroundColor: s.backgroundColor || '#ffffff',
    textColor: s.textColor || '#333333',
    fontSize: s.fontSize || 14,
    lineHeight: s.lineHeight || 1.6,
    borderRadius: s.borderRadius || 0,
    border: s.border || 'none',
    overflow: s.overflow || 'auto',
    fontFamily: s.fontFamily || 'inherit',
  }
})
</script>
