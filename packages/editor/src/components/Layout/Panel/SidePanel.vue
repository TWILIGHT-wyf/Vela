<template>
  <div class="vela-side-panel">
    <div class="panel-header">
      <span class="panel-title">{{ title }}</span>
      <div class="panel-actions">
        <slot name="actions" />
      </div>
    </div>
    <div class="panel-body">
      <el-scrollbar>
        <slot />
      </el-scrollbar>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
}

defineProps<Props>()
</script>

<style scoped>
.vela-side-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: transparent; /* Integrated with parent card */
}

.panel-header {
  flex-shrink: 0;
  height: 48px; /* Taller for modern feel */
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid var(--border-light);
  background: transparent;
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 0.3px;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-body {
  flex: 1;
  overflow: hidden;
}

/* Ensure el-scrollbar fills height */
.panel-body :deep(.el-scrollbar) {
  height: 100%;
}

.panel-body :deep(.el-scrollbar__view) {
  height: 100%;
  padding: 12px; /* Content breathing room */
}
</style>