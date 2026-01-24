<template>
  <div :style="containerStyle">
    <el-image
      v-if="url"
      :src="url"
      :style="imageStyle"
      :fit="fit"
      :lazy="lazy"
      :preview-src-list="preview ? [url] : undefined"
      :z-index="previewZIndex"
      :initial-index="0"
      :hide-on-click-modal="hideOnClickModal"
      :preview-teleported="true"
    >
      <template #error>
        <div class="image-error">
          <el-icon><Picture /></el-icon>
          <span>{{ errorText }}</span>
        </div>
      </template>
      <template #placeholder>
        <div class="image-loading">
          <el-icon class="is-loading"><Loading /></el-icon>
        </div>
      </template>
    </el-image>
    <div v-else class="image-placeholder">
      <el-icon><Picture /></el-icon>
      <span>{{ placeholder }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'
import { Picture, Loading } from '@element-plus/icons-vue'
import { ElImage, ElIcon } from 'element-plus'

const props = withDefaults(
  defineProps<{
    url?: string
    fit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'
    lazy?: boolean
    preview?: boolean
    previewZIndex?: number
    hideOnClickModal?: boolean
    placeholder?: string
    errorText?: string
    backgroundColor?: string
    borderRadius?: number
    border?: string
    objectFit?: string
    opacity?: number
  }>(),
  {
    url: '',
    fit: 'cover',
    lazy: true,
    preview: false,
    previewZIndex: 2000,
    hideOnClickModal: true,
    placeholder: '请设置图片地址',
    errorText: '图片加载失败',
    backgroundColor: 'transparent',
    borderRadius: 0,
    border: 'none',
    objectFit: 'cover',
    opacity: 100,
  },
)

// 样式
const containerStyle = computed<CSSProperties>(() => ({
  width: '100%',
  height: '100%',
  display: 'flex',
  justifyContent: props.objectFit === 'contain' ? 'center' : 'flex-start',
  alignItems: props.objectFit === 'contain' ? 'center' : 'flex-start',
  backgroundColor: props.backgroundColor,
  borderRadius: `${props.borderRadius}px`,
  overflow: 'hidden',
  border: props.border,
}))

const imageStyle = computed<CSSProperties>(() => ({
  width: '100%',
  height: '100%',
  objectFit: props.objectFit as CSSProperties['objectFit'],
  opacity: props.opacity / 100,
}))
</script>

<style scoped>
.image-error,
.image-loading,
.image-placeholder {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  color: #909399;
  font-size: 14px;
  gap: 8px;
  background-color: #f5f7fa;
}

.image-error .el-icon,
.image-loading .el-icon,
.image-placeholder .el-icon {
  font-size: 48px;
  color: #c0c4cc;
}

.is-loading {
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
