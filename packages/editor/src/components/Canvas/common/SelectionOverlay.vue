<template>
  <div class="selection-overlay" :class="{ active: isActive }">
    <div class="selection-border"></div>

    <div v-if="label" class="selection-label">{{ label }}</div>

    <div v-if="showToolbar" class="selection-toolbar">
      <button class="toolbar-btn" @click.stop="$emit('copy')">复制</button>
      <button class="toolbar-btn" @click.stop="$emit('delete')">删除</button>
      <button
        v-if="showSelectParent"
        class="toolbar-btn"
        @click.stop="$emit('select-parent')"
      >
        选中父级
      </button>
    </div>

    <div
      v-for="handle in handles"
      :key="handle"
      class="resize-handle"
      :class="handle"
      @mousedown.stop="$emit('resize-start', handle, $event)"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isActive: boolean
  label?: string
  parentLabel?: string
  handles: string[]
  showToolbar?: boolean
  showRotate?: boolean
  showSelectParent?: boolean
}>()

defineEmits<{
  (e: 'resize-start', handle: string, event: MouseEvent): void
  (e: 'delete'): void
  (e: 'copy'): void
  (e: 'select-parent'): void
}>()
</script>

<style scoped>
.selection-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.selection-overlay.active {
  pointer-events: none;
}

.selection-border {
  position: absolute;
  inset: 0;
  border: 2px solid #409eff;
  box-sizing: border-box;
}

.selection-label {
  position: absolute;
  top: -22px;
  left: -2px;
  background: #409eff;
  color: #fff;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 2px 2px 2px 0;
  white-space: nowrap;
  pointer-events: none;
}

.selection-toolbar {
  position: absolute;
  top: -30px;
  right: 0;
  display: flex;
  gap: 6px;
  pointer-events: auto;
}

.toolbar-btn {
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #374151;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  cursor: pointer;
}

.toolbar-btn:hover {
  border-color: #409eff;
  color: #409eff;
}

.resize-handle {
  width: 8px;
  height: 8px;
  background: #fff;
  border: 1px solid #409eff;
  position: absolute;
  pointer-events: auto;
  box-sizing: border-box;
}

.resize-handle.e {
  top: 50%;
  right: -5px;
  transform: translateY(-50%);
  cursor: ew-resize;
}
.resize-handle.s {
  left: 50%;
  bottom: -5px;
  transform: translateX(-50%);
  cursor: ns-resize;
}
.resize-handle.se {
  right: -5px;
  bottom: -5px;
  cursor: nwse-resize;
}
</style>
