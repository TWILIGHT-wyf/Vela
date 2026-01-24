<template>
  <div
    class="editor-canvas-viewport"
    ref="viewportRef"
    :style="{ cursor: canvasStore.cursorStyle }"
    @wheel.prevent="handleWheel"
    @mousedown="handleMouseDown"
    @dragover="handleDragOver"
    @drop="handleDrop"
  >
    <!-- 
      背景网格层 
      独立于 ContentLayer，直接通过 CSS 变量控制，避免重绘
      使用 background-position 实现视差/跟随
    -->
    <div class="canvas-background" :style="backgroundStyle" />

    <!-- 
      变换层 (World)
      应用 Scale 和 Translate
    -->
    <div class="canvas-transform-layer" :style="transformStyle">
      <!-- 
        内容层 (Content)
        这里将渲染 RuntimeRenderer
      -->
      <div class="canvas-content">
        <slot />
      </div>
    </div>

    <!-- 辅助 UI 层 (Overlay) -->
    <div class="canvas-overlay">
      <!-- 选中框 + 吸附线 -->
      <SelectionOverlay />
      <!-- 标尺等辅助组件将放在这里 -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCanvasStore } from '../../stores/canvas'
import { useComponent } from '@/stores/component'
import SelectionOverlay from './SelectionOverlay.vue'
import type { NodeSchema } from '@vela/core'

const canvasStore = useCanvasStore()
const compStore = useComponent()
const viewportRef = ref<HTMLElement>()

// --- Styles ---

const transformStyle = computed(() => ({
  transform: `translate(${canvasStore.offsetX}px, ${canvasStore.offsetY}px) scale(${canvasStore.scale})`,
  transformOrigin: '0 0', // 变换原点设为左上角，坐标计算更简单
}))

const backgroundStyle = computed(() => {
  const gridSize = 20 * canvasStore.scale
  return {
    backgroundPosition: `${canvasStore.offsetX}px ${canvasStore.offsetY}px`,
    backgroundSize: `${gridSize}px ${gridSize}px`,
    backgroundImage: `
      linear-gradient(to right, #f0f0f0 1px, transparent 1px),
      linear-gradient(to bottom, #f0f0f0 1px, transparent 1px)
    `,
  }
})

// --- Interactions ---

// 拖拽入场
const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'copy'
  }
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  const data = e.dataTransfer?.getData('application/x-vela')
  if (!data) return

  try {
    const nodeSchema = JSON.parse(data) as NodeSchema

    // 计算放置位置
    // Mouse (client) -> Canvas (local)
    if (viewportRef.value) {
      const viewport = viewportRef.value.getBoundingClientRect()
      const mouseX = e.clientX - viewport.left
      const mouseY = e.clientY - viewport.top

      const x = (mouseX - canvasStore.offsetX) / canvasStore.scale
      const y = (mouseY - canvasStore.offsetY) / canvasStore.scale

      // 更新位置
      nodeSchema.style = {
        ...nodeSchema.style,
        x,
        y,
      }
    }

    // 添加到根节点 (TODO: 如果拖入容器，需要 hit testing)
    compStore.addComponent(null, nodeSchema)
  } catch (err) {
    console.error('Drop failed', err)
  }
}

// 滚轮缩放 / 平移
const handleWheel = (e: WheelEvent) => {
  if (e.ctrlKey || e.metaKey) {
    // Cmd + Wheel -> Zoom
    const delta = -e.deltaY * 0.001
    const newScale = canvasStore.scale + delta

    // 定点缩放计算 (Advanced)
    // 目前先做中心缩放或简单的增量
    canvasStore.setScale(newScale)
  } else {
    // Wheel -> Pan
    canvasStore.pan(-e.deltaX, -e.deltaY)
  }
}

// 鼠标拖拽平移 (Space Mode)
const handleMouseDown = (e: MouseEvent) => {
  // 中键 (1) 或者 (左键 (0) + 空格) 触发平移
  if (e.button === 1 || (e.button === 0 && canvasStore.isSpacePressed)) {
    canvasStore.isPanning = true

    const startX = e.clientX
    const startY = e.clientY
    const startOffsetX = canvasStore.offsetX
    const startOffsetY = canvasStore.offsetY

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      canvasStore.setOffset(startOffsetX + dx, startOffsetY + dy)
    }

    const onUp = () => {
      canvasStore.isPanning = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }
}

// 全局键盘监听 (Space 键状态)
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.code === 'Space' && !e.repeat && !e.target?.['tagName']?.match(/INPUT|TEXTAREA/)) {
    canvasStore.isSpacePressed = true
  }
}

const handleKeyUp = (e: KeyboardEvent) => {
  if (e.code === 'Space') {
    canvasStore.isSpacePressed = false
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
})
</script>

<style scoped>
.editor-canvas-viewport {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  /* Floating Sheet Look */
  background-color: #fff;
  border-radius: var(--radius-card); /* 24px */
  box-shadow: var(--shadow-card);
  border: 1px solid var(--border-light);
  user-select: none; /* 防止拖拽时选中文字 */
  transition: box-shadow 0.3s ease;
}

.editor-canvas-viewport:hover {
  box-shadow: var(--shadow-hover);
}

.canvas-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* 背景不响应鼠标 */
  z-index: 0;
}

.canvas-transform-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  /* 优化性能: 提升为合成层 */
  will-change: transform;
}

.canvas-content {
  /* 画布内容的实际容器，尺寸由内部内容决定，但通常很大 */
  /* 在无限画布模式下，这个 div 只是一个锚点 */
}

.canvas-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  pointer-events: none;
}
</style>
