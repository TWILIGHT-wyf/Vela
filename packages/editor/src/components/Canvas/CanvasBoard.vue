<template>
  <div class="canvas-board-wrapper" data-testid="canvas-board">
    <!-- Infinite canvas viewport (Figma-like) -->
    <CanvasViewport>
      <!-- Flow 画布嵌入在无限画布内 -->
      <FlowCanvas embedded />
    </CanvasViewport>
  </div>
</template>

<script setup lang="ts">
import CanvasViewport from './CanvasViewport.vue'
import FlowCanvas from './modes/Flow/FlowCanvas.vue'
</script>

<style scoped>
.canvas-board-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}
</style>
