<template>
  <div :style="containerStyle" class="iframe-container">
    <iframe
      v-if="url"
      :src="url"
      :style="iframeStyle"
      :title="title"
      :sandbox="sandbox"
      :allow="allow"
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
    ></iframe>
    <!-- 遮罩层：防止 iframe 拦截鼠标事件（编辑模式） -->
    <div v-if="url && showMask" class="iframe-mask"></div>
    <div v-else-if="!url" class="iframe-placeholder">
      <el-icon><Link /></el-icon>
      <span>{{ placeholder }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'
import { Link } from '@element-plus/icons-vue'
import { ElIcon } from 'element-plus'

const props = withDefaults(
  defineProps<{
    url?: string
    title?: string
    sandbox?: string
    allow?: string
    placeholder?: string
    showMask?: boolean
    backgroundColor?: string
    borderRadius?: number
    border?: string
    opacity?: number
  }>(),
  {
    url: '',
    title: 'iframe',
    sandbox: undefined,
    allow: undefined,
    placeholder: '请设置 iframe 地址',
    showMask: true,
    backgroundColor: '#ffffff',
    borderRadius: 0,
    border: '1px solid #dcdfe6',
    opacity: 100,
  },
)

// 样式
const containerStyle = computed<CSSProperties>(() => ({
  width: '100%',
  height: '100%',
  backgroundColor: props.backgroundColor,
  borderRadius: `${props.borderRadius}px`,
  overflow: 'hidden',
  border: props.border,
}))

const iframeStyle = computed<CSSProperties>(() => ({
  width: '100%',
  height: '100%',
  border: 'none',
  opacity: props.opacity / 100,
}))
</script>

<style scoped>
.iframe-container {
  position: relative;
}

.iframe-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  z-index: 1;
  pointer-events: auto;
}

/* 运行时模式下移除遮罩 */
:global(.runtime-mode) .iframe-mask {
  display: none;
}

.iframe-placeholder {
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

.iframe-placeholder .el-icon {
  font-size: 48px;
  color: #c0c4cc;
}
</style>
