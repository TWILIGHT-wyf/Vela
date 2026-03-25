<template>
  <teleport to="body">
    <div v-if="visible" class="context-menu" :style="menuStyle" @click.stop>
      <button class="menu-item" @click="emitAction('copy')">复制</button>
      <button class="menu-item" @click="emitAction('cut')">剪切</button>
      <button class="menu-item" @click="emitAction('paste')">粘贴</button>
      <div class="menu-divider"></div>
      <button class="menu-item danger" @click="emitAction('delete')">删除</button>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  visible: boolean
  x: number
  y: number
  targetId?: string
}>()

const emit = defineEmits<{
  (e: 'action', action: string): void
}>()

const menuStyle = computed(() => ({
  left: `${props.x}px`,
  top: `${props.y}px`,
}))

const emitAction = (action: string) => {
  emit('action', action)
}

const handleGlobalClick = () => {
  if (props.visible) {
    emit('action', 'close')
  }
}

onMounted(() => {
  window.addEventListener('click', handleGlobalClick)
})

onUnmounted(() => {
  window.removeEventListener('click', handleGlobalClick)
})
</script>

<style scoped>
.context-menu {
  position: fixed;
  min-width: 140px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow:
    0 10px 25px rgba(0, 0, 0, 0.08),
    0 4px 8px rgba(0, 0, 0, 0.06);
  padding: 6px;
  z-index: 9999;
}

.menu-item {
  width: 100%;
  text-align: left;
  border: none;
  background: transparent;
  padding: 8px 10px;
  font-size: 13px;
  color: #111827;
  border-radius: 6px;
  cursor: pointer;
}

.menu-item:hover {
  background: #f3f4f6;
}

.menu-item.danger {
  color: #ef4444;
}

.menu-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 6px 4px;
}
</style>
