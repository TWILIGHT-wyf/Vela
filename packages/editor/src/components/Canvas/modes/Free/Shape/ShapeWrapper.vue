<template>
  <div
    ref="wrapperRef"
    class="shape-wrapper"
    :data-id="node.id"
    :data-component="node.componentName"
    :style="wrapperStyle"
    @mousedown.stop="onMouseDown"
    @click.stop="handleClick"
    @dblclick.stop="handleDoubleClick"
    @contextmenu.stop.prevent="emitOpenContextMenu"
  >
    <!-- 内容容器 -->
    <div class="shape-content">
      <slot />
    </div>

    <!-- 选中状态的边框和操作手柄 -->
    <template v-if="isSelected && !isLocked">
      <!-- 边框 -->
      <div class="shape-border" :style="borderStyle" />

      <!-- 8个缩放手柄 -->
      <div
        v-for="handle in resizeHandles"
        :key="handle.direction"
        class="shape-handle"
        :class="handle.direction"
        @mousedown.stop="onResizeStart($event, handle.direction)"
      />

      <!-- 旋转手柄 -->
      <div class="shape-rotate" @mousedown.stop="onRotateStart">
        <div class="rotate-icon">↻</div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, inject, type Ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useComponent } from '@/stores/component'
import { useUIStore } from '@/stores/ui'
import type { NodeSchema } from '@vela/core'
import { throttle } from 'lodash-es'
import { useSnap } from '../composables/useSnapV2'

const props = defineProps<{
  node: NodeSchema
}>()

const emit = defineEmits<{
  (e: 'open-context-menu', payload: { id: string; event: MouseEvent }): void
  (e: 'snap-lines', lines: { x?: number; y?: number }[]): void
}>()

// ========== Store & Refs ==========
const componentStore = useComponent()
const { selectedId, selectedIds } = storeToRefs(componentStore)
const { selectComponent, updateStyle, toggleSelection } = componentStore

const uiStore = useUIStore()
const { canvasScale } = storeToRefs(uiStore)

const wrapperRef = ref<HTMLDivElement | null>(null)

// Inject canvas context
const canvasWrapRef = inject<Ref<HTMLDivElement | null>>('canvasWrapRef')
const canvasPanX = inject<Ref<number>>('canvasPanX', ref(0))
const canvasPanY = inject<Ref<number>>('canvasPanY', ref(0))

// ========== Snap Integration ==========
const { snapToNeighbors, snapToGrid } = useSnap()

// ========== Constants ==========
const MIN_SIZE = 20
const SNAP_THRESHOLD = 5
const GRID_SIZE = 20

// ========== Computed Properties ==========
const isSelected = computed(() => selectedId.value === props.node.id)
const isMultiSelected = computed(
  () => selectedIds.value.length > 1 && selectedIds.value.includes(props.node.id),
)
const isLocked = computed(() => props.node.style?.locked === true)

/**
 * 解析样式值为数值
 * 支持两种格式：
 * - 新格式：数值 (如 100)
 * - 旧格式：带单位字符串 (如 "100px")
 */
function parseStyleValue(value: unknown, defaultValue: number): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? defaultValue : parsed
  }
  return defaultValue
}

// 从 node.style 中提取位置信息（兼容 x/y 和 left/top 两种格式）
const position = computed(() => {
  const style = props.node.style
  return {
    // 优先使用新格式 x/y，回退到旧格式 left/top
    x: style?.x !== undefined ? parseStyleValue(style.x, 0) : parseStyleValue(style?.left, 0),
    y: style?.y !== undefined ? parseStyleValue(style.y, 0) : parseStyleValue(style?.top, 0),
  }
})

// 从 node.style 中提取尺寸信息
const size = computed(() => {
  const style = props.node.style
  return {
    width: parseStyleValue(style?.width, 100),
    height: parseStyleValue(style?.height, 100),
  }
})

// 从 node.style 中提取旋转角度（兼容 rotate 数值和 transform 字符串）
const rotation = computed(() => {
  const style = props.node.style
  // 优先使用新格式 rotate 数值
  if (typeof style?.rotate === 'number') return style.rotate
  // 回退到从 transform 字符串解析
  const transform = style?.transform || ''
  const match = transform.match(/rotate\(([-\d.]+)deg\)/)
  return match ? parseFloat(match[1]) : 0
})

const zIndex = computed(() => {
  const z = props.node.style?.zIndex
  if (typeof z === 'number') return z
  return parseInt(String(z || '0')) || 0
})

// ========== Styles ==========
const wrapperStyle = computed(() => ({
  position: 'absolute' as const,
  left: `${position.value.x}px`,
  top: `${position.value.y}px`,
  width: `${size.value.width}px`,
  height: `${size.value.height}px`,
  transform: `rotate(${rotation.value}deg)`,
  transformOrigin: 'center center',
  zIndex: zIndex.value,
}))

const borderStyle = computed(() => ({
  position: 'absolute' as const,
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  border: isMultiSelected.value ? '1px dashed #409EFF' : '2px solid #409EFF',
  pointerEvents: 'none' as const,
  borderRadius: '2px',
}))

// ========== Resize Handles ==========
const resizeHandles = computed(() => [
  { direction: 'nw' },
  { direction: 'ne' },
  { direction: 'sw' },
  { direction: 'se' },
  { direction: 'n' },
  { direction: 's' },
  { direction: 'w' },
  { direction: 'e' },
])

// ========== Drag State ==========
let isDragging = false
let dragStartX = 0
let dragStartY = 0
let dragStartPos = { x: 0, y: 0 }

// ========== Resize State ==========
let isResizing = false
let resizeStartX = 0
let resizeStartY = 0
let resizeStartPos = { x: 0, y: 0 }
let resizeStartSize = { width: 0, height: 0 }
let resizeDirection = ''

// ========== Rotation State ==========
let isRotating = false
let rotateStartAngle = 0
let rotateCenterX = 0
let rotateCenterY = 0

// ========== Event Handlers ==========
function handleClick(e: MouseEvent) {
  if (isLocked.value) return

  if (e.ctrlKey || e.metaKey) {
    toggleSelection(props.node.id)
  } else {
    selectComponent(props.node.id)
  }
}

function handleDoubleClick() {
  // TODO: Enter edit mode or open component editor
  console.log('[ShapeWrapper] Double click:', props.node.id)
}

function emitOpenContextMenu(e: MouseEvent) {
  emit('open-context-menu', { id: props.node.id, event: e })
}

// ========== Drag Logic ==========
function onMouseDown(e: MouseEvent) {
  if (isLocked.value || isResizing || isRotating) return
  if ((e.target as HTMLElement).closest('.shape-handle, .shape-rotate')) return

  // CRITICAL: Prevent event from bubbling to canvas (which would trigger pan)
  e.preventDefault()
  e.stopPropagation()

  isDragging = true
  dragStartX = e.clientX
  dragStartY = e.clientY
  dragStartPos = { ...position.value }

  selectComponent(props.node.id)

  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup', onDragEnd)
}

const onDragMove = throttle((e: MouseEvent) => {
  if (!isDragging) return

  const scale = canvasScale.value || 1
  const dx = (e.clientX - dragStartX) / scale
  const dy = (e.clientY - dragStartY) / scale

  let newX = dragStartPos.x + dx
  let newY = dragStartPos.y + dy

  // Snap logic
  if (e.ctrlKey) {
    // Grid snapping with Ctrl
    const gridSnap = snapToGrid({ x: newX, y: newY }, GRID_SIZE)
    newX = gridSnap.position.x
    newY = gridSnap.position.y
    emit('snap-lines', gridSnap.lines)
  } else {
    // Component snapping
    const componentSnap = snapToNeighbors(SNAP_THRESHOLD, { x: newX, y: newY })
    if (componentSnap) {
      newX = componentSnap.position.x
      newY = componentSnap.position.y
      emit('snap-lines', componentSnap.lines)
    } else {
      emit('snap-lines', [])
    }
  }

  // 使用新的统一样式格式：x/y 为数值类型
  updateStyle(props.node.id, {
    x: Math.round(newX),
    y: Math.round(newY),
  })
}, 16)

function onDragEnd() {
  isDragging = false
  emit('snap-lines', []) // Clear snap lines
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', onDragEnd)
}

// ========== Resize Logic ==========
function onResizeStart(e: MouseEvent, direction: string) {
  if (isLocked.value) return

  e.preventDefault()
  isResizing = true
  resizeStartX = e.clientX
  resizeStartY = e.clientY
  resizeStartPos = { ...position.value }
  resizeStartSize = { ...size.value }
  resizeDirection = direction

  window.addEventListener('mousemove', onResizeMove)
  window.addEventListener('mouseup', onResizeEnd)
}

const onResizeMove = throttle((e: MouseEvent) => {
  if (!isResizing) return

  const scale = canvasScale.value || 1
  const dx = (e.clientX - resizeStartX) / scale
  const dy = (e.clientY - resizeStartY) / scale

  let newX = resizeStartPos.x
  let newY = resizeStartPos.y
  let newWidth = resizeStartSize.width
  let newHeight = resizeStartSize.height

  // Calculate new size based on direction
  if (resizeDirection.includes('e')) {
    newWidth = Math.max(MIN_SIZE, resizeStartSize.width + dx)
  }
  if (resizeDirection.includes('w')) {
    const diff = Math.min(dx, resizeStartSize.width - MIN_SIZE)
    newX = resizeStartPos.x + diff
    newWidth = resizeStartSize.width - diff
  }
  if (resizeDirection.includes('s')) {
    newHeight = Math.max(MIN_SIZE, resizeStartSize.height + dy)
  }
  if (resizeDirection.includes('n')) {
    const diff = Math.min(dy, resizeStartSize.height - MIN_SIZE)
    newY = resizeStartPos.y + diff
    newHeight = resizeStartSize.height - diff
  }

  // Grid snapping with Ctrl
  if (e.ctrlKey) {
    newX = Math.round(newX / GRID_SIZE) * GRID_SIZE
    newY = Math.round(newY / GRID_SIZE) * GRID_SIZE
    newWidth = Math.round(newWidth / GRID_SIZE) * GRID_SIZE
    newHeight = Math.round(newHeight / GRID_SIZE) * GRID_SIZE
  }

  // 使用新的统一样式格式：数值类型
  updateStyle(props.node.id, {
    x: Math.round(newX),
    y: Math.round(newY),
    width: Math.round(newWidth),
    height: Math.round(newHeight),
  })
}, 16)

function onResizeEnd() {
  isResizing = false
  resizeDirection = ''
  window.removeEventListener('mousemove', onResizeMove)
  window.removeEventListener('mouseup', onResizeEnd)
}

// ========== Rotation Logic ==========
function onRotateStart(e: MouseEvent) {
  if (isLocked.value) return

  e.preventDefault()
  isRotating = true

  const rect = wrapperRef.value!.getBoundingClientRect()
  rotateCenterX = rect.left + rect.width / 2
  rotateCenterY = rect.top + rect.height / 2

  const currentRotation = rotation.value
  rotateStartAngle =
    Math.atan2(e.clientY - rotateCenterY, e.clientX - rotateCenterX) -
    (currentRotation * Math.PI) / 180

  window.addEventListener('mousemove', onRotateMove)
  window.addEventListener('mouseup', onRotateEnd)
}

const onRotateMove = throttle((e: MouseEvent) => {
  if (!isRotating) return

  const angle = Math.atan2(e.clientY - rotateCenterY, e.clientX - rotateCenterX) - rotateStartAngle
  let deg = (angle * 180) / Math.PI

  // Snap to 15-degree increments with Shift
  if (e.shiftKey) {
    deg = Math.round(deg / 15) * 15
  }

  // 使用新的统一样式格式：rotate 为数值类型（度）
  updateStyle(props.node.id, {
    rotate: Math.round(deg),
  })
}, 16)

function onRotateEnd() {
  isRotating = false
  window.removeEventListener('mousemove', onRotateMove)
  window.removeEventListener('mouseup', onRotateEnd)
}
</script>

<style scoped>
.shape-wrapper {
  contain: layout style;
  will-change: transform;
  cursor: move;
}

.shape-wrapper:hover {
  outline: 1px dashed rgba(64, 158, 255, 0.5);
  outline-offset: 2px;
}

.shape-content {
  width: 100%;
  height: 100%;
  pointer-events: auto;
}

/* Resize Handles */
.shape-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #409eff;
  border: 1px solid #fff;
  pointer-events: auto;
  z-index: 10;
}

.nw {
  top: -4px;
  left: -4px;
  cursor: nw-resize;
}
.ne {
  top: -4px;
  right: -4px;
  cursor: ne-resize;
}
.sw {
  bottom: -4px;
  left: -4px;
  cursor: sw-resize;
}
.se {
  bottom: -4px;
  right: -4px;
  cursor: se-resize;
}
.n {
  top: -4px;
  left: 50%;
  transform: translateX(-50%);
  cursor: n-resize;
}
.s {
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  cursor: s-resize;
}
.w {
  left: -4px;
  top: 50%;
  transform: translateY(-50%);
  cursor: w-resize;
}
.e {
  right: -4px;
  top: 50%;
  transform: translateY(-50%);
  cursor: e-resize;
}

/* Rotation Handle */
.shape-rotate {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 20px;
  background: #409eff;
  border-radius: 50%;
  cursor: alias;
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.rotate-icon {
  color: #fff;
  font-size: 14px;
  user-select: none;
}

/* Border */
.shape-border {
  pointer-events: none;
}

/* Locked state */
.shape-wrapper[data-locked='true'] {
  cursor: not-allowed;
  opacity: 0.7;
}
</style>
