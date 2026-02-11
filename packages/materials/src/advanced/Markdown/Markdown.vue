<template>
  <BaseMarkdown v-bind="markdownProps" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { vMarkdown as BaseMarkdown, useDataSource, extractWithFallback } from '@vela/ui'

type DataSourceLike = {
  contentField?: string
  [key: string]: unknown
}

const props = withDefaults(
  defineProps<{
    content?: string
    padding?: number | string
    backgroundColor?: string
    textColor?: string
    fontSize?: number | string
    lineHeight?: number | string
    borderRadius?: number | string
    border?: string
    fontFamily?: string
    dataSource?: DataSourceLike
  }>(),
  {
    content: '# Markdown 内容\n\n请输入 Markdown 文本...',
    padding: 16,
    backgroundColor: '#ffffff',
    textColor: '#333333',
    fontSize: 14,
    lineHeight: 1.6,
    borderRadius: 0,
    border: 'none',
    fontFamily: 'inherit',
  },
)

// 数据源
const dataSourceRef = computed(() => props.dataSource)
const { data: dataSourceData } = useDataSource(dataSourceRef)

// Markdown 内容
const markdownContent = computed(() => {
  // 优先使用数据源
  if (dataSourceData.value) {
    const contentField: string = props.dataSource?.contentField || 'content'
    return extractWithFallback<string>(dataSourceData.value, contentField, '')
  }
  // 使用 props 中的 content
  return String(props.content || '# Markdown 内容\n\n请输入 Markdown 文本...')
})

// 聚合 props
const markdownProps = computed(() => {
  return {
    content: markdownContent.value,
    padding: props.padding,
    backgroundColor: props.backgroundColor,
    textColor: props.textColor,
    fontSize: props.fontSize,
    lineHeight: props.lineHeight,
    borderRadius: props.borderRadius,
    border: props.border,
    fontFamily: props.fontFamily,
  }
})
</script>
