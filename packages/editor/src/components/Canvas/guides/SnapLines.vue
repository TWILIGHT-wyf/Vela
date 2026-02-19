<template>
  <div class="snap-lines">
    <div
      v-for="(line, index) in lines"
      :key="index"
      class="snap-line"
      :class="line.type"
      :style="getLineStyle(line)"
    />
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { SnapLine } from '../composables/useSnapping'

defineProps<{
  lines: SnapLine[]
}>()

const getLineStyle = (line: SnapLine): CSSProperties => {
  if (line.type === 'v') {
    return {
      left: `${line.position}px`,
      top: 0,
      bottom: 0,
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
.snap-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
}

.snap-line {
  position: absolute;
  background-color: #ff00cc; /* Magenta snap lines usually visible */
}
</style>
