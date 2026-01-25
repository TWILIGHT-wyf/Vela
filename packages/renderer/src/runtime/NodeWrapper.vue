<template>
  <div
    class="node-wrapper"
    :class="{ 'is-selected': selected }"
    :style="wrapperStyle"
    :data-node-id="node.id"
    @mousedown="handleMouseDown"
  >
    <slot v-if="$slots.default" />
  </div>
</template>

<script setup lang="ts">
import { computed, type CSSProperties, type StyleValue } from 'vue'
import type { NodeSchema } from '@vela/core'

const props = defineProps<{
  node: NodeSchema
  layoutMode: 'free' | 'flow'
  selected?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
}>()

const handleMouseDown = (e: MouseEvent) => {
  // 阻止冒泡，避免触发画布的框选/平移
  e.stopPropagation()
  emit('select', props.node.id)
}

// Helper to format style values
const formatValue = (
  val: string | number | undefined,
  defaultValue: number | string = 0,
): string => {
  if (val === undefined || val === null) {
    return typeof defaultValue === 'number' ? `${defaultValue}px` : defaultValue
  }
  if (typeof val === 'number') {
    return `${val}px`
  }
  // Check if string has unit
  if (/^\d+(\.\d+)?(px|%|em|rem|vw|vh)$/.test(val) || val === 'auto') {
    return val
  }
  // If string is a number without unit, assume px
  if (!isNaN(parseFloat(val))) {
    return `${val}px`
  }
  return val
}

const wrapperStyle = computed<StyleValue>(() => {
  const layout = props.node.style || {}

  if (props.layoutMode === 'free') {
    // 自由布局模式：绝对定位
    return {
      position: 'absolute',
      left: formatValue(layout.x as string | number | undefined, 0),
      top: formatValue(layout.y as string | number | undefined, 0),
      width: formatValue(layout.width as string | number | undefined, 'auto'),
      height: formatValue(layout.height as string | number | undefined, 'auto'),
      transform: layout.rotate ? `rotate(${layout.rotate}deg)` : undefined,
      zIndex: (layout.zIndex as number | undefined) ?? 0,
    } as CSSProperties
  } else {
    // 流式布局模式：文档流
    return {
      position: 'relative',
      width: formatValue(layout.width as string | number | undefined, '100%'),
      height: formatValue(layout.height as string | number | undefined, 'auto'),
      marginTop: formatValue(layout.marginTop as string | number | undefined),
      marginBottom: formatValue(layout.marginBottom as string | number | undefined),
      marginLeft: formatValue(layout.marginLeft as string | number | undefined),
      marginRight: formatValue(layout.marginRight as string | number | undefined),

      // Flex 配置
      flex: layout.flex as string | undefined,
      display: (layout.display as string) || 'block',
    } as CSSProperties
  }
})
</script>

<style scoped>
.node-wrapper {
  box-sizing: border-box;
}
</style>
