<template>
  <div :style="containerStyle">
    <video
      v-if="url"
      ref="videoRef"
      :src="url"
      :poster="poster"
      :style="videoStyle"
      :controls="controls"
      :autoplay="autoplay"
      :loop="loop"
      :muted="muted"
      :preload="preload"
      :playsinline="true"
      :controlslist="noDownload ? 'nodownload' : undefined"
      :disablepictureinpicture="noPictureInPicture"
    >
      您的浏览器不支持视频播放
    </video>
    <div v-else class="video-placeholder">
      <el-icon><VideoPlay /></el-icon>
      <span>{{ placeholder }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CSSProperties } from 'vue'
import { VideoPlay } from '@element-plus/icons-vue'
import { ElIcon } from 'element-plus'

const props = withDefaults(
  defineProps<{
    url?: string
    poster?: string
    controls?: boolean
    autoplay?: boolean
    loop?: boolean
    muted?: boolean
    preload?: 'none' | 'metadata' | 'auto'
    noDownload?: boolean
    noPictureInPicture?: boolean
    placeholder?: string
    backgroundColor?: string
    borderRadius?: number
    border?: string
    objectFit?: 'fill' | 'contain' | 'cover' | 'none'
    opacity?: number
  }>(),
  {
    url: '',
    poster: '',
    controls: true,
    autoplay: false,
    loop: false,
    muted: false,
    preload: 'metadata',
    noDownload: false,
    noPictureInPicture: false,
    placeholder: '请设置视频地址',
    backgroundColor: '#000000',
    borderRadius: 0,
    border: 'none',
    objectFit: 'contain',
    opacity: 100,
  },
)

const videoRef = ref<HTMLVideoElement>()

// 样式
const containerStyle = computed<CSSProperties>(() => ({
  width: '100%',
  height: '100%',
  backgroundColor: props.backgroundColor,
  borderRadius: `${props.borderRadius}px`,
  overflow: 'hidden',
  border: props.border,
}))

const videoStyle = computed<CSSProperties>(() => ({
  width: '100%',
  height: '100%',
  objectFit: props.objectFit,
  opacity: props.opacity / 100,
}))

// 暴露方法供外部调用
defineExpose({
  play: () => videoRef.value?.play(),
  pause: () => videoRef.value?.pause(),
  getVideoElement: () => videoRef.value,
})
</script>

<style scoped>
.video-placeholder {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  color: #909399;
  font-size: 14px;
  gap: 8px;
  background-color: #000000;
}

.video-placeholder .el-icon {
  font-size: 64px;
  color: #606266;
}
</style>
