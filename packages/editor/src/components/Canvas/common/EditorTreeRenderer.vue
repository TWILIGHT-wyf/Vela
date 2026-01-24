<template>
  <!-- Wrapper handles positioning and click detection -->
  <div
    v-if="node"
    class="editor-node-wrapper"
    :data-id="node.id"
    :data-component="node.componentName"
    :style="wrapperStyle as any"
  >
    <!-- Render actual component content -->
    <component
      v-if="isResolved"
      :is="componentRef"
      v-bind="resolvedProps"
      :style="innerStyle as any"
      class="editor-node-content"
    >
      <!-- Recursive children -->
      <template v-if="node.children && node.children.length">
        <EditorTreeRenderer
          v-for="child in node.children"
          :key="child.id"
          :node="child"
          @open-context-menu="$emit('open-context-menu', $event)"
        />
      </template>
    </component>

    <!-- Fallback for unresolved components -->
    <div v-else class="editor-node-content node-unresolved" :style="innerStyle">
      <div class="unresolved-label">{{ node.componentName }} (未找到)</div>
      <!-- Still render children -->
      <template v-if="node.children && node.children.length">
        <EditorTreeRenderer
          v-for="child in node.children"
          :key="child.id"
          :node="child"
          @open-context-menu="$emit('open-context-menu', $event)"
        />
      </template>
    </div>

    <!-- Click overlay for selection (ALWAYS on top) -->
    <div
      class="editor-click-overlay"
      :class="{
        'is-selected': isSelected,
        'is-hovered': isHovered,
        'is-locked': isLocked,
      }"
      @click.stop="handleClick"
      @dblclick.stop="handleDoubleClick"
      @contextmenu.stop.prevent="handleContextMenu"
      @mousedown.stop="handleMouseDown"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import { storeToRefs } from 'pinia'
import { useComponent } from '@/stores/component'
import { getComponent, hasComponent } from '@vela/materials'
import type { NodeSchema } from '@vela/core'
import { useComponentStyle } from '@/composables/useComponentStyle'
import { useDataSourceAdapter } from '@/composables/useDataSourceAdapter'

defineOptions({
  name: 'EditorTreeRenderer',
})

const props = defineProps<{
  node: NodeSchema
}>()

const emit = defineEmits<{
  (e: 'open-context-menu', payload: { id: string; event: MouseEvent }): void
}>()

// ========== Store ==========
const componentStore = useComponent()
const { selectedId, selectedIds, hoveredId, styleVersion } = storeToRefs(componentStore)
const { selectComponent, toggleSelection, setHovered, getComponentById } = componentStore

// ========== Component Resolution ==========
const isResolved = computed(() => hasComponent(props.node.componentName))
const componentRef = computed(() => getComponent(props.node.componentName))

// ========== Get Latest Node Style (Reactive) ==========
const latestNodeStyle = computed(() => {
  // Trigger reactivity on styleVersion change
  const _v = styleVersion.value[props.node.id]
  const node = getComponentById(props.node.id) || props.node
  return node.style
})

// ========== Styles (via shared composable) ==========
const { layoutStyle, visualStyle, locked } = useComponentStyle(latestNodeStyle as any, {
  includeLayout: true,
  includeAnimation: false,
})

// ========== Data Source ==========
const nodeRef = toRef(props, 'node')
const { resolvedProps } = useDataSourceAdapter(nodeRef)

// ========== Computed State ==========
const isSelected = computed(() => selectedId.value === props.node.id)
const isHovered = computed(() => hoveredId.value === props.node.id)
const isLocked = computed(() => locked.value)

// Wrapper style (position/size/transform)
const wrapperStyle = computed(() => ({
  ...layoutStyle.value,
  willChange: 'transform, width, height, left, top',
  cursor: isLocked.value ? 'not-allowed' : 'pointer',
  contain: 'layout style',
}))

// Inner style (visual properties only, no layout)
const innerStyle = computed(() => ({
  ...visualStyle.value,
  width: '100%',
  height: '100%',
  boxSizing: 'border-box' as const,
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
  console.log('[EditorTreeRenderer] Double click:', props.node.id)
}

function handleContextMenu(e: MouseEvent) {
  emit('open-context-menu', { id: props.node.id, event: e })
}

function handleMouseDown(e: MouseEvent) {
  e.stopPropagation()

  if (!isSelected.value && !isLocked.value) {
    if (e.ctrlKey || e.metaKey) {
      toggleSelection(props.node.id)
    } else {
      selectComponent(props.node.id)
    }
  }
}

function handleMouseEnter() {
  if (!isLocked.value) {
    setHovered(props.node.id)
  }
}

function handleMouseLeave() {
  setHovered(null)
}
</script>

<style scoped>
.editor-node-wrapper {
  box-sizing: border-box;
}

.editor-node-content {
  width: 100%;
  height: 100%;
  min-height: inherit;
  box-sizing: border-box;
}

.node-unresolved {
  border: 2px dashed #f56c6c;
  background-color: rgba(245, 108, 108, 0.1);
  min-height: 40px;
  min-width: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px;
}

.unresolved-label {
  color: #f56c6c;
  font-size: 12px;
  padding: 4px 8px;
  background: rgba(245, 108, 108, 0.2);
  border-radius: 4px;
}

.editor-click-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  background: transparent;
  transition: outline 0.15s ease;
}

.editor-click-overlay:hover,
.editor-click-overlay.is-hovered {
  outline: 1px dashed rgba(64, 158, 255, 0.5);
  outline-offset: 2px;
}

.editor-click-overlay.is-locked {
  cursor: not-allowed;
}
</style>
