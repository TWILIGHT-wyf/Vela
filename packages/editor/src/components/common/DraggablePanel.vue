<template>
  <div
    v-show="visible"
    class="draggable-panel glass-panel"
    ref="panelRef"
    :style="styleObject"
    @mousedown="bringToFront"
  >
    <!-- Header: Drag Handle -->
    <div class="panel-header" @mousedown="onDragStart">
      <div class="panel-title">{{ title }}</div>
      <div class="panel-controls">
        <div class="control-dot close" @click.stop="$emit('update:visible', false)">
          <el-icon><Close /></el-icon>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="panel-content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Close } from '@element-plus/icons-vue'

const props = defineProps({
  visible: { type: Boolean, default: true },
  title: { type: String, default: 'Panel' },
  initialX: { type: Number, default: 20 },
  initialY: { type: Number, default: 80 },
  width: { type: String, default: '320px' },
  height: { type: String, default: '600px' },
  zIndex: { type: Number, default: 10 },
})

defineEmits(['update:visible'])

// Position State
const x = ref(props.initialX)
const y = ref(props.initialY)
const currentZIndex = ref(props.zIndex)

const styleObject = computed(() => ({
  left: `${x.value}px`,
  top: `${y.value}px`,
  width: props.width,
  height: props.height,
  zIndex: currentZIndex.value,
}))

// Drag Logic
let startX = 0
let startY = 0
let initialLeft = 0
let initialTop = 0

const onDragStart = (e: MouseEvent) => {
  // Prevent drag if clicking close button
  if ((e.target as HTMLElement).closest('.control-dot')) return

  startX = e.clientX
  startY = e.clientY
  initialLeft = x.value
  initialTop = y.value

  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)

  // Bring to front
  bringToFront()
}

const onDragMove = (e: MouseEvent) => {
  const dx = e.clientX - startX
  const dy = e.clientY - startY
  x.value = initialLeft + dx
  y.value = initialTop + dy
}

const onDragEnd = () => {
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
}

const bringToFront = () => {
  // Simple z-index bump (in a real app, use a store to manage global stacking order)
  currentZIndex.value = props.zIndex + 1
}
</script>

<style scoped>
.draggable-panel {
  position: absolute;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition:
    transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 0.2s;
  /* Glassmorphism handled by global .glass-panel class */
}

.draggable-panel:hover {
  box-shadow: var(--shadow-active);
}

.panel-header {
  height: 44px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: grab;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
  user-select: none;
}

.panel-header:active {
  cursor: grabbing;
}

.panel-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
}

.panel-controls {
  display: flex;
  gap: 8px;
}

.control-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
  color: var(--text-secondary);
}

.control-dot:hover {
  background: rgba(0, 0, 0, 0.1);
  color: var(--text-primary);
}

.control-dot.close:hover {
  background: #ff5f57;
  color: white;
}

.panel-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}
</style>
