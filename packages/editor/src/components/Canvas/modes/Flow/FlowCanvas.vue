<template>
  <div
    class="flow-viewport"
    :class="{ 'is-embedded': embedded }"
    ref="viewportRef"
    @click="handleBackgroundClick"
    @contextmenu.prevent="handleContextMenu"
  >
    <div class="flow-workspace" :style="workspaceStyle">
      <div
        class="simulation-page"
        :style="pageStyle"
        @dragover.prevent="handleRootDragOver"
        @dragleave="handleRootDragLeave"
        @drop="handleRootDrop"
      >
        <!-- 使用 UniversalRenderer 递归渲染组件树 -->
        <template v-if="rootNode && rootNode.children?.length">
          <UniversalRenderer
            v-for="child in rootNode.children"
            :key="child.id"
            :node="child"
            :wrapper="NodeWrapper"
            :parent-layout-mode="rootLayoutMode"
          />
        </template>

        <!-- 空状态提示 -->
        <div
          v-if="!rootNode?.children || rootNode.children.length === 0"
          class="empty-page-placeholder"
          :class="{ 'drag-over': isRootDragOver }"
        >
          <div class="empty-icon">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
              <line x1="3" y1="9" x2="21" y2="9" />
            </svg>
          </div>
          <p class="empty-title">页面暂无内容</p>
          <p class="empty-hint">请从左侧拖入容器或组件</p>
        </div>
      </div>
    </div>

    <!-- Drop Indicator (Teleport to body) -->
    <DropIndicator
      :visible="flowDrop.indicator.value.visible"
      :rect="flowDrop.indicator.value.rect"
      :position="flowDrop.indicator.value.position"
    />

    <!-- Context Menu -->
    <ContextMenu
      :visible="contextMenu.visible"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :target-id="contextMenu.targetId"
      @action="handleMenuAction"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, provide, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useComponent } from '@/stores/component'
import { useUIStore } from '@/stores/ui'
import { useSizeStore } from '@/stores/size'
import UniversalRenderer from '../../UniversalRenderer.vue'
import NodeWrapper from './NodeWrapper.vue'
import DropIndicator from './DropIndicator.vue'
import ContextMenu from './ContextMenu.vue'
import { useFlowDrop } from './useFlowDrop'
import { useEditorShortcuts } from '@/composables/useEditorShortcuts'
import { useContextMenu } from '@/composables/useContextMenu'

const props = withDefaults(
  defineProps<{
    embedded?: boolean
  }>(),
  {
    embedded: false,
  },
)

const componentStore = useComponent()
const { rootNode } = storeToRefs(componentStore)
const { selectComponent, clearSelection } = componentStore

const uiStore = useUIStore()
const sizeStore = useSizeStore()
const { canvasScale } = storeToRefs(uiStore)
const { width: canvasWidth, height: canvasHeight } = storeToRefs(sizeStore)
const { setCanvasScale } = uiStore

const viewportRef = ref<HTMLElement | null>(null)

// ========== Shared Logic ==========
const { menuState: contextMenu, openContextMenu, closeContextMenu } = useContextMenu()

useEditorShortcuts({
  closeMenu: closeContextMenu,
})

// ========== Flow Drop Logic ==========
const flowDrop = useFlowDrop(viewportRef)

// Provide flowDrop to child components (NodeWrapper)
provide('flowDrop', flowDrop)

// ========== Root drag state ==========
const isRootDragOver = ref(false)

const rootLayoutMode = computed(() =>
  rootNode.value?.layoutMode === 'free' ? 'free' : 'flow',
)

/**
 * 页面样式 - 模拟 A4/自定义尺寸的白色页面
 */
const pageStyle = computed(() => {
  const base: Record<string, string> = {
    width: `${canvasWidth.value}px`,
    minHeight: `${canvasHeight.value}px`,
  }

  if (!props.embedded) {
    base.transform = `scale(${canvasScale.value})`
    base.transformOrigin = 'top center'
    base.marginBottom = `${canvasHeight.value * (canvasScale.value - 1)}px`
  }

  return base
})

const workspaceStyle = computed(() => {
  if (props.embedded) return {}
  return {
    minWidth: `${canvasWidth.value * canvasScale.value + 80}px`,
    minHeight: `${canvasHeight.value * canvasScale.value + 80}px`,
  }
})

/**
 * Ctrl+Wheel Zoom (统一由 UI Store 管理)
 */
const handleWheel = (e: WheelEvent) => {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault()
    const delta = e.deltaY < 0 ? 0.1 : -0.1
    setCanvasScale(canvasScale.value + delta)
  }
}

// ========== Keyboard Shortcuts ==========
// (Refactored to useEditorShortcuts)

onMounted(() => {
  if (!props.embedded) {
    window.addEventListener('wheel', handleWheel, { passive: false })
  }
})

onUnmounted(() => {
  if (!props.embedded) {
    window.removeEventListener('wheel', handleWheel)
  }
})

// ========== Context Menu ==========
function handleContextMenu(e: MouseEvent) {
  const target = e.target as HTMLElement
  const nodeEl = target.closest('[data-id]')

  if (nodeEl) {
    const id = nodeEl.getAttribute('data-id')
    if (id) {
      selectComponent(id)
      openContextMenu(e, id)
      return
    }
  }

  // 点击空白处显示粘贴菜单
  openContextMenu(e)
}

function handleMenuAction(action: string) {
  closeContextMenu()

  switch (action) {
    case 'close':
      break
    case 'copy':
      componentStore.copySelectedNodes()
      break
    case 'cut':
      componentStore.cutSelectedNodes()
      break
    case 'paste':
      componentStore.pasteNodes()
      break
    case 'delete':
      if (componentStore.selectedId) {
        componentStore.deleteComponent(componentStore.selectedId)
      }
      break
    default:
      console.log('[FlowCanvas] Unhandled menu action:', action)
  }
}

/**
 * 处理背景点击 - 取消选中
 */
const handleBackgroundClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement

  // 检查是否点击了组件 (通过事件代理)
  const nodeEl = target.closest('[data-id]')
  if (nodeEl) {
    const id = nodeEl.getAttribute('data-id')
    if (id) {
      console.log('[FlowCanvas] Selected component:', id)
      selectComponent(id)
      e.stopPropagation()
      return
    }
  }

  // 点击空白处，取消选中
  console.log('[FlowCanvas] Clicked empty space, clearing selection')
  clearSelection()
}

/**
 * 处理根容器 dragover
 */
const handleRootDragOver = (e: DragEvent) => {
  e.preventDefault()
  isRootDragOver.value = true
}

/**
 * 处理根容器 dragleave
 */
const handleRootDragLeave = (e: DragEvent) => {
  const relatedTarget = e.relatedTarget as HTMLElement | null
  const currentTarget = e.currentTarget as HTMLElement

  if (relatedTarget && currentTarget.contains(relatedTarget)) {
    return
  }

  isRootDragOver.value = false
}

/**
 * 处理拖放到根节点
 */
const handleRootDrop = (e: DragEvent) => {
  isRootDragOver.value = false
  flowDrop.handleDropOnRoot(e)
}
</script>

<style scoped>
/* 最外层视口 - 提供滚动容器 */
.flow-viewport {
  width: 100%;
  height: 100%;
  overflow: auto;
  background: #e5e7eb;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.flow-viewport.is-embedded {
  overflow: visible;
  background: transparent;
  align-items: flex-start;
}

/* 工作区 - 提供页面周围的边距 */
.flow-workspace {
  padding: 40px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.flow-viewport.is-embedded .flow-workspace {
  padding: 40px;
  justify-content: flex-start;
}

/* 模拟页面 - 白色纸张效果 */
.simulation-page {
  background: #ffffff;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.12),
    0 1px 2px rgba(0, 0, 0, 0.24);
  border-radius: 2px;
  position: relative;
  padding: 24px;
  box-sizing: border-box;
  transition:
    outline 0.2s ease,
    background 0.2s ease,
    transform 0.1s ease-out; /* Smooth zoom */
}

/* 空状态占位 */
.empty-page-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #9ca3af;
  user-select: none;
  border: 2px dashed transparent;
  border-radius: 8px;
  transition:
    border-color 0.2s ease,
    background 0.2s ease;
}

.empty-page-placeholder.drag-over {
  border-color: #409eff;
  background: rgba(64, 158, 255, 0.05);
}

.empty-icon {
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-page-placeholder.drag-over .empty-icon {
  opacity: 0.8;
}

.empty-title {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 8px 0;
  color: #6b7280;
}

.empty-hint {
  font-size: 14px;
  margin: 0;
  color: #9ca3af;
}

/* ========== 组件交互样式 (Figma-like) ========== */

/* 为文档流模式提供默认样式 */
.simulation-page :deep([data-id]) {
  position: relative;
  transition:
    outline 0.12s ease,
    box-shadow 0.12s ease,
    background 0.12s ease;
  cursor: pointer;
  border-radius: 2px;
}

/* 悬停状态 - 蓝色虚线边框 */
.simulation-page :deep([data-id]:hover) {
  outline: 1px dashed #0d99ff;
  outline-offset: 1px;
  background: rgba(13, 153, 255, 0.02);
}

/* 选中状态 - Figma 风格蓝色实线 + 控制点效果 */
.simulation-page :deep([data-id].selected) {
  outline: 2px solid #0d99ff !important;
  outline-offset: 0px;
  box-shadow:
    0 0 0 1px rgba(13, 153, 255, 0.3),
    inset 0 0 0 1px rgba(13, 153, 255, 0.1);
}

/* 选中状态悬停 */
.simulation-page :deep([data-id].selected:hover) {
  box-shadow:
    0 0 0 2px rgba(13, 153, 255, 0.2),
    inset 0 0 0 1px rgba(13, 153, 255, 0.1);
}

/* 拖放指示器 */
.simulation-page.drag-over {
  outline: 2px dashed #0d99ff;
  outline-offset: -2px;
  background: rgba(13, 153, 255, 0.03);
}

/* 容器组件特殊样式 */
.simulation-page :deep([data-component='Container']) {
  min-height: 60px;
}

/* 容器组件悬停 - 显示可放置区域 */
.simulation-page :deep([data-component='Container']:hover) {
  background: rgba(13, 153, 255, 0.03);
}

.simulation-page :deep([data-component='Container']:empty)::before {
  content: '拖入组件到此容器';
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60px;
  color: #9ca3af;
  font-size: 12px;
  border: 1px dashed #d1d5db;
  border-radius: 4px;
  background: #f9fafb;
}
</style>
