<script setup lang="ts">
import { computed, useSlots } from 'vue'
import type { CSSProperties } from 'vue'
import { vGrid as BaseGrid } from '@vela/ui'

/**
 * Grid 布局容器组件
 *
 * 在新的 NodeSchema 架构中，子组件通过 slot 传入，
 * 由 RuntimeRenderer 或 UniversalRenderer 负责渲染
 */
const props = withDefaults(
  defineProps<{
    gridTemplateColumns?: string
    gridTemplateRows?: string
    gridGap?: number | string
    gridAutoFlow?: string
    padding?: number | string
    backgroundColor?: string
    border?: string
    borderRadius?: number | string
    minHeight?: number | string
    textColor?: string
    content?: string
  }>(),
  {
    gridTemplateColumns: 'repeat(3, 1fr)',
    gridTemplateRows: 'auto',
    gridGap: 16,
    gridAutoFlow: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 4,
    minHeight: 200,
    textColor: '#333333',
  },
)

const slots = useSlots()
const hasChildren = computed(() => !!slots.default)

// 聚合所有 Props 传递给 Base 组件
const gridProps = computed((): Record<string, unknown> => {
  return {
    // Grid 布局属性
    gridTemplateColumns: props.gridTemplateColumns,
    gridTemplateRows: props.gridTemplateRows,
    gridGap: props.gridGap,
    gridAutoFlow: props.gridAutoFlow,
    // 容器样式
    padding: props.padding,
    backgroundColor: props.backgroundColor,
    border: props.border,
    borderRadius: props.borderRadius,
    minHeight: props.minHeight,
    textColor: props.textColor,
    // 占位内容（仅当没有子组件时显示）
    content: hasChildren.value ? undefined : props.content,
    placeholderItems: hasChildren.value ? [] : undefined,
  }
})
</script>

<template>
  <BaseGrid v-bind="gridProps">
    <!-- 子组件通过 slot 渲染（由 RuntimeRenderer/UniversalRenderer 处理） -->
    <slot />
  </BaseGrid>
</template>

<style scoped>
/* Grid 容器基础样式由 vGrid 组件提供 */
</style>
