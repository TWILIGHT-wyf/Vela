<template>
  <!-- Wrapper Component (Shape or NodeWrapper) -->
  <component
    :is="wrapper"
    v-if="node"
    :node="node"
    :node-id="node.id"
    :parent-layout-mode="effectiveParentLayoutMode"
    v-bind="$attrs"
  >
    <!-- Actual Component -->
    <component
      v-if="isResolved"
      :is="componentRef"
      v-bind="resolvedProps"
      :style="innerStyle"
      :data-id="node.id"
      :data-component="node.componentName"
      class="universal-node-content"
    >
      <!-- Recursive Children -->
      <template v-if="node.children && node.children.length">
        <UniversalRenderer
          v-for="child in node.children"
          :key="child.id"
          :node="child"
          :wrapper="wrapper"
          :parent-layout-mode="selfChildrenLayoutMode"
          v-bind="$attrs"
        />
      </template>
    </component>

    <!-- Fallback for unresolved components -->
    <div
      v-else
      class="universal-node-content node-unresolved"
      :data-id="node.id"
      :data-component="node.componentName"
      :style="innerStyle"
    >
      <div class="unresolved-label">{{ node.componentName }} (未找到)</div>
      <!-- Still render children -->
      <template v-if="node.children && node.children.length">
        <UniversalRenderer
          v-for="child in node.children"
          :key="child.id"
          :node="child"
          :wrapper="wrapper"
          :parent-layout-mode="selfChildrenLayoutMode"
          v-bind="$attrs"
        />
      </template>
    </div>
  </component>
</template>

<script setup lang="ts">
import { computed, toRef, type Component } from 'vue'
import type { NodeSchema } from '@vela/core'
import { getComponent, hasComponent } from '@vela/materials'
import { useDataSourceAdapter } from '@/composables/useDataSourceAdapter'

defineOptions({
  name: 'UniversalRenderer',
  inheritAttrs: false,
})

const props = defineProps<{
  node: NodeSchema
  wrapper: Component
  parentLayoutMode?: 'flow' | 'free'
}>()

// Component Resolution
const isResolved = computed(() => {
  return hasComponent(props.node.componentName)
})
const componentRef = computed(() => {
  return getComponent(props.node.componentName)
})

// Data Source Adapter
const nodeRef = toRef(props, 'node')
const { resolvedProps } = useDataSourceAdapter(nodeRef)

const effectiveParentLayoutMode = computed(() => props.parentLayoutMode || 'flow')
const selfChildrenLayoutMode = computed(
  () => (props.node.layoutMode as 'free' | 'flow' | undefined) || effectiveParentLayoutMode.value,
)

// Style Logic: Strip layout styles handled by wrapper
const innerStyle = computed(() => {
  if (!props.node.style) return {}
  const style = { ...props.node.style }

  // Exclude layout properties managed by wrappers
  // Free Mode (ShapeWrapper)
  delete style.position
  delete style.left
  delete style.top
  delete style.x
  delete style.y
  delete style.transform
  delete style.rotate
  delete style.zIndex

  // Flow Mode (NodeWrapper) & Common
  delete style.width
  delete style.height
  delete style.minHeight

  // Other
  delete style.locked

  // Free layout containers need a positioning context for absolute children
  if (props.node.layoutMode === 'free' && !style.position) {
    style.position = 'relative'
  }

  return style
})
</script>

<style scoped>
.universal-node-content {
  width: 100%;
  height: 100%;
  min-height: inherit; /* For Flow mode */
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
</style>
