<template>
  <BaseHtml v-bind="htmlProps" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { vHtml as BaseHtml, useDataSource, extractWithFallback } from '@vela/ui'

type DataSourceLike = {
  contentField?: string
  [key: string]: unknown
}

const props = withDefaults(
  defineProps<{
    content?: string
    sanitize?: boolean
    allowedTags?: string
    allowedAttributes?: string
    padding?: number | string
    backgroundColor?: string
    textColor?: string
    fontSize?: number | string
    lineHeight?: number | string
    borderRadius?: number | string
    border?: string
    overflow?: string
    fontFamily?: string
    dataSource?: DataSourceLike
  }>(),
  {
    content: '<p>请输入 HTML 内容...</p>',
    sanitize: true,
    padding: 16,
    backgroundColor: '#ffffff',
    textColor: '#333333',
    fontSize: 14,
    lineHeight: 1.6,
    borderRadius: 0,
    border: 'none',
    overflow: 'auto',
    fontFamily: 'inherit',
  },
)

// 数据源
const dataSourceRef = computed(() => props.dataSource)
const { data: dataSourceData } = useDataSource(dataSourceRef)

// HTML 内容
const htmlContent = computed(() => {
  // 优先使用数据源
  if (dataSourceData.value) {
    const contentField: string = props.dataSource?.contentField || 'content'
    return extractWithFallback<string>(dataSourceData.value, contentField, '')
  }
  // 使用 props 中的 content
  return String(props.content || '<p>请输入 HTML 内容...</p>')
})

// 聚合 props
const htmlProps = computed(() => {
  return {
    content: htmlContent.value,
    sanitize: props.sanitize !== false,
    allowedTags: props.allowedTags ? String(props.allowedTags) : undefined,
    allowedAttributes: props.allowedAttributes ? String(props.allowedAttributes) : undefined,
    padding: props.padding,
    backgroundColor: props.backgroundColor,
    textColor: props.textColor,
    fontSize: props.fontSize,
    lineHeight: props.lineHeight,
    borderRadius: props.borderRadius,
    border: props.border,
    overflow: props.overflow,
    fontFamily: props.fontFamily,
  }
})
</script>
