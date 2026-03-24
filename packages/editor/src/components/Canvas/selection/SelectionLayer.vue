<template>
  <div class="selection-layer">
    <!-- Free/coordinate overlays removed in grid-only editor -->
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
