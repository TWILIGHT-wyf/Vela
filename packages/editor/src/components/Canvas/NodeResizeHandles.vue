<template>
  <div
    v-for="handle in handles"
    :key="handle"
    class="grid-resize-handle"
    :class="`handle-${handle}`"
    @mousedown.stop.prevent="emit('start', handle, $event)"
  />
</template>

<script setup lang="ts">
const handles = ['n', 'e', 's', 'w', 'nw', 'ne', 'se', 'sw'] as const

export type GridResizeHandle = (typeof handles)[number]

const emit = defineEmits<{
  start: [handle: GridResizeHandle, event: MouseEvent]
}>()
</script>

<style scoped>
.grid-resize-handle {
  position: absolute;
  background: #ffffff;
  border: 1px solid #0d99ff;
  border-radius: 2px;
  box-shadow: 0 1px 3px rgba(13, 153, 255, 0.28);
  z-index: 12;
}

.grid-resize-handle.handle-n {
  top: -10px;
  left: 50%;
  width: 20px;
  height: 8px;
  transform: translateX(-50%);
  cursor: ns-resize;
}

.grid-resize-handle.handle-s {
  bottom: -10px;
  left: 50%;
  width: 20px;
  height: 8px;
  transform: translateX(-50%);
  cursor: ns-resize;
}

.grid-resize-handle.handle-e {
  top: 50%;
  right: -10px;
  width: 8px;
  height: 20px;
  transform: translateY(-50%);
  cursor: ew-resize;
}

.grid-resize-handle.handle-w {
  top: 50%;
  left: -10px;
  width: 8px;
  height: 20px;
  transform: translateY(-50%);
  cursor: ew-resize;
}

.grid-resize-handle.handle-nw {
  top: -11px;
  left: -11px;
  width: 10px;
  height: 10px;
  cursor: nwse-resize;
}

.grid-resize-handle.handle-ne {
  top: -11px;
  right: -11px;
  width: 10px;
  height: 10px;
  cursor: nesw-resize;
}

.grid-resize-handle.handle-se {
  right: -11px;
  bottom: -11px;
  width: 10px;
  height: 10px;
  cursor: nwse-resize;
}

.grid-resize-handle.handle-sw {
  bottom: -11px;
  left: -11px;
  width: 10px;
  height: 10px;
  cursor: nesw-resize;
}
</style>
