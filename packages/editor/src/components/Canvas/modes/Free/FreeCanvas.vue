<template>
  <div
    class="canvas-wrap"
    ref="wrap"
    :class="{ dragging: isPanning }"
    data-testid="canvas-board-v2"
    @dragover.prevent
    @drop="handleDrop"
    @contextmenu.prevent="onCanvasContextMenu"
    @click="handleCanvasClick"
  >
    <div class="world" :style="worldStyle">
      <div class="stage" :style="stageStyle">
        <!-- V2.0: 使用 EditorTreeRenderer 统一渲染组件树 -->
        <template v-if="currentTree && currentTree.children && currentTree.children.length > 0">
          <EditorTreeRenderer
            v-for="child in currentTree.children"
            :key="child.id"
            :node="child"
            @open-context-menu="onComponentContextMenu"
          />
        </template>

        <!-- 空状态提示 -->
        <div v-else class="empty-canvas-hint">
          <div class="hint-icon">🎨</div>
          <p>从左侧拖入组件开始设计</p>
          <p class="hint-sub">支持拖拽、缩放、旋转和智能吸附</p>
        </div>

        <!-- 交互层分离：选中框 -->
        <SelectionOverlay
          v-if="selectedNode"
          :is-active="true"
          :label="selectedNode.title || selectedNode.componentName"
          :x="selectedNodeStyle.x"
          :y="selectedNodeStyle.y"
          :width="selectedNodeStyle.width"
          :height="selectedNodeStyle.height"
          :rotate="selectedNodeStyle.rotate"
          :z-index="999"
          :show-rotate="true"
          :show-toolbar="true"
          :is-multi-selected="isMultiSelected"
          @drag-start="onDragStart"
          @resize-start="onResizeStart"
          @rotate-start="onRotateStart"
          @delete="handleDelete"
          @copy="handleCopy"
        />

        <!-- 吸附辅助线 -->
        <SnapLine v-if="snapLines.length > 0" :lines="snapLines" />

        <!-- 右键菜单 -->
        <ContextMenu
          :x="menuState.x"
          :y="menuState.y"
          :visible="menuState.visible"
          :target-id="menuState.targetId"
          @action="onMenuAction"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, provide, onMounted, onBeforeUnmount } from 'vue'
import EditorTreeRenderer from '../../common/EditorTreeRenderer.vue'
import SelectionOverlay from '../../common/SelectionOverlay.vue'
import { useUIStore } from '@/stores/ui'
import { storeToRefs } from 'pinia'
import { useComponent } from '@/stores/component'
import { useCanvasInteraction } from './composables/useCanvasInteraction'
import { useSelectionTransform } from './composables/useSelectionTransform'
import SnapLine from './Snap/SnapLine.vue'
import ContextMenu from './ContextMenu/ContextMenu.vue'

import { useEditorShortcuts } from '@/composables/useEditorShortcuts'
import { useContextMenu } from '@/composables/useContextMenu'

const wrap = ref<HTMLDivElement | null>(null)

// 向子组件提供画布容器，用于将屏幕坐标映射为 stage 坐标
provide('canvasWrapRef', wrap)

const uiStore = useUIStore()
const {
  canvasWidth: width,
  canvasHeight: height,
  canvasScale: scale,
  canvasSettings: canvasConfig,
} = storeToRefs(uiStore)

// 使用新的组件 Store
const compStore = useComponent()
const { rootNode: currentTree, selectedId, selectedIds, styleVersion } = storeToRefs(compStore)
const { addComponent, selectComponent, clearSelection, getComponentById } = compStore

// ========== Selection State for Overlay ==========
const selectedNode = computed(() => {
  if (!selectedId.value) return null
  return getComponentById(selectedId.value)
})

const isMultiSelected = computed(() => selectedIds.value.length > 1)

// Helper to safely parse style values
const parseVal = (val: unknown, def: number) => {
  if (typeof val === 'number') return val
  if (typeof val === 'string') {
    const p = parseFloat(val)
    return isNaN(p) ? def : p
  }
  return def
}

const selectedNodeStyle = computed(() => {
  if (!selectedNode.value || !selectedId.value)
    return { x: 0, y: 0, width: 0, height: 0, rotate: 0 }

  // Reactivity trigger via styleVersion
  const _v = styleVersion.value[selectedId.value]
  const style = selectedNode.value.style || {}

  // Parse transform for rotate fallback
  let rot = 0
  if (typeof style.rotate === 'number') rot = style.rotate
  else if (style.transform) {
    const m = style.transform.match(/rotate\(([-\d.]+)deg\)/)
    if (m) rot = parseFloat(m[1])
  }

  return {
    x: typeof style.x === 'number' ? style.x : parseVal(style.left, 0),
    y: typeof style.y === 'number' ? style.y : parseVal(style.top, 0),
    width: parseVal(style.width, 100),
    height: parseVal(style.height, 100),
    rotate: rot,
  }
})

// ========== Transform Logic ==========
// Snap lines state
const snapLines = ref<{ x?: number; y?: number }[]>([])
function handleSnapLines(lines: { x?: number; y?: number }[]) {
  snapLines.value = lines
}

// Connect overlay events to transform logic
const { onDragStart, onResizeStart, onRotateStart } = useSelectionTransform(
  computed(() => selectedId.value),
  computed(() => selectedNode.value?.style),
  {
    canvasScale: scale,
    emitSnapLines: handleSnapLines,
  },
)

// Actions for overlay toolbar
const handleDelete = () => {
  if (selectedId.value) compStore.deleteComponent(selectedId.value)
}
const handleCopy = () => {
  compStore.copySelectedNodes()
}

// ========== Shared Logic ==========
const { menuState, openContextMenu, closeContextMenu } = useContextMenu()

useEditorShortcuts({
  closeMenu: closeContextMenu,
})

// ========== Interaction ==========
const { panX, panY, isPanning } = useCanvasInteraction(wrap, scale, {
  enablePan: true,
  enableZoom: true,
  enableDrop: false, // Drop is handled by template event handler
})

// 向子组件提供画布平移量，用于组件拖拽时坐标转换
provide('canvasPanX', panX)
provide('canvasPanY', panY)

// ========== Event Handlers ==========
const handleCanvasClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement

  // 只有直接点击 canvas-wrap 或 stage 时才清除选择
  if (
    !target.classList.contains('canvas-wrap') &&
    !target.classList.contains('stage') &&
    !target.classList.contains('world')
  ) {
    return
  }

  // 点击空白处，取消选中
  clearSelection()
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation() // Prevent canvas pan

  try {
    const dataStr =
      e.dataTransfer?.getData('application/x-vela') || e.dataTransfer?.getData('text/plain') || '{}'

    console.log('[FreeCanvas] Drop raw data:', dataStr)
    const data = JSON.parse(dataStr)

    if (!data.componentName) {
      console.warn('[FreeCanvas] Invalid drop data - no componentName:', data)
      return
    }

    const el = wrap.value
    if (!el) {
      return
    }

    const rect = el.getBoundingClientRect()
    const scaleValue = scale.value || 1

    // 计算在 stage 坐标系中的位置
    const stageX = (e.clientX - rect.left - panX.value) / scaleValue
    const stageY = (e.clientY - rect.top - panY.value) / scaleValue

    // 创建新组件（自由画布模式使用 position: absolute）
    const dropWidth = data.style?.width || data.width || 120
    const dropHeight = data.style?.height || data.height || 80

    const componentToAdd = {
      id: `comp_${Date.now()}`,
      componentName: data.componentName,
      props: data.props || {},
      style: {
        position: 'absolute',
        x: Math.round(stageX),
        y: Math.round(stageY),
        width: dropWidth,
        height: dropHeight,
        zIndex: 0,
      },
      children: data.children || [],
    }

    const newId = addComponent(null, componentToAdd)

    if (newId) {
      selectComponent(newId)
    } else {
      console.error('[FreeCanvas] addComponent returned falsy ID!')
    }
  } catch (err) {
    console.error('[FreeCanvas] Drop error:', err)
  }
}

// ========== Context Menu Logic ==========
function onCanvasContextMenu(e: MouseEvent) {
  const target = e.target as HTMLElement

  // 如果右键点击的是组件，让组件处理
  if (target.closest('[data-id]')) return

  const rect = wrap.value?.getBoundingClientRect()
  if (!rect) return

  const visualX = e.clientX - rect.left
  const visualY = e.clientY - rect.top

  const scaleValue = scale.value || 1
  const stageX = (visualX - panX.value) / scaleValue
  const stageY = (visualY - panY.value) / scaleValue

  openContextMenu(e, undefined, { stageX, stageY })
}

function onComponentContextMenu(payload: { id: string; event: MouseEvent }) {
  openContextMenu(payload.event, payload.id)
}

function onMenuAction(action: string) {
  closeContextMenu()

  switch (action) {
    case 'copy':
      compStore.copySelectedNodes()
      break
    case 'cut':
      compStore.cutSelectedNodes()
      break
    case 'paste':
      compStore.pasteNodes()
      break
    case 'delete':
      if (compStore.selectedId) {
        compStore.deleteComponent(compStore.selectedId)
      } else if (compStore.selectedIds.length > 0) {
        compStore.deleteComponents([...compStore.selectedIds])
      }
      break
    default:
      console.log('[FreeCanvas] Unhandled menu action:', action)
  }
}

function handleGlobalClick(e: MouseEvent) {
  const el = document.querySelector('.ctx-menu')
  if (!el) return
  if (menuState.value.visible && !el.contains(e.target as Node)) {
    closeContextMenu()
  }
}

// ========== Keyboard Shortcuts ==========
// (Refactored to useEditorShortcuts)

onMounted(() => {
  window.addEventListener('mousedown', handleGlobalClick)
  window.addEventListener('scroll', closeContextMenu, true)
})

onBeforeUnmount(() => {
  window.removeEventListener('mousedown', handleGlobalClick)
  window.removeEventListener('scroll', closeContextMenu, true)
})

// ========== Styles ==========
const stageStyle = computed(() => {
  const config = canvasConfig.value
  const baseStyle: Record<string, string> = {
    width: width.value + 'px',
    height: height.value + 'px',
    backgroundColor: config.backgroundColor,
  }

  if (config.backgroundImage) {
    baseStyle.backgroundImage = `url(${config.backgroundImage})`
    baseStyle.backgroundSize = 'cover'
    baseStyle.backgroundPosition = 'center'
    baseStyle.backgroundRepeat = 'no-repeat'
  }

  if (config.showGrid) {
    baseStyle['--grid-size'] = config.gridSize + 'px'
    baseStyle['--grid-major'] = config.gridMajorSize + 'px'
    baseStyle['--grid-color'] = config.gridColor
    baseStyle['--grid-major-color'] = config.gridMajorColor
  } else {
    baseStyle['--grid-color'] = 'transparent'
    baseStyle['--grid-major-color'] = 'transparent'
  }

  return baseStyle
})

const worldStyle = computed(() => ({
  transform: `translate3d(${panX.value}px, ${panY.value}px, 0) scale(${scale.value})`,
  transformOrigin: '0 0',
  willChange: isPanning.value ? 'transform' : 'auto',
}))
</script>

<style scoped>
.canvas-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  cursor: grab;
  transform: translateZ(0);
}

.canvas-wrap.dragging {
  cursor: grabbing;
}

.world {
  will-change: transform;
  transform-origin: 0 0;
  contain: layout style;
}

.stage {
  background-color: var(--grid-bg);
  background-image:
    linear-gradient(to right, var(--grid-color) 1px, transparent 1px),
    linear-gradient(to bottom, var(--grid-color) 1px, transparent 1px),
    linear-gradient(to right, var(--grid-major-color) 1px, transparent 1px),
    linear-gradient(to bottom, var(--grid-major-color) 1px, transparent 1px);
  background-size:
    var(--grid-size) var(--grid-size),
    var(--grid-size) var(--grid-size),
    var(--grid-major) var(--grid-major),
    var(--grid-major) var(--grid-major);
  background-position:
    0 0,
    0 0,
    0 0,
    0 0;
  position: relative;
  contain: layout style paint;
}

/* Empty canvas hint */
.empty-canvas-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #909399;
  pointer-events: none;
  user-select: none;
}

.hint-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-canvas-hint p {
  margin: 8px 0;
  font-size: 14px;
}

.hint-sub {
  font-size: 12px;
  color: #c0c4cc;
}
</style>
