<template>
  <div class="vela-layout">
    <!-- Header: Glass Strip (Docked) -->
    <header class="vela-layout__header">
      <slot name="header" />
    </header>

    <div class="vela-layout__body">
      <!-- Left Panel: Glass Drawer (Docked) -->
      <aside
        class="vela-layout__panel vela-layout__panel--left"
        :style="{ width: leftWidth + 'px' }"
      >
        <div class="vela-layout__panel-content">
          <slot name="left" />
        </div>
        <ResizeHandle ref="leftHandle" position="left" @resize-start="onLeftResizeStart" />
      </aside>

      <!-- Center (Canvas): The Floating Viewport -->
      <main class="vela-layout__main">
        <slot name="center" />
      </main>

      <!-- Right Panel: Glass Drawer (Docked) -->
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

    <!-- Footer: Glass Strip (Docked) -->
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
function onLeftResizeStart() {
  const e = window.event as MouseEvent
  if (e) startResize(e.clientX, 'left', leftWidth.value)
}

function onRightResizeStart() {
  const e = window.event as MouseEvent
  if (e) startResize(e.clientX, 'right', rightWidth.value)
}

// 通用拖拽逻辑
function startResize(clientX: number, side: 'left' | 'right', initialWidth: number) {
  isResizing = true
  currentSide = side
  startX = clientX
  startWidth = initialWidth

  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'

  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
}

// 处理鼠标移动
function handleMouseMove(e: MouseEvent) {
  if (!isResizing || !currentSide) return

  requestAnimationFrame(() => {
    const deltaX = e.clientX - startX
    let newWidth: number

    if (currentSide === 'left') {
      newWidth = startWidth + deltaX
    } else {
      newWidth = startWidth - deltaX
    }

    newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth))

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

  leftHandleRef.value?.reset()
  rightHandleRef.value?.reset()

  document.body.style.cursor = ''
  document.body.style.userSelect = ''

  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
}

onBeforeUnmount(() => {
  if (isResizing) {
    handleMouseUp()
  }
})

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
  /* Reset padding to 0 for Cockpit mode */
  padding: 0;
  box-sizing: border-box;
  gap: 0; /* Remove gaps between docked elements */
}

/* Header - Top Glass Strip */
.vela-layout__header {
  flex-shrink: 0;
  height: 56px;
  z-index: 100;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: var(--backdrop-blur);
  border-bottom: 1px solid var(--border-light);
}

.vela-layout__body {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
  /* Main workspace background - distinct from body if needed */
}

/* Side Panels - Glass Drawers */
.vela-layout__panel {
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: width 0.1s cubic-bezier(0.25, 0.8, 0.25, 1);
  background: rgba(255, 255, 255, 0.3); /* Subtle glass */
  backdrop-filter: var(--backdrop-blur);
  z-index: 90;
}

.vela-layout__panel--left {
  border-right: 1px solid var(--border-light);
}

.vela-layout__panel--right {
  border-left: 1px solid var(--border-light);
}

.vela-layout__panel-content {
  flex: 1;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* Main Area - The Viewport */
.vela-layout__main {
  flex: 1;
  overflow: hidden;
  position: relative;
  /* Use padding to create the floating effect for the canvas INSIDE */
  padding: 16px;
  background: transparent; /* Show global gradient through gaps */
}

/* Footer - Bottom Status Strip */
.vela-layout__footer {
  flex-shrink: 0;
  height: 32px;
  z-index: 50;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
  border-top: 1px solid var(--border-light);
  font-size: 12px;
  color: var(--text-tertiary);
}

/* Custom Scrollbar for Panels */
.vela-layout__panel-content :deep(::-webkit-scrollbar) {
  width: 6px;
  height: 6px;
}
.vela-layout__panel-content :deep(::-webkit-scrollbar-thumb) {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}
.vela-layout__panel-content :deep(::-webkit-scrollbar-track) {
  background: transparent;
}
</style>
