<template>
  <div class="v-grid-container" :style="containerStyle">
    <slot>
      <template v-if="placeholderItems.length">
        <div v-for="(item, idx) in placeholderItems" :key="idx" class="v-grid-placeholder-item">
          {{ item }}
        </div>
      </template>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'

// 定义纯 UI Props
const props = withDefaults(
  defineProps<{
    // Grid 布局属性
    columns?: number | string
    rows?: number | string
    gap?: number | string
    rowGap?: number | string
    columnGap?: number | string
    autoFlow?: 'row' | 'column' | 'dense' | 'row dense' | 'column dense'

    // 容器样式
    padding?: number | string
    backgroundColor?: string
    borderRadius?: number | string
    minHeight?: number | string

    // 占位内容
    content?: string
    placeholderItems?: string[]
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
    placeholderItems: () => ['Grid 1', 'Grid 2', 'Grid 3'],
  },
)

function toCssLength(value: number | string | undefined, fallback = ''): string {
  if (value === undefined || value === null || value === '') {
    return fallback
  }
  if (typeof value === 'number') {
    return `${value}px`
  }
  return value
}

function toTemplate(value: number | string | undefined, fallback: string): string {
  if (value === undefined || value === null || value === '') {
    return fallback
  }
  if (typeof value === 'number') {
    return `repeat(${Math.max(1, Math.round(value))}, 1fr)`
  }
  return value
}

// 容器样式
const containerStyle = computed<CSSProperties>(() => {
  return {
    display: 'grid',
    gridTemplateColumns: toTemplate(props.columns, 'repeat(3, 1fr)'),
    gridTemplateRows: toTemplate(props.rows, 'auto'),
    gap: toCssLength(props.gap, '16px'),
    rowGap: toCssLength(props.rowGap),
    columnGap: toCssLength(props.columnGap),
    gridAutoFlow: props.autoFlow,
    padding: toCssLength(props.padding, '16px'),
    backgroundColor: props.backgroundColor,
    borderRadius: toCssLength(props.borderRadius, '4px'),
    minHeight: toCssLength(props.minHeight, '200px'),
    boxSizing: 'border-box',
  }
})

// 占位项
const placeholderItems = computed(() => {
  return props.placeholderItems
})
</script>

<style scoped>
.v-grid-container {
  box-sizing: border-box;
  width: 100%;
}

.v-grid-placeholder-item {
  padding: 12px;
  background-color: #f3f4f6;
  border-radius: 4px;
  text-align: center;
}
</style>
