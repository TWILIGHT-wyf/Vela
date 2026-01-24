<template>
  <div
    class="selection-overlay"
    :class="{ active: isActive }"
    :style="overlayStyle"
    @mousedown.stop="onDragMouseDown"
  >
    <!-- Border -->
    <div v-if="isActive" class="selection-border" :style="borderStyle" />

    <!-- Resize handles -->
    <template v-if="isActive && handles.length > 0">
      <div
        v-for="handle in handlePositions"
        :key="handle.id"
        class="selection-handle"
        :class="handle.class"
        :style="handle.style"
        @mousedown.stop="onHandleMouseDown($event, handle.id)"
      />
    </template>

    <!-- Rotate handle (only for Free mode) -->
    <div v-if="isActive && showRotate" class="selection-rotate" @mousedown.stop="onRotateMouseDown">
      <div class="rotate-icon">&#8635;</div>
    </div>

    <!-- Breadcrumb (Parent > Current) -->
    <div v-if="isActive && (parentLabel || label)" class="selection-breadcrumb">
      <span
        v-if="parentLabel && showSelectParent"
        class="breadcrumb-parent"
        @click.stop="$emit('select-parent')"
      >
        {{ parentLabel }}
      </span>
      <span v-if="parentLabel && showSelectParent" class="breadcrumb-separator">&gt;</span>
      <span class="breadcrumb-current">{{ label }}</span>
    </div>

    <!-- Toolbar -->
    <div v-if="isActive && showToolbar" class="selection-toolbar">
      <el-tooltip content="删除" placement="top" :show-after="500">
        <el-button type="danger" :icon="Delete" size="small" circle @click.stop="$emit('delete')" />
      </el-tooltip>
      <el-tooltip content="复制" placement="top" :show-after="500">
        <el-button :icon="CopyDocument" size="small" circle @click.stop="$emit('copy')" />
      </el-tooltip>
      <el-tooltip v-if="showSelectParent" content="选择父级" placement="top" :show-after="500">
        <el-button :icon="Top" size="small" circle @click.stop="$emit('select-parent')" />
      </el-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'
import { Delete, CopyDocument, Top } from '@element-plus/icons-vue'

interface Props {
  /** Whether the component is selected */
  isActive?: boolean
  /** Component display label */
  label?: string
  /** Parent component label (for breadcrumb) */
  parentLabel?: string
  /** Which handles to show: ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'] */
  handles?: string[]
  /** Show the toolbar with action buttons */
  showToolbar?: boolean
  /** Show the rotate handle */
  showRotate?: boolean
  /** Show select parent button in toolbar */
  showSelectParent?: boolean
  /** Multi-selection mode (dashed border) */
  isMultiSelected?: boolean

  // Position props
  x?: number
  y?: number
  width?: number
  height?: number
  rotate?: number
  zIndex?: number
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false,
  label: '',
  parentLabel: '',
  handles: () => ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'],
  showToolbar: true,
  showRotate: false,
  showSelectParent: false,
  isMultiSelected: false,
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  rotate: 0,
  zIndex: 100,
})

const emit = defineEmits<{
  'drag-start': [event: MouseEvent]
  'resize-start': [handle: string, event: MouseEvent]
  'rotate-start': [event: MouseEvent]
  delete: []
  copy: []
  'select-parent': []
}>()

// Overlay position style
const overlayStyle = computed<CSSProperties>(() => ({
  position: 'absolute',
  left: `${props.x}px`,
  top: `${props.y}px`,
  width: `${props.width}px`,
  height: `${props.height}px`,
  transform: `rotate(${props.rotate}deg)`,
  transformOrigin: 'center center',
  zIndex: props.zIndex,
  pointerEvents: props.isActive ? 'none' : 'none', // Base is always none, specific elements override
  display: props.isActive ? 'block' : 'none',
}))

// Border style based on selection type
const borderStyle = computed<CSSProperties>(() => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  border: props.isMultiSelected ? '1px dashed #409EFF' : '2px solid #409EFF',
  pointerEvents: 'none',
  boxSizing: 'border-box',
  borderRadius: '2px',
}))

// Handle configuration with positions
const handleConfig: Record<string, { class: string; cursor: string }> = {
  nw: { class: 'nw', cursor: 'nw-resize' },
  n: { class: 'n', cursor: 'n-resize' },
  ne: { class: 'ne', cursor: 'ne-resize' },
  w: { class: 'w', cursor: 'w-resize' },
  e: { class: 'e', cursor: 'e-resize' },
  sw: { class: 'sw', cursor: 'sw-resize' },
  s: { class: 's', cursor: 's-resize' },
  se: { class: 'se', cursor: 'se-resize' },
}

const handlePositions = computed(() =>
  props.handles
    .filter((h) => handleConfig[h])
    .map((h) => ({
      id: h,
      class: handleConfig[h].class,
      style: { cursor: handleConfig[h].cursor } as CSSProperties,
    })),
)

// Events
const onDragMouseDown = (e: MouseEvent) => {
  // Only trigger drag if we click inside the box (even though it's pointer-events: none,
  // we'll likely handle this by a transparent overlay div if we want drag-area behavior,
  // OR we rely on the fact that ShapeWrapper handles selection, and this Overlay handles
  // transformation once selected.

  // Wait, if overlay is on top, we need a way to drag.
  // We can add a transparent div for drag area if needed,
  // but usually dragging is done by clicking the component itself.
  // However, since we are moving interaction logic HERE, we might want a drag handler
  // on the border or a transparent cover?

  // Design decision:
  // Option 1: ShapeWrapper handles drag start (original design).
  // Option 2: SelectionOverlay has a transparent cover for drag.

  // If we want to fully decouple, Overlay should handle drag for SELECTED items.
  // But how do we select unselected items? ShapeWrapper must handle click-to-select.
  // Once selected, Overlay appears. If we click Overlay, we drag.

  // So we need a transparent hit area in Overlay.
  emit('drag-start', e)
}

const onHandleMouseDown = (e: MouseEvent, handle: string) => {
  emit('resize-start', handle, e)
}

const onRotateMouseDown = (e: MouseEvent) => {
  emit('rotate-start', e)
}
</script>

<style scoped>
.selection-overlay {
  /* Default pointer-events is none to let clicks pass through to underlying components when not hitting controls */
  /* But we need to capture events on handles */
}

/* Hit area for drag - only active when selected */
.selection-overlay::after {
  content: '';
  position: absolute;
  inset: 0;
  cursor: move;
  pointer-events: auto; /* Catch clicks for dragging */
  /* Debug color: background: rgba(255, 0, 0, 0.1); */
}

.selection-border {
  pointer-events: none;
}

/* Resize handles */
.selection-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #409eff;
  border: 1px solid #fff;
  pointer-events: auto;
  box-sizing: border-box;
  z-index: 20;
}

.selection-handle.nw {
  top: -4px;
  left: -4px;
}
.selection-handle.n {
  top: -4px;
  left: 50%;
  transform: translateX(-50%);
}
.selection-handle.ne {
  top: -4px;
  right: -4px;
}
.selection-handle.w {
  left: -4px;
  top: 50%;
  transform: translateY(-50%);
}
.selection-handle.e {
  right: -4px;
  top: 50%;
  transform: translateY(-50%);
}
.selection-handle.sw {
  bottom: -4px;
  left: -4px;
}
.selection-handle.s {
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
}
.selection-handle.se {
  bottom: -4px;
  right: -4px;
}

/* Rotate handle */
.selection-rotate {
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
  z-index: 20;
}

.rotate-icon {
  color: #fff;
  font-size: 14px;
  user-select: none;
}

/* Breadcrumb */
.selection-breadcrumb {
  position: absolute;
  top: -22px;
  left: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  white-space: nowrap;
  pointer-events: auto;
  z-index: 20;
}

.breadcrumb-parent {
  color: #fff;
  background: #909399;
  padding: 2px 6px;
  border-radius: 2px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.breadcrumb-parent:hover {
  background: #606266;
}

.breadcrumb-separator {
  color: #909399;
  font-size: 10px;
}

.breadcrumb-current {
  color: #fff;
  background: #409eff;
  padding: 2px 6px;
  border-radius: 2px;
}

/* Toolbar */
.selection-toolbar {
  position: absolute;
  top: -40px;
  right: 0;
  display: flex;
  gap: 4px;
  padding: 4px;
  background: var(--el-bg-color);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  pointer-events: auto;
  z-index: 20;
}

.selection-toolbar .el-button {
  margin: 0;
}
</style>
