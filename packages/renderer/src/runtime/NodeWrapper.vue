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
import { computed } from 'vue'
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

const wrapperStyle = computed(() => {
  const layout = props.node.style

  if (props.layoutMode === 'free') {
    // 自由布局模式：绝对定位
    // 注意：单位默认 px，也可以支持 %
    return {
      position: 'absolute',
      left: `${layout?.x ?? 0}px`,
      top: `${layout?.y ?? 0}px`,
      width: `${layout?.width ?? 100}px`,
      height: `${layout?.height ?? 32}px`,
      transform: layout?.rotate ? `rotate(${layout.rotate}deg)` : undefined,
      zIndex: layout?.zIndex ?? 0,

      // 调试用边框 (选中时)
      // outline: props.selected ? '2px solid #409eff' : undefined
    }
  } else {
    // 流式布局模式：文档流
    return {
      position: 'relative',
      width: layout?.width
        ? typeof layout.width === 'number'
          ? `${layout.width}px`
          : layout.width
        : '100%',
      height: layout?.height
        ? typeof layout.height === 'number'
          ? `${layout.height}px`
          : layout.height
        : undefined,
      marginTop: layout?.marginTop ? `${layout.marginTop}px` : undefined,
      marginBottom: layout?.marginBottom ? `${layout.marginBottom}px` : undefined,
      marginLeft: layout?.marginLeft ? `${layout.marginLeft}px` : undefined,
      marginRight: layout?.marginRight ? `${layout.marginRight}px` : undefined,

      // Flex 配置
      flex: layout?.flex,
      display: layout?.display || 'block',
    }
  }
})
</script>

<style scoped>
.node-wrapper {
  box-sizing: border-box;
  /* 确保内容不会溢出 wrapper */
  /* overflow: hidden; */
}
</style>
