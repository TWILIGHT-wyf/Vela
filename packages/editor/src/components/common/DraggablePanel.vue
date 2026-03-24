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

    <template v-if="resizable">
      <div
        class="panel-resize-handle panel-resize-handle--right"
        @mousedown="onResizeStart($event, 'right')"
      />
      <div
        class="panel-resize-handle panel-resize-handle--bottom"
        @mousedown="onResizeStart($event, 'bottom')"
      />
      <div
        class="panel-resize-handle panel-resize-handle--corner"
        @mousedown="onResizeStart($event, 'corner')"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onBeforeUnmount, onMounted } from 'vue'
import { Close } from '@element-plus/icons-vue'

type ResizeDirection = 'right' | 'bottom' | 'corner'

const props = defineProps({
  visible: { type: Boolean, default: true },
  title: { type: String, default: 'Panel' },
  initialX: { type: Number, default: 20 },
  initialY: { type: Number, default: 80 },
  width: { type: String, default: '320px' },
  height: { type: String, default: '600px' },
  zIndex: { type: Number, default: 10 },
  resizable: { type: Boolean, default: true },
  minWidth: { type: Number, default: 240 },
  minHeight: { type: Number, default: 220 },
  maxWidth: { type: Number, default: 1200 },
  maxHeight: { type: Number, default: 1000 },
})

defineEmits(['update:visible'])

// Position State
const x = ref(props.initialX)
const y = ref(props.initialY)
const currentZIndex = ref(props.zIndex)
const panelRef = ref<HTMLElement | null>(null)
const currentWidth = ref<number | null>(null)
const currentHeight = ref<number | null>(null)

const styleObject = computed(() => ({
  left: `${x.value}px`,
  top: `${y.value}px`,
  width: currentWidth.value !== null ? `${currentWidth.value}px` : props.width,
  height: currentHeight.value !== null ? `${currentHeight.value}px` : props.height,
  zIndex: currentZIndex.value,
}))

// Drag Logic
let startX = 0
let startY = 0
let initialLeft = 0
let initialTop = 0
let isResizing = false

// Resize Logic
let resizeDirection: ResizeDirection | null = null
let resizeStartX = 0
let resizeStartY = 0
let resizeInitialWidth = 0
let resizeInitialHeight = 0

function parsePxSize(value: string): number | null {
  const trimmed = value.trim().toLowerCase()
  if (!trimmed.endsWith('px')) return null
  const parsed = Number.parseFloat(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function syncSizeFromElement() {
  if (!panelRef.value) return
  const rect = panelRef.value.getBoundingClientRect()
  currentWidth.value = Math.round(rect.width)
  currentHeight.value = Math.round(rect.height)
}

onMounted(() => {
  const widthFromProp = parsePxSize(props.width)
  const heightFromProp = parsePxSize(props.height)
  if (widthFromProp !== null) currentWidth.value = widthFromProp
  if (heightFromProp !== null) currentHeight.value = heightFromProp

  nextTick(() => {
    if (currentWidth.value === null || currentHeight.value === null) {
      syncSizeFromElement()
    }
  })
})

const onDragStart = (e: MouseEvent) => {
  // Prevent drag if clicking close button
  if ((e.target as HTMLElement).closest('.control-dot')) return
  if ((e.target as HTMLElement).closest('.panel-resize-handle')) return
  if (isResizing) return

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

const onResizeStart = (e: MouseEvent, direction: ResizeDirection) => {
  if (!props.resizable) return
  e.preventDefault()
  e.stopPropagation()

  if (!panelRef.value) return
  syncSizeFromElement()

  isResizing = true
  resizeDirection = direction
  resizeStartX = e.clientX
  resizeStartY = e.clientY
  resizeInitialWidth = currentWidth.value || panelRef.value.getBoundingClientRect().width
  resizeInitialHeight = currentHeight.value || panelRef.value.getBoundingClientRect().height

  document.addEventListener('mousemove', onResizeMove)
  document.addEventListener('mouseup', onResizeEnd)
  bringToFront()
}

const onResizeMove = (e: MouseEvent) => {
  if (!resizeDirection) return

  const dx = e.clientX - resizeStartX
  const dy = e.clientY - resizeStartY
  const maxAllowedWidth = Math.min(props.maxWidth, window.innerWidth - x.value - 16)
  const maxAllowedHeight = Math.min(props.maxHeight, window.innerHeight - y.value - 16)
  const widthMax = Math.max(props.minWidth, maxAllowedWidth)
  const heightMax = Math.max(props.minHeight, maxAllowedHeight)

  if (resizeDirection === 'right' || resizeDirection === 'corner') {
    currentWidth.value = clamp(resizeInitialWidth + dx, props.minWidth, widthMax)
  }

  if (resizeDirection === 'bottom' || resizeDirection === 'corner') {
    currentHeight.value = clamp(resizeInitialHeight + dy, props.minHeight, heightMax)
  }
}

const onResizeEnd = () => {
  isResizing = false
  resizeDirection = null
  document.removeEventListener('mousemove', onResizeMove)
  document.removeEventListener('mouseup', onResizeEnd)
}

const bringToFront = () => {
  // Simple z-index bump (in a real app, use a store to manage global stacking order)
  currentZIndex.value = props.zIndex + 1
}

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
  document.removeEventListener('mousemove', onResizeMove)
  document.removeEventListener('mouseup', onResizeEnd)
})
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
  height: var(--panel-header-height);
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: grab;
  border-bottom: 1px solid var(--border-light);
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
  background: var(--surface-hover-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
  color: var(--text-secondary);
}

.control-dot:hover {
  background: var(--surface-hover-strong);
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

.panel-resize-handle {
  position: absolute;
  z-index: 3;
}

.panel-resize-handle--right {
  top: var(--panel-header-height);
  right: 0;
  width: 10px;
  height: calc(100% - var(--panel-header-height));
  cursor: ew-resize;
}

.panel-resize-handle--bottom {
  left: 0;
  bottom: 0;
  width: 100%;
  height: 10px;
  cursor: ns-resize;
}

.panel-resize-handle--corner {
  right: 0;
  bottom: 0;
  width: 16px;
  height: 16px;
  cursor: nwse-resize;
}
</style>
