<template>
  <div class="canvas-board-wrapper">
    <!-- Infinite canvas viewport (Figma-like) -->
    <CanvasViewport>
      <!-- Flow 画布嵌入在无限画布内 -->
      <FlowCanvas embedded />

      <template #overlay>
        <SelectionLayer v-if="showSelectionLayer" />
      </template>
    </CanvasViewport>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useUIStore } from '@/stores/ui'
import { useCanvasStore } from '@/stores/canvas'
import { useComponent } from '@/stores/component'
import CanvasViewport from './CanvasViewport.vue'
import SelectionLayer from './selection/SelectionLayer.vue'
import FlowCanvas from './modes/Flow/FlowCanvas.vue'

const uiStore = useUIStore()
const canvasStore = useCanvasStore()
const componentStore = useComponent()
const { canvasScale } = storeToRefs(uiStore)
const { rootNode } = storeToRefs(componentStore)

const showSelectionLayer = computed(() => rootNode.value?.container?.mode === 'free')

// Sync zoom scale between legacy canvas store and new UI store
watch(
  () => canvasStore.scale,
  (scale) => {
    if (Math.abs(scale - canvasScale.value) > 0.001) {
      uiStore.setCanvasScale(scale)
    }
  },
  { immediate: true },
)

watch(
  canvasScale,
  (scale) => {
    if (Math.abs(scale - canvasStore.scale) > 0.001) {
      canvasStore.setScale(scale)
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.canvas-board-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}
</style>
