<template>
  <div
    ref="viewportEl"
    class="canvas-viewport"
    :class="{
      'is-panning': isPanning,
      'is-space-pressed': isSpacePressed,
    }"
    @wheel.prevent="handleWheel"
    @mousedown="handleMouseDown"
  >
    <!-- Infinite grid background -->
    <div class="canvas-grid" :style="gridStyle" />

    <!-- Transformed world layer -->
    <div class="canvas-world" :style="worldStyle">
      <!-- Content (CanvasStage) -->
      <slot />

      <!-- Overlay layer (Selection, SnapLines) -->
      <!-- Moved INSIDE world to sync pan/zoom transform automatically -->
      <div class="canvas-overlay">
        <slot name="overlay" />
      </div>
    </div>

    <!-- Zoom indicator -->
    <div v-if="showZoomIndicator" class="zoom-indicator">{{ Math.round(scale * 100) }}%</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useCanvasContextProvider } from './composables/useCanvasContext'
import { useCanvasStore } from '@/stores/canvas'

interface Props {
  /** Minimum zoom scale */
  minScale?: number
  /** Maximum zoom scale */
  maxScale?: number
  /** Initial zoom scale */
  initialScale?: number
  /** Show zoom percentage indicator */
  showZoomIndicator?: boolean
  /** Grid size in pixels */
  gridSize?: number
  /** Grid color */
  gridColor?: string
  /** Background color */
  backgroundColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  minScale: 0.1,
  maxScale: 3,
  initialScale: 1,
  showZoomIndicator: true,
  gridSize: 20,
  gridColor: 'rgba(0, 0, 0, 0.08)',
  backgroundColor: '#f5f5f5',
})

const canvasStore = useCanvasStore()

// Initialize canvas context with store values
const { scale, panX, panY, viewportRef, isPanning, isSpacePressed, setScale, panBy, setPan } =
  useCanvasContextProvider({
    minScale: props.minScale,
    maxScale: props.maxScale,
    initialScale: canvasStore.scale || props.initialScale,
  })

// Sync Store -> Context
watch(
  () => canvasStore.scale,
  (newScale) => {
    if (Math.abs(newScale - scale.value) > 0.001) {
      setScale(newScale)
    }
  },
)

// Sync Context -> Store
watch([scale, panX, panY], ([s, x, y]) => {
  if (Math.abs(s - canvasStore.scale) > 0.001) canvasStore.scale = s
  if (Math.abs(x - canvasStore.offsetX) > 0.1) canvasStore.offsetX = x
  if (Math.abs(y - canvasStore.offsetY) > 0.1) canvasStore.offsetY = y

  canvasStore.isPanning = isPanning.value
  canvasStore.isSpacePressed = isSpacePressed.value
})

// Local ref for the viewport element
const viewportEl = ref<HTMLElement | null>(null)

// Sync viewportEl with context's viewportRef
watch(
  viewportEl,
  (el) => {
    viewportRef.value = el
  },
  { immediate: true },
)

// Computed styles
const worldStyle = computed(() => ({
  transform: `translate(${panX.value}px, ${panY.value}px) scale(${scale.value})`,
  transformOrigin: '0 0',
}))

const gridStyle = computed(() => {
  const size = props.gridSize * scale.value
  const dotSize = Math.max(1, 1.5 * scale.value)

  return {
    backgroundColor: props.backgroundColor,
    backgroundImage: `radial-gradient(${props.gridColor} ${dotSize}px, transparent ${dotSize}px)`,
    backgroundSize: `${size}px ${size}px`,
    backgroundPosition: `${panX.value}px ${panY.value}px`,
  }
})

/**
 * Handle wheel events (Figma-style)
 * - Ctrl+Wheel: Zoom towards cursor
 * - Shift+Wheel: Pan horizontally
 * - Normal Wheel: Pan vertically
 */
const handleWheel = (e: WheelEvent) => {
  if (e.ctrlKey || e.metaKey) {
    // Zoom towards cursor
    const delta = -e.deltaY * 0.001
    const newScale = scale.value * (1 + delta)
    setScale(newScale, { x: e.clientX, y: e.clientY })
  } else if (e.shiftKey) {
    // Pan horizontally
    panBy(-e.deltaY, 0)
  } else {
    // Pan vertically (and horizontally if deltaX exists)
    panBy(-e.deltaX, -e.deltaY)
  }
}

/**
 * Handle mouse down for panning
 * - Middle click: Start pan
 * - Left click + Space: Start pan
 */
const handleMouseDown = (e: MouseEvent) => {
  // Middle click or (Space pressed + Left click)
  if (e.button === 1 || (e.button === 0 && isSpacePressed.value)) {
    e.preventDefault()
    startPan(e)
  }
}

/**
 * Start panning operation
 */
const startPan = (e: MouseEvent) => {
  isPanning.value = true

  const startX = e.clientX
  const startY = e.clientY
  const startPanX = panX.value
  const startPanY = panY.value

  const onMouseMove = (ev: MouseEvent) => {
    const dx = ev.clientX - startX
    const dy = ev.clientY - startY
    setPan(startPanX + dx, startPanY + dy)
  }

  const onMouseUp = () => {
    isPanning.value = false
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

/**
 * Handle Space key for pan mode
 */
const handleKeyDown = (e: KeyboardEvent) => {
  // Ignore if focus is on input/textarea
  const target = e.target as HTMLElement
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

  if (e.code === 'Space' && !e.repeat) {
    e.preventDefault()
    isSpacePressed.value = true
  }
}

const handleKeyUp = (e: KeyboardEvent) => {
  if (e.code === 'Space') {
    isSpacePressed.value = false
  }
}

// Center canvas on mount
const centerCanvas = (stageWidth: number, stageHeight: number) => {
  if (!viewportEl.value) return

  const rect = viewportEl.value.getBoundingClientRect()
  const x = (rect.width - stageWidth * scale.value) / 2
  const y = (rect.height - stageHeight * scale.value) / 2
  setPan(x, y)
}

// Expose for parent components
defineExpose({
  centerCanvas,
  setScale,
  setPan,
  panBy,
})

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
})
</script>

<style scoped>
.canvas-viewport {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  cursor: default;
  user-select: none;
  -webkit-user-select: none;
}

.canvas-viewport.is-space-pressed {
  cursor: grab;
}

.canvas-viewport.is-panning {
  cursor: grabbing;
}

.canvas-grid {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.canvas-world {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  will-change: transform;
}

.canvas-overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}

.canvas-overlay > :deep(*) {
  pointer-events: auto;
}

.zoom-indicator {
  position: absolute;
  bottom: 16px;
  right: 16px;
  padding: 4px 12px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  border-radius: 4px;
  z-index: 100;
  pointer-events: none;
  font-variant-numeric: tabular-nums;
}
</style>
