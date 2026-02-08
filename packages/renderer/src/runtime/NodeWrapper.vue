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
  const style = props.node.style || {}
  const geometry = props.node.geometry

  if (props.layoutMode === 'free') {
    const freeGeometry = geometry?.mode === 'free' ? geometry : undefined
    // 自由布局模式：绝对定位
    return {
      position: 'absolute',
      left: formatValue(freeGeometry?.x, 0),
      top: formatValue(freeGeometry?.y, 0),
      width: formatValue((freeGeometry?.width ?? style.width) as string | number | undefined, 'auto'),
      height: formatValue((freeGeometry?.height ?? style.height) as string | number | undefined, 'auto'),
      transform: freeGeometry?.rotate ? `rotate(${freeGeometry.rotate}deg)` : undefined,
      zIndex: freeGeometry?.zIndex ?? (style.zIndex as number | undefined) ?? 0,
    } as CSSProperties
  } else {
    // 流式布局模式：文档流
    return {
      position: 'relative',
      width: formatValue((geometry?.width ?? style.width) as string | number | undefined, '100%'),
      height: formatValue((geometry?.height ?? style.height) as string | number | undefined, 'auto'),
      marginTop: formatValue(style.marginTop as string | number | undefined),
      marginBottom: formatValue(style.marginBottom as string | number | undefined),
      marginLeft: formatValue(style.marginLeft as string | number | undefined),
      marginRight: formatValue(style.marginRight as string | number | undefined),

      // Flex 配置
      flex: style.flex as string | undefined,
      display: (style.display as string) || 'block',
    } as CSSProperties
  }
})
</script>

<style scoped>
.node-wrapper {
  box-sizing: border-box;
}
</style>
