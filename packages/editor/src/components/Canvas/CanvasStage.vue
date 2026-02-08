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

    const componentName = data.component || data.componentName
    if (!componentName) {
      console.warn('[CanvasStage] Drop data missing component name:', data)
      return
    }

    // Convert client coordinates to stage coordinates
    const stageCoords = canvasContext.toStageCoords(e.clientX, e.clientY)

    const width = data.width || data.style?.width || 120
    const height = data.height || data.style?.height || 80

    // Create new component with calculated position
    const newComponent: Partial<NodeSchema> = {
      id: `comp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      component: componentName,
      props: data.props || {},
      style: {
        width,
        height,
      },
      geometry: {
        mode: 'free' as const,
        x: Math.round(stageCoords.x),
        y: Math.round(stageCoords.y),
        width,
        height,
        zIndex: 0,
      },
      children: data.children || [],
    }

    // Add to store and select
    const newId = compStore.addComponent(null, newComponent as NodeSchema)
    if (newId) {
      compStore.selectComponent(newId)
    }

    console.log('[CanvasStage] Component dropped:', componentName, stageCoords)
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
  /* 移除 overflow: hidden，避免裁剪图表等组件的标题、轴名称等内容 */
  overflow: visible;
}
</style>
