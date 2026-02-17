<template>
  <slot v-if="!hasError" />
  <div v-else class="error-boundary" :style="containerStyle">
    <div class="error-boundary-content">
      <div class="error-icon">⚠️</div>
      <div class="error-info">
        <span class="error-component-name">{{ componentName }}</span>
        <span class="error-message">渲染失败</span>
      </div>
      <button class="error-retry-btn" @click="handleRetry" title="重试渲染">↻</button>
    </div>
    <div v-if="showDetails && errorMessage" class="error-details">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured, type CSSProperties } from 'vue'

const props = withDefaults(
  defineProps<{
    componentName?: string
    showDetails?: boolean
  }>(),
  {
    componentName: '未知组件',
    showDetails: false,
  },
)

const emit = defineEmits<{
  (e: 'error', error: Error, info: string): void
}>()

const hasError = ref(false)
const errorMessage = ref('')
const retryKey = ref(0)

const containerStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  minHeight: '40px',
  minWidth: '80px',
  boxSizing: 'border-box',
}

onErrorCaptured((error: Error, _instance, info: string) => {
  hasError.value = true
  errorMessage.value = error.message || String(error)
  console.error(`[ErrorBoundary] ${props.componentName} 渲染错误:`, error, info)
  emit('error', error, info)
  // 阻止错误继续向上传播
  return false
})

function handleRetry() {
  hasError.value = false
  errorMessage.value = ''
  retryKey.value++
}
</script>

<style scoped>
.error-boundary {
  border: 2px dashed #e6a23c;
  background-color: rgba(230, 162, 60, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 4px;
}

.error-boundary-content {
  display: flex;
  align-items: center;
  gap: 6px;
}

.error-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.error-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.error-component-name {
  color: #e6a23c;
  font-size: 11px;
  font-weight: 600;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.error-message {
  color: #909399;
  font-size: 10px;
}

.error-retry-btn {
  background: rgba(230, 162, 60, 0.15);
  border: 1px solid rgba(230, 162, 60, 0.3);
  border-radius: 4px;
  color: #e6a23c;
  cursor: pointer;
  font-size: 14px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}

.error-retry-btn:hover {
  background: rgba(230, 162, 60, 0.25);
  border-color: #e6a23c;
}

.error-details {
  margin-top: 6px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 3px;
  font-size: 10px;
  color: #909399;
  max-width: 200px;
  word-break: break-all;
  text-align: center;
}
</style>
