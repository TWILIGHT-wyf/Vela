<template>
  <div class="selection-layer">
    <!-- Page-grid editor placeholder. Keep this layer so future canvas-wide overlays
         can mount without reshaping the viewport/component structure again. -->
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.selection-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
