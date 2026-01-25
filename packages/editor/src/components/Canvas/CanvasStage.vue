<template>
  <div
    class="canvas-stage"
    :style="stageStyle"
    @click="handleStageClick"
    @dragover.prevent="handleDragOver"
    @drop="handleDrop"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { NodeSchema } from '@vela/core'
import { useCanvasContext } from './composables/useCanvasContext'
import { useComponent } from '@/stores/component'

interface Props {
  /** Stage width in pixels */
  width: number
  /** Stage height in pixels */
  height: number
  /** Background color */
  backgroundColor?: string
  /** Show internal grid */
  showGrid?: boolean
  /** Grid size */
  gridSize?: number
  /** Grid color */
  gridColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  backgroundColor: '#ffffff',
  showGrid: false,
  gridSize: 20,
  gridColor: 'rgba(0, 0, 0, 0.05)',
})

const emit = defineEmits<{
  /** Emitted when clicking empty area of stage */
  (e: 'click-empty'): void
}>()

const canvasContext = useCanvasContext()
const compStore = useComponent()

const stageStyle = computed(() => {
  const base: Record<string, string> = {
    width: `${props.width}px`,
    height: `${props.height}px`,
    backgroundColor: props.backgroundColor,
  }

  if (props.showGrid) {
    base.backgroundImage = `
      linear-gradient(to right, ${props.gridColor} 1px, transparent 1px),
      linear-gradient(to bottom, ${props.gridColor} 1px, transparent 1px)
    `
    base.backgroundSize = `${props.gridSize}px ${props.gridSize}px`
  }

  return base
})

/**
 * Handle click on stage (empty area)
 */
const handleStageClick = (e: MouseEvent) => {
  // Only handle clicks directly on the stage, not on children
  if (e.target === e.currentTarget) {
    compStore.clearSelection()
    emit('click-empty')
  }
}

/**
 * Handle drag over for component drops
 */
const handleDragOver = (e: DragEvent) => {
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'copy'
  }
}

/**
 * Handle drop of new components
 */
const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()

  const dataStr =
    e.dataTransfer?.getData('application/x-vela') || e.dataTransfer?.getData('text/plain')

  if (!dataStr) {
    console.warn('[CanvasStage] No valid drop data')
    return
  }

  try {
    const data = JSON.parse(dataStr)

    if (!data.componentName) {
      console.warn('[CanvasStage] Drop data missing componentName:', data)
      return
    }

    // Convert client coordinates to stage coordinates
    const stageCoords = canvasContext.toStageCoords(e.clientX, e.clientY)

    // Create new component with calculated position
    const newComponent: Partial<NodeSchema> = {
      id: `comp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      componentName: data.componentName,
      props: data.props || {},
      style: {
        x: Math.round(stageCoords.x),
        y: Math.round(stageCoords.y),
        width: data.style?.width || data.width || 120,
        height: data.style?.height || data.height || 80,
        zIndex: 0,
      },
      children: data.children || [],
    }

    // Add to store and select
    const newId = compStore.addComponent(null, newComponent as NodeSchema)
    if (newId) {
      compStore.selectComponent(newId)
    }

    console.log('[CanvasStage] Component dropped:', newComponent.componentName, stageCoords)
  } catch (err) {
    console.error('[CanvasStage] Drop error:', err)
  }
}
</script>

<style scoped>
.canvas-stage {
  position: relative;
  box-shadow:
    0 2px 12px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  border-radius: 2px;
  overflow: hidden;
}
</style>
