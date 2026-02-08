<template>
  <div class="selection-layer">
    <!-- Snap Lines -->
    <SnapLines v-if="snapLines.length > 0" :lines="snapLines" />

    <!-- Selection Box -->
    <div
      v-if="selectedNode && selectedId && boxStyle"
      class="selection-box"
      :style="boxStyle"
      @mousedown.stop="handleDragStart"
    >
      <!-- Resize Handles -->
      <template v-if="!isRotating">
        <div
          v-for="handle in handles"
          :key="handle"
          class="resize-handle"
          :class="handle"
          :style="getHandleStyle(handle)"
          @mousedown.stop="handleResizeStart(handle, $event)"
        />
      </template>

      <!-- Rotate Handle -->
      <div
        v-if="!isResizing"
        class="rotate-handle"
        :style="rotateHandleStyle"
        @mousedown.stop="handleRotateStart"
      >
        <div class="rotate-icon">↻</div>
      </div>

      <!-- Label -->
      <div v-if="!isDragging && !isResizing && !isRotating" class="selection-label">
        {{ selectedNode.title || selectedNode.component }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useComponent } from '@/stores/component'
import { useTransform, type ResizeHandle } from '../composables/useTransform'
import { useCanvasContext } from '../composables/useCanvasContext'
import SnapLines from '../guides/SnapLines.vue'

const store = useComponent()
const { selectedNode, selectedId } = storeToRefs(store)
const { scale } = useCanvasContext() // Get scale for handle compensation

const { startDrag, startResize, startRotate, snapLines, isDragging, isResizing, isRotating } =
  useTransform()

const handles: ResizeHandle[] = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se']

// Counter-scale for resize handles with position fix
const getHandleStyle = (handle: ResizeHandle) => {
  const s = scale.value
  const invS = 1 / s

  let baseTransform = ''
  if (['n', 's'].includes(handle)) baseTransform = 'translateX(-50%)'
  if (['w', 'e'].includes(handle)) baseTransform = 'translateY(-50%)'

  return {
    transform: `${baseTransform} scale(${invS})`,
    transformOrigin: 'center center',
  }
}

// Counter-scale for rotate handle with visual offset fix
const rotateHandleStyle = computed(() => {
  const s = scale.value
  return {
    transform: `translateX(-50%) scale(${1 / s})`,
    // Use dynamic top offset to keep constant visual distance
    // Original CSS: top: -30px.
    // If scale=0.5, we need top: -60px.
    top: `${-30 / s}px`,
  }
})

const boxStyle = computed(() => {
  const node = selectedNode.value
  if (!node) return null

  // Trigger reactivity explicitly via styleVersion
  const _v = store.styleVersion[node.id]

  // Read free-mode positioning from node.geometry, sizing from geometry/style
  const geometry = node.geometry?.mode === 'free' ? node.geometry : undefined
  const style = node.style || {}
  const x = geometry?.x ?? 0
  const y = geometry?.y ?? 0
  const rotate = geometry?.rotate ?? 0
  const width = geometry?.width ?? style.width ?? 100
  const height = geometry?.height ?? style.height ?? 100

  return {
    transform: `translate(${x}px, ${y}px) rotate(${rotate}deg)`,
    width: `${width}px`,
    height: `${height}px`,
    position: 'absolute' as const,
    left: 0,
    top: 0,
    pointerEvents: 'all' as const,
    zIndex: 9999,
    willChange: 'transform, width, height',
  }
})

const handleDragStart = (e: MouseEvent) => {
  if (selectedId.value && selectedNode.value) {
    startDrag(selectedId.value, selectedNode.value, e)
  }
}

const handleResizeStart = (handle: ResizeHandle, e: MouseEvent) => {
  if (selectedId.value && selectedNode.value) {
    startResize(selectedId.value, handle, selectedNode.value, e)
  }
}

const handleRotateStart = (e: MouseEvent) => {
  if (selectedId.value && selectedNode.value) {
    startRotate(selectedId.value, selectedNode.value, e)
  }
}
</script>

<style scoped>
.selection-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.selection-box {
  border: 2px solid #409eff;
  background-color: transparent;
  cursor: move;
  box-sizing: border-box;
}

/* Hit area for drag */
.selection-box::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
}

.resize-handle {
  width: 8px;
  height: 8px;
  background: #fff;
  border: 1px solid #409eff;
  position: absolute;
  pointer-events: auto;
  box-sizing: border-box;
  z-index: 10;
}

/* Handle Positions */
.nw {
  top: -5px;
  left: -5px;
  cursor: nwse-resize;
}
.n {
  top: -5px;
  left: 50%;
  cursor: ns-resize;
}
.ne {
  top: -5px;
  right: -5px;
  cursor: nesw-resize;
}
.w {
  top: 50%;
  left: -5px;
  cursor: ew-resize;
}
.e {
  top: 50%;
  right: -5px;
  cursor: ew-resize;
}
.sw {
  bottom: -5px;
  left: -5px;
  cursor: nesw-resize;
}
.s {
  bottom: -5px;
  left: 50%;
  cursor: ns-resize;
}
.se {
  bottom: -5px;
  right: -5px;
  cursor: nwse-resize;
}

.rotate-handle {
  position: absolute;
  /* Top is dynamic now via JS */
  left: 50%;
  /* Transform is dynamic now via JS */
  width: 24px;
  height: 24px;
  background: #fff;
  border: 1px solid #409eff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  pointer-events: auto;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.rotate-handle:active {
  cursor: grabbing;
}

.rotate-icon {
  font-size: 14px;
  color: #409eff;
  user-select: none;
}

/* Connect line to rotate handle */
.rotate-handle::before {
  content: '';
  position: absolute;
  bottom: -15px; /* Needs compensation? It's inside handle, so scaled with handle. */
  left: 50%;
  transform: translateX(-50%);
  width: 1px;
  height: 15px;
  background: #409eff;
  pointer-events: none;
}

.selection-label {
  position: absolute;
  top: -24px;
  left: -2px;
  background: #409eff;
  color: #fff;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 2px 2px 2px 0;
  white-space: nowrap;
  pointer-events: none;
}
</style>
