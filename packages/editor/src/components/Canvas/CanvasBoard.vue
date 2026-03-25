<template>
  <div class="canvas-board-wrapper" data-testid="canvas-board">
    <!-- Infinite canvas viewport (Figma-like) -->
    <CanvasViewport>
      <!-- 默认编辑画布嵌入在无限画布内 -->
      <EditorCanvas embedded />
    </CanvasViewport>
  </div>
</template>

<script setup lang="ts">
import CanvasViewport from './CanvasViewport.vue'
import EditorCanvas from './EditorCanvas.vue'
</script>

<style scoped>
.canvas-board-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}
</style>
