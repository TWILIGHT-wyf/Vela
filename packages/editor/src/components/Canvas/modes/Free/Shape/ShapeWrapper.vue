<template>
  <div
    class="shape-wrapper"
    :data-id="node.id"
    :data-component="node.componentName"
    :style="wrapperStyle"
  >
    <!-- Content container -->
    <div class="shape-content">
      <slot />
    </div>

    <!-- Transparent click overlay - captures all clicks reliably -->
    <div
      class="click-overlay"
      @click.stop="handleClick"
      @dblclick.stop="handleDoubleClick"
      @contextmenu.stop.prevent="emitOpenContextMenu"
      @mousedown.stop="onMouseDown"
    />

    <!-- Selection indicator (simple border only, logic moved to Overlay) -->
    <div v-if="isSelected" class="shape-selection-border" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useComponent } from '@/stores/component'
import type { NodeSchema } from '@vela/core'

const props = defineProps<{
  node: NodeSchema
}>()

const emit = defineEmits<{
  (e: 'open-context-menu', payload: { id: string; event: MouseEvent }): void
}>()

// ========== Store ==========
const componentStore = useComponent()
const { selectedId, styleVersion } = storeToRefs(componentStore)
const { selectComponent, toggleSelection, getComponentById } = componentStore

// ========== Computed Properties ==========
const isSelected = computed(() => selectedId.value === props.node.id)

/**
 * Parse style value to number
 */
function parseStyleValue(value: unknown, defaultValue: number): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? defaultValue : parsed
  }
  return defaultValue
}

// Get latest node data (reactive via version)
const nodeStyle = computed(() => {
  const _version = styleVersion.value[props.node.id]
  const node = getComponentById(props.node.id)
  return node?.style || props.node.style
})

// Extract position
const position = computed(() => {
  const style = nodeStyle.value
  return {
    x: style?.x !== undefined ? parseStyleValue(style.x, 0) : parseStyleValue(style?.left, 0),
    y: style?.y !== undefined ? parseStyleValue(style.y, 0) : parseStyleValue(style?.top, 0),
  }
})

// Extract size
const size = computed(() => {
  const style = nodeStyle.value
  return {
    width: parseStyleValue(style?.width, 100),
    height: parseStyleValue(style?.height, 100),
  }
})

// Extract rotation
const rotation = computed(() => {
  const style = nodeStyle.value
  if (typeof style?.rotate === 'number') return style.rotate
  const transform = style?.transform || ''
  const match = transform.match(/rotate\(([-\d.]+)deg\)/)
  return match ? parseFloat(match[1]) : 0
})

const zIndex = computed(() => {
  const z = nodeStyle.value?.zIndex
  if (typeof z === 'number') return z
  return parseInt(String(z || '0')) || 0
})

const isLocked = computed(() => nodeStyle.value?.locked === true)

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
  // Add will-change to optimize rendering during external transform updates
  willChange: 'transform, width, height, left, top',
  cursor: isLocked.value ? 'not-allowed' : 'pointer',
}))

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
  console.log('[ShapeWrapper] Double click:', props.node.id)
}

function emitOpenContextMenu(e: MouseEvent) {
  emit('open-context-menu', { id: props.node.id, event: e })
}

// Minimal mouseDown to ensure selection on click-down,
// but we DON'T handle drag here anymore.
// However, if we don't handle drag here, how does the component move?
// Answer: The SelectionOverlay will overlay on top of the selected component.
// But wait! If I click an UNSELECTED component, ShapeWrapper handles the click.
// It selects the component.
// THEN SelectionOverlay appears on top.
// THEN I need to click AGAIN to drag? That's bad UX.
//
// Solution:
// If I mousedown on ShapeWrapper:
// 1. Select the component (if not selected)
// 2. Since SelectionOverlay will now appear instantly, can we transfer the drag?
//
// Alternatively, ShapeWrapper can initiate the drag via a global event bus or store action?
// OR, we keep basic "Drag Start" detection here, but delegate the movement to a shared logic?
//
// Let's stick to the "Unified Interaction Layer" plan:
// The SelectionOverlay is always present for the *selected* node.
// For *unselected* nodes, we click them to select.
// If we want "Click-and-Drag" in one go for an unselected node:
// The mousedown selects it. The SelectionOverlay renders immediately.
// If the SelectionOverlay is rendered fast enough (Vue reactivity),
// does the mouse event continue to the overlay? No.
//
// So, ShapeWrapper logic:
// - On Mousedown: Select component.
// - If we want to support immediate drag, ShapeWrapper needs to trigger the global drag start.
// But we moved drag logic to useSelectionTransform.
//
// Let's just select on Mousedown. If the user wants to drag, they usually click (select) then drag.
// Or if they click-drag, we might lose the first drag action if we are strict.
// But for now, let's keep it simple: ShapeWrapper selects.
// We can optimize "Click-Drag" later by having a global "DragManager".

function onMouseDown(e: MouseEvent) {
  // Prevent propagation to canvas (pan)
  e.stopPropagation()

  // Select immediately on mousedown so overlay appears
  if (!isSelected.value && !isLocked.value) {
    if (e.ctrlKey || e.metaKey) {
      toggleSelection(props.node.id)
    } else {
      selectComponent(props.node.id)
    }
  }
}
</script>

<style scoped>
.shape-wrapper {
  contain: layout style;
  /* No cursor: move here, handled by overlay or specific logic */
}

.shape-wrapper:hover {
  outline: 1px dashed rgba(64, 158, 255, 0.5);
  outline-offset: 2px;
}

.shape-content {
  width: 100%;
  height: 100%;
  /* Allow content to render normally, but we'll use an overlay for click detection */
}

/* Transparent overlay to capture all clicks reliably */
.click-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  /* Transparent but captures pointer events */
  background: transparent;
}

/* Simple visual indicator for selection before overlay logic */
/* Actually, we might not even need this if overlay is fast enough. 
   But keeping a thin border is nice. */
.shape-selection-border {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 1px solid rgba(64, 158, 255, 0.3);
  pointer-events: none;
  z-index: 1;
  display: none; /* Let overlay handle it completely for now */
}
</style>
