<template>
  <div class="snap-lines-layer">
    <div
      v-for="(line, i) in lines"
      :key="i"
      class="snap-line"
      :class="`is-${line.type}`"
      :style="getStyle(line)"
    />
  </div>
</template>

<script setup lang="ts">
import type { SnapLine } from '@/composables/useSnap'
import { useCanvasStore } from '@/stores/canvas'

const props = defineProps<{
  lines: SnapLine[]
}>()

const canvasStore = useCanvasStore()

const getStyle = (line: SnapLine) => {
  // 坐标已经是在 transform layer 内部的，所以直接使用 px
  // 或者是相对于 canvas 的？
  // useSnap 计算的是 node layout (canvas local coords)
  // 如果 SnapLines 放在 transform-layer 内部，则直接使用 position

  if (line.type === 'v') {
    return {
      left: `${line.position}px`,
      top: 0,
      bottom: 0, // 无限长
      width: '1px',
    }
  } else {
    return {
      top: `${line.position}px`,
      left: 0,
      right: 0,
      height: '1px',
    }
  }
}
</script>

<style scoped>
.snap-lines-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9998; /* 低于 SelectionOverlay */
}

.snap-line {
  position: absolute;
  background-color: #ff00cc;
}
</style>
