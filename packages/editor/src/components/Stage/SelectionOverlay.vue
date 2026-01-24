<template>
  <div class="selection-overlay" :style="{ pointerEvents: 'none' as const }">
    <!-- 吸附线层 -->
    <div :style="snapLayerStyle">
      <SnapLines :lines="snapLines" />
    </div>

    <!-- 选中框 -->
    <div
      v-if="selectedId && rect"
      class="selection-box"
      :style="boxStyle"
      @mousedown="handleMouseDown"
    >
      <!-- 8个控制点 -->
      <div class="resize-handle handle-tl" @mousedown="handleResizeStart('tl', $event)" />
      <div class="resize-handle handle-t" @mousedown="handleResizeStart('t', $event)" />
      <div class="resize-handle handle-tr" @mousedown="handleResizeStart('tr', $event)" />
      <div class="resize-handle handle-r" @mousedown="handleResizeStart('r', $event)" />
      <div class="resize-handle handle-br" @mousedown="handleResizeStart('br', $event)" />
      <div class="resize-handle handle-b" @mousedown="handleResizeStart('b', $event)" />
      <div class="resize-handle handle-bl" @mousedown="handleResizeStart('bl', $event)" />
      <div class="resize-handle handle-l" @mousedown="handleResizeStart('l', $event)" />

      <!-- 标签 -->
      <div class="selection-label">{{ componentLabel }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useComponent } from '@/stores/component'
import { useCanvasStore } from '@/stores/canvas'
import { useSnap, type SnapLine } from '@/composables/useSnap'
import SnapLines from './SnapLines.vue'

const compStore = useComponent()
const canvasStore = useCanvasStore()
const { selectedId } = storeToRefs(compStore)
const { calcSnap, clearSnap, snapLines } = useSnap(5)

// 当前选中元素的 DOM Rect (相对于视口)
const rect = ref<{ x: number; y: number; width: number; height: number } | null>(null)
let rafId: number | null = null

// 轮询更新 Rect (简单粗暴但有效，特别是 Flow 模式下)
const updateRect = () => {
  if (!selectedId.value) {
    rect.value = null
    return
  }

  // 查找对应 DOM
  // NodeWrapper 渲染了 data-node-id
  const el = document.querySelector(`[data-node-id="${selectedId.value}"]`)

  if (el) {
    const r = el.getBoundingClientRect()
    // 获取 Canvas 视口的位置，因为 rect 是相对于视口的
    // Overlay 也是相对于视口的 (fixed/absolute top:0 left:0 of canvas-viewport)
    // 但我们需要考虑 canvas-overlay 的父级 offset

    // 简单起见，假设 selection-overlay 铺满整个 viewport 且 position: absolute
    // 那么 getBoundingClientRect 的值需要减去 viewport 的 offset

    const viewport = document.querySelector('.editor-canvas-viewport')
    const vpRect = viewport?.getBoundingClientRect() || { left: 0, top: 0 }

    rect.value = {
      x: r.left - vpRect.left,
      y: r.top - vpRect.top,
      width: r.width,
      height: r.height,
    }
  } else {
    // 可能是刚切换页面，DOM 还没渲染
    rect.value = null
  }

  rafId = requestAnimationFrame(updateRect)
}

watch(
  selectedId,
  (newId) => {
    if (newId) {
      if (!rafId) updateRect()
    } else {
      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
      rect.value = null
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
})

const handleResizeStart = (type: string, e: MouseEvent) => {
  e.stopPropagation()
  e.preventDefault()

  const startX = e.clientX
  const startY = e.clientY
  const node = compStore.selectedNode
  if (!node || !node.style) return

  const startNode = {
    x: (node.style.x as number) || 0,
    y: (node.style.y as number) || 0,
    w:
      (typeof node.style.width === 'number'
        ? node.style.width
        : parseFloat(String(node.style.width))) || 100,
    h:
      (typeof node.style.height === 'number'
        ? node.style.height
        : parseFloat(String(node.style.height))) || 100,
  }

  const onMove = (ev: MouseEvent) => {
    const dx = (ev.clientX - startX) / canvasStore.scale
    const dy = (ev.clientY - startY) / canvasStore.scale

    let { x, y, w, h } = startNode

    if (type.includes('r')) w += dx
    if (type.includes('b')) h += dy
    if (type.includes('l')) {
      x += dx
      w -= dx
    }
    if (type.includes('t')) {
      y += dy
      h -= dy
    }

    if (w < 10) w = 10
    if (h < 10) h = 10

    compStore.updateStyle(selectedId.value!, { x, y, width: w, height: h })
  }

  const onUp = () => {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

const handleMouseDown = (e: MouseEvent) => {
  if (!selectedId.value) return

  e.stopPropagation()
  e.preventDefault()

  const startX = e.clientX
  const startY = e.clientY

  const node = compStore.selectedNode
  if (!node || !node.style) return

  const startNodeX = (node.style.x as number) || 0
  const startNodeY = (node.style.y as number) || 0

  const onMove = (ev: MouseEvent) => {
    const dx = ev.clientX - startX
    const dy = ev.clientY - startY
    const scale = canvasStore.scale

    const rawX = startNodeX + dx / scale
    const rawY = startNodeY + dy / scale

    // 吸附计算
    const siblings = compStore.rootNode?.children?.filter((n) => n.id !== selectedId.value) || []
    const currentRect = {
      x: rawX,
      y: rawY,
      w:
        (typeof node.style.width === 'number'
          ? node.style.width
          : parseFloat(String(node.style.width))) || 100,
      h:
        (typeof node.style.height === 'number'
          ? node.style.height
          : parseFloat(String(node.style.height))) || 100,
    }

    const snapped = calcSnap(currentRect, siblings)

    compStore.updateStyle(selectedId.value!, { x: snapped.x, y: snapped.y })
  }

  const onUp = () => {
    clearSnap()
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

const snapLayerStyle = computed(() => ({
  transform: `translate(${canvasStore.offsetX}px, ${canvasStore.offsetY}px) scale(${canvasStore.scale})`,
  transformOrigin: '0 0',
  position: 'absolute' as const,
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none' as const,
  zIndex: 9998,
}))

// 计算样式
const boxStyle = computed(() => {
  if (!rect.value) return { display: 'none' }

  return {
    transform: `translate(${rect.value.x}px, ${rect.value.y}px)`,
    width: `${rect.value.width}px`,
    height: `${rect.value.height}px`,
    position: 'absolute',
    left: 0,
    top: 0,
    border: '2px solid #409eff',
    pointerEvents: 'all', // 允许捕获点击以进行拖拽
    backgroundColor: 'transparent',
    zIndex: 9999,
  }
})

const componentLabel = computed(() => {
  if (!selectedId.value) return ''
  const node = compStore.selectedNode
  return node?.title || node?.componentName || selectedId.value
})
</script>

<style scoped>
.selection-overlay {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.selection-box {
  box-sizing: border-box;
}

.resize-handle {
  width: 8px;
  height: 8px;
  background: #fff;
  border: 1px solid #409eff;
  position: absolute;
  pointer-events: auto; /* 手柄可点击 */
}

/* 手柄位置 */
.handle-tl {
  top: -5px;
  left: -5px;
  cursor: nwse-resize;
}
.handle-t {
  top: -5px;
  left: 50%;
  transform: translateX(-50%);
  cursor: ns-resize;
}
.handle-tr {
  top: -5px;
  right: -5px;
  cursor: nesw-resize;
}
.handle-r {
  top: 50%;
  right: -5px;
  transform: translateY(-50%);
  cursor: ew-resize;
}
.handle-br {
  bottom: -5px;
  right: -5px;
  cursor: nwse-resize;
}
.handle-b {
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  cursor: ns-resize;
}
.handle-bl {
  bottom: -5px;
  left: -5px;
  cursor: nesw-resize;
}
.handle-l {
  top: 50%;
  left: -5px;
  transform: translateY(-50%);
  cursor: ew-resize;
}

.selection-label {
  position: absolute;
  top: -24px;
  left: -2px;
  background: #409eff;
  color: #fff;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 2px 2px 2px 0;
  white-space: nowrap;
}
</style>
