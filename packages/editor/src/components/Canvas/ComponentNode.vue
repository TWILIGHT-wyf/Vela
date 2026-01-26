<template>
  <div
    class="component-node"
    :class="{ 'is-selected': isSelected }"
    :style="wrapperStyle"
    :data-node-id="node.id"
    @mousedown.stop="handleMouseDown"
    @click.stop="handleClick"
  >
    <!-- Render the actual component with visual styles and reactive props -->
    <component
      :is="componentType"
      :id="node.id"
      v-bind="reactiveProps"
      :style="innerStyle"
    >
      <!-- Recursive children rendering -->
      <slot />
    </component>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { NodeSchema } from '@vela/core'
import { getComponent, hasComponent } from '@vela/materials'
import { useComponentStyle } from '@/composables/useComponentStyle'
import { useComponent } from '@/stores/component'
import { storeToRefs } from 'pinia'

interface Props {
  node: NodeSchema
}

const props = defineProps<Props>()

const compStore = useComponent()
const { selectedIds } = storeToRefs(compStore)

const isSelected = computed(() => selectedIds.value.includes(props.node.id))

// 组件解析
const componentType = computed(() => {
  const name = props.node.componentName
  if (hasComponent(name)) {
    return getComponent(name)
  }
  return 'div'
})

// 响应式 props - 订阅 styleVersion 以触发更新
const reactiveProps = computed(() => {
  // 订阅 styleVersion 以触发响应式更新
  const _v = compStore.styleVersion[props.node.id]
  return props.node.props || {}
})

const reactiveStyle = computed(() => {
  // Access styleVersion to trigger reactivity
  const _v = compStore.styleVersion[props.node.id]
  return props.node.style
})

// Use the shared composable to split layout and visual styles
const { layoutStyle, visualStyle } = useComponentStyle(reactiveStyle, {
  includeLayout: true,
  includeAnimation: false,
})

const wrapperStyle = computed(() => ({
  ...layoutStyle.value,
  position: 'absolute',
  zIndex: layoutStyle.value.zIndex || 0,
  cursor: 'pointer',
  userSelect: 'none',
  boxSizing: 'border-box',
}))

const innerStyle = computed(() => ({
  ...visualStyle.value,
  width: '100%',
  height: '100%',
  boxSizing: 'border-box',
}))

const handleMouseDown = (e: MouseEvent) => {
  e.stopPropagation()

  if (e.shiftKey || e.ctrlKey || e.metaKey) {
    compStore.toggleSelection(props.node.id)
  } else {
    // If already selected, don't deselect others yet (allows dragging selection)
    // Deselect logic usually happens on mouseup or click if no drag occurred
    if (!isSelected.value) {
      compStore.selectComponent(props.node.id)
    }
  }
}

const handleClick = (e: MouseEvent) => {
  e.stopPropagation()
}
</script>

<style scoped>
.component-node {
  /* Default behaviors */
  touch-action: none;
  transform-origin: center center;
}

/* Optional: Outline on hover/selection for better visibility */
.component-node:hover {
  outline: 1px solid rgba(64, 158, 255, 0.5);
}

.component-node.is-selected {
  /* Selection is mainly handled by SelectionLayer, but we might want a subtle indicator here too?
     Usually SelectionLayer covers it. Let's keep it clean. */
}
</style>
