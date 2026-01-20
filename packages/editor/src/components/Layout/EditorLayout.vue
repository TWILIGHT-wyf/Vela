<template>
  <div class="vela-layout">
    <header class="vela-layout__header">
      <slot name="header" />
    </header>

    <div class="vela-layout__body">
      <aside
        class="vela-layout__panel vela-layout__panel--left"
        :style="{ width: leftWidth + 'px' }"
      >
        <div class="vela-layout__panel-content">
          <slot name="left" />
        </div>
        <ResizeHandle ref="leftHandle" position="left" @resize-start="onLeftResizeStart" />
      </aside>

      <main class="vela-layout__main">
        <slot name="center" />
      </main>

      <aside
        class="vela-layout__panel vela-layout__panel--right"
        :style="{ width: rightWidth + 'px' }"
      >
        <ResizeHandle ref="rightHandle" position="right" @resize-start="onRightResizeStart" />
        <div class="vela-layout__panel-content">
          <slot name="right" />
        </div>
      </aside>
    </div>

    <footer class="vela-layout__footer">
      <slot name="footer" />
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount, useTemplateRef } from 'vue'
import ResizeHandle from './ResizeHandle.vue'

// 侧边栏宽度限制
const MIN_WIDTH = 200
const MAX_WIDTH = 600

// 状态
const leftWidth = ref(300)
const rightWidth = ref(340)

// 引用
const leftHandleRef = useTemplateRef<InstanceType<typeof ResizeHandle>>('leftHandle')
const rightHandleRef = useTemplateRef<InstanceType<typeof ResizeHandle>>('rightHandle')

// 拖拽状态
let isResizing = false
let startX = 0
let startWidth = 0
let currentSide: 'left' | 'right' | null = null

// 左侧面板拖拽
function startResizeLeft(e: MouseEvent) {
  startResize(e, 'left', leftWidth.value)
}
// 适配子组件事件
function handleResizeStartLeft() {
  // 模拟 MouseEvent，因为 ResizeHandle 已经在 handleMouseDown 中处理了 preventDefault
  // 我们主要需要初始坐标。但因为 startResize 需要 MouseEvent，这里从 window.event 或重新获取可能不准确
  // 更好的方式是 ResizeHandle 传递事件对象，或者 startResize 改为不依赖 event
  // 简化方案：监听 window 的 mousemove 来初始化 startX
}

// 实际上，ResizeHandle 应该传递 MouseEvent 出来，或者我们在父组件监听 mousedown
// 为了保持重构的连贯性，我们让 startResize 接收坐标而不是事件对象
function startResize(clientX: number, side: 'left' | 'right', initialWidth: number) {
  isResizing = true
  currentSide = side
  startX = clientX
  startWidth = initialWidth

  // 设置全局样式防止鼠标跳动
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'

  // 添加事件监听
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
}

function onLeftResizeStart() {
  // 获取当前鼠标位置 (hacky but works for sync event)
  // 更优雅的方式是 ResizeHandle emit event
  const e = window.event as MouseEvent
  if (e) startResize(e.clientX, 'left', leftWidth.value)
}

function onRightResizeStart() {
  const e = window.event as MouseEvent
  if (e) startResize(e.clientX, 'right', rightWidth.value)
}

// 处理鼠标移动
function handleMouseMove(e: MouseEvent) {
  if (!isResizing || !currentSide) return

  requestAnimationFrame(() => {
    const deltaX = e.clientX - startX
    let newWidth: number

    if (currentSide === 'left') {
      // 左侧：向右拖动增加宽度
      newWidth = startWidth + deltaX
    } else {
      // 右侧：向左拖动增加宽度
      newWidth = startWidth - deltaX
    }

    // 限制宽度范围
    newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth))

    // 更新宽度
    if (currentSide === 'left') {
      leftWidth.value = newWidth
    } else {
      rightWidth.value = newWidth
    }
  })
}

// 处理鼠标释放
function handleMouseUp() {
  if (!isResizing) return

  isResizing = false
  currentSide = null

  // 重置子组件状态
  leftHandleRef.value?.reset()
  rightHandleRef.value?.reset()

  // 恢复全局样式
  document.body.style.cursor = ''
  document.body.style.userSelect = ''

  // 移除事件监听
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
}

// 清理
onBeforeUnmount(() => {
  if (isResizing) {
    handleMouseUp()
  }
})

// 导出宽度供外部使用（如需要）
defineExpose({
  leftWidth,
  rightWidth,
})
</script>

<style scoped>
.vela-layout {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #f5f7fa;
}

.theme-dark .vela-layout {
  background-color: #1d1e1f;
}

.vela-layout__header {
  flex-shrink: 0;
  height: 48px;
  background-color: var(--el-bg-color);
  z-index: 100;
}

.vela-layout__body {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
  padding: 10px;
  gap: 10px;
  background-color: #f5f7fa;
}

.theme-dark .vela-layout__body {
  background-color: #1d1e1f;
}

.vela-layout__panel {
  flex-shrink: 0;
  position: relative;
  background-color: var(--el-bg-color);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s;
}

.vela-layout__panel:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.vela-layout__panel--left,
.vela-layout__panel--right {
  border: none;
}

.vela-layout__panel-content {
  flex: 1;
  overflow: auto;
  position: relative;
}

.vela-layout__main {
  flex: 1;
  overflow: hidden;
  position: relative;
  background-color: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.vela-layout__footer {
  flex-shrink: 0;
  height: 24px;
  background-color: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-lighter);
  z-index: 50;
}

/* 滚动条样式 */
.vela-layout__panel-content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.vela-layout__panel-content::-webkit-scrollbar-track {
  background: transparent;
}

.vela-layout__panel-content::-webkit-scrollbar-thumb {
  background-color: var(--el-border-color);
  border-radius: 4px;
}

.vela-layout__panel-content::-webkit-scrollbar-thumb:hover {
  background-color: var(--el-border-color-darker);
}

/* 防止拖拽时内容被选中 */
.vela-layout__body.is-resizing {
  user-select: none;
  cursor: col-resize;
}
</style>
