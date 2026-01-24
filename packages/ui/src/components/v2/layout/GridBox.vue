<template>
  <div class="v-grid" :style="gridStyle">
    <slot v-if="$slots.default" />
  </div>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'

export interface GridLayoutConfig {
  columns?: number
  gap?: number
  rowGap?: number
  autoRows?: string // e.g. 'minmax(100px, auto)'
  alignItems?: 'start' | 'end' | 'center' | 'stretch'
  justifyItems?: 'start' | 'end' | 'center' | 'stretch'
}

const props = withDefaults(
  defineProps<{
    layout?: GridLayoutConfig
    // 高度，通常由外部容器控制，但作为布局容器可能需要自适应
    height?: string | number
  }>(),
  {
    layout: () => ({ columns: 2, gap: 10 }),
    height: '100%',
  },
)

const gridStyle = computed<CSSProperties>(() => {
  const { layout } = props

  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${layout.columns ?? 2}, 1fr)`,
    gap: `${layout.gap ?? 0}px ${layout.gap ?? 0}px`,
    rowGap: layout.rowGap !== undefined ? `${layout.rowGap}px` : undefined,
    gridAutoRows: layout.autoRows || 'min-content',
    alignItems: layout.alignItems || 'stretch',
    justifyItems: layout.justifyItems || 'stretch',
    height: typeof props.height === 'number' ? `${props.height}px` : props.height,
    width: '100%',
    boxSizing: 'border-box',
  }
})
</script>

<style scoped>
.v-grid {
  /* 确保网格容器自身也是干净的 */
  margin: 0;
  padding: 0;
}
</style>
