<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { vGrid as BaseGrid } from '@vela/ui'

/**
 * Grid 布局容器组件
 *
 * 在新的 NodeSchema 架构中，子组件通过 slot 传入，
 * 由 RuntimeRenderer 或 UniversalRenderer 负责渲染
 */
const props = withDefaults(
  defineProps<{
    columns?: number | string
    rows?: number | string
    gap?: number | string
    rowGap?: number | string
    columnGap?: number | string
    autoFlow?: string
    padding?: string | number
    backgroundColor?: string
    borderRadius?: string | number
    minHeight?: string | number
    content?: string
  }>(),
  {
    columns: 'repeat(3, 1fr)',
    rows: 'auto',
    gap: '16px',
    rowGap: '',
    columnGap: '',
    autoFlow: 'row',
    padding: '16px',
    backgroundColor: '#ffffff',
    borderRadius: '4px',
    minHeight: '200px',
  },
)

const slots = useSlots()
const hasChildren = computed(() => !!slots.default)

// 聚合所有 Props 传递给 Base 组件
const gridProps = computed((): Record<string, unknown> => {
  return {
    // Grid 布局属性
    columns: props.columns,
    rows: props.rows,
    gap: props.gap,
    rowGap: props.rowGap,
    columnGap: props.columnGap,
    autoFlow: props.autoFlow,
    // 容器样式
    padding: props.padding,
    backgroundColor: props.backgroundColor,
    borderRadius: props.borderRadius,
    minHeight: props.minHeight,
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
