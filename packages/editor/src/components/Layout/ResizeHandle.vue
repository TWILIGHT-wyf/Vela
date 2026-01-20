<template>
  <div
    class="resize-handle"
    :class="[`resize-handle--${position}`, { 'is-active': active }]"
    @mousedown="handleMouseDown"
  >
    <div class="resize-handle__line"></div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  position: 'left' | 'right'
}>()

const emit = defineEmits<{
  'resize-start': []
  'resize-end': []
}>()

const active = ref(false)

function handleMouseDown(e: MouseEvent) {
  e.preventDefault()
  active.value = true
  emit('resize-start')
}

// 供父组件调用以重置状态
function reset() {
  active.value = false
}

defineExpose({
  reset,
})
</script>

<style scoped>
.resize-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 4px;
  cursor: col-resize;
  z-index: 10;
  transition: background-color 0.2s;
}

/* 激活状态 */
.resize-handle.is-active,
.resize-handle:active {
  background-color: rgba(var(--el-color-primary-rgb), 0.15);
}

.resize-handle.is-active .resize-handle__line,
.resize-handle:active .resize-handle__line {
  background-color: var(--el-color-primary);
  width: 2px;
  box-shadow: 0 0 4px var(--el-color-primary);
}
</style>
