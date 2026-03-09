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
    <ErrorBoundary :component-name="componentName" @error="handleRenderError">
      <!-- Actual Component -->
      <component
        v-if="isResolved"
        :is="componentRef"
        v-bind="resolvedProps"
        :style="innerStyle"
        :data-id="node.id"
        :data-component="node.component"
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
        :data-component="node.component"
        :style="innerStyle"
      >
        <div class="unresolved-label">{{ node.component }} (未找到)</div>
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
    </ErrorBoundary>
  </component>
</template>

<script setup lang="ts">
import { computed, toRef, type Component, type CSSProperties } from 'vue'
import type { FlowContainerLayout, GridTrack, NodeSchema, GridContainerLayout } from '@vela/core'
import { getComponent, hasComponent } from '@vela/materials'
import { useDataSourceAdapter } from '@/composables/useDataSourceAdapter'
import { useComponent } from '@/stores/component'
import ErrorBoundary from '@/components/common/ErrorBoundary.vue'

defineOptions({
  name: 'UniversalRenderer',
  inheritAttrs: false,
})

const props = defineProps<{
  node: NodeSchema
  wrapper: Component
  parentLayoutMode?: 'free' | 'flow' | 'grid'
}>()

const componentName = computed(() => props.node.component || props.node.componentName || '')

// Component Resolution
const isResolved = computed(() => {
  return hasComponent(componentName.value)
})
const componentRef = computed(() => {
  return getComponent(componentName.value)
})

// Error Handling
function handleRenderError(error: Error, info: string) {
  console.error(
    `[UniversalRenderer] Component "${componentName.value}" (id: ${props.node.id}) render error:`,
    error,
    info,
  )
}

// Data Source Adapter
const nodeRef = toRef(props, 'node')
const { resolvedProps } = useDataSourceAdapter(nodeRef)

const componentStore = useComponent()

const normalizeLayoutMode = (
  mode: 'free' | 'flow' | 'grid' | undefined,
): 'free' | 'flow' | 'grid' => {
  if (mode === 'free') return 'free'
  if (mode === 'flow') return 'flow'
  return 'grid'
}

const effectiveParentLayoutMode = computed(() => normalizeLayoutMode(props.parentLayoutMode))
const selfChildrenLayoutMode = computed(() => {
  const childMode = props.node.container?.mode
  if (childMode === undefined) return effectiveParentLayoutMode.value
  return normalizeLayoutMode(childMode)
})

const trackToCss = (track: GridTrack): string => {
  if (!track) return '1fr'
  if (track.unit === 'auto') return 'auto'
  if (track.unit === 'fr') {
    const value = Number.isFinite(track.value) ? Number(track.value) : 1
    return `${Math.max(0.1, Math.round(value * 100) / 100)}fr`
  }
  if (track.unit === 'px') {
    const value = Number.isFinite(track.value) ? Number(track.value) : 1
    return `${Math.max(1, Math.round(value))}px`
  }
  if (track.unit === 'minmax') {
    const min = track.min === 'auto' ? 'auto' : `${Math.max(1, Number(track.min || 1))}px`
    const max = track.max === 'auto' ? 'auto' : `${Math.max(1, Number(track.max || 1))}px`
    return `minmax(${min}, ${max})`
  }
  return '1fr'
}

const tracksToTemplate = (tracks: GridTrack[] | undefined, fallback: string): string => {
  if (!Array.isArray(tracks) || tracks.length === 0) return fallback
  return tracks.map((track) => trackToCss(track)).join(' ')
}

const toAutoFitColumns = (minWidth?: number): string => {
  const safeMinWidth = Math.max(120, Math.round(Number(minWidth ?? 280)))
  return `repeat(auto-fit, minmax(${safeMinWidth}px, 1fr))`
}

// Style Logic: Only strip sizing properties managed by wrapper
// With layout/style separation, free-mode geometry lives in node.geometry
const innerStyle = computed<CSSProperties>(() => {
  // Subscribe to styleVersion to ensure reactive updates during drag (padding, etc.)
  void componentStore.styleVersion[props.node.id]
  if (!props.node.style) return {}
  const style = { ...(props.node.style as CSSProperties) }

  // Size properties are managed by the wrapper (NodeWrapper/FreeWrapper)
  delete style.width
  delete style.height
  delete style.minHeight
  delete style.margin
  delete style.marginTop
  delete style.marginRight
  delete style.marginBottom
  delete style.marginLeft

  // Free layout containers need a positioning context for absolute children
  if (props.node.container?.mode === 'free') {
    style.position = 'relative'
  }

  if (props.node.container?.mode === 'flow') {
    const flowContainer = props.node.container as FlowContainerLayout
    style.display = 'flex'
    style.flexDirection = flowContainer.direction || 'row'
    style.flexWrap = flowContainer.wrap || 'wrap'
    style.justifyContent = flowContainer.justify || 'flex-start'
    style.alignItems = flowContainer.align || 'stretch'
    style.alignContent = flowContainer.alignContent || 'stretch'
    if (flowContainer.gap !== undefined) {
      style.gap =
        typeof flowContainer.gap === 'number' ? `${flowContainer.gap}px` : flowContainer.gap
    } else {
      style.gap = '8px'
    }
    style.width = '100%'
    style.height = '100%'
  }

  // Grid containers: apply the fr-based grid template on the inner component element.
  // This is the element that directly wraps the slot/children, so child NodeWrappers
  // become proper CSS grid items of this container (not of the outer NodeWrapper div).
  if (props.node.container?.mode === 'grid') {
    const gridContainer = props.node.container as GridContainerLayout
    style.display = 'grid'
    style.gridTemplateColumns =
      gridContainer.templateMode === 'autoFit'
        ? toAutoFitColumns(gridContainer.autoFitMinWidth)
        : tracksToTemplate(gridContainer.columnTracks, gridContainer.columns || '1fr')
    style.gridTemplateRows =
      gridContainer.templateMode === 'autoFit' || gridContainer.rowTracks === 'auto'
        ? 'none'
        : tracksToTemplate(
            Array.isArray(gridContainer.rowTracks) ? gridContainer.rowTracks : undefined,
            gridContainer.rows || '1fr',
          )
    style.gap = `${gridContainer.gapY ?? gridContainer.gap ?? 8}px ${gridContainer.gapX ?? gridContainer.gap ?? 8}px`
    if (gridContainer.templateMode === 'autoFit' || gridContainer.rowTracks === 'auto') {
      style.gridAutoRows = `minmax(${gridContainer.autoRowsMin ?? 24}px, auto)`
    }
    style.width = '100%'
    style.height = '100%'
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
