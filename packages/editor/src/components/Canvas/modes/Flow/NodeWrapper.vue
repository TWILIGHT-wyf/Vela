<template>
  <div
    ref="wrapperRef"
    :class="wrapperClasses"
    :style="wrapperStyle"
    :data-id="nodeId"
    :data-component="componentLabel"
    :data-label="componentLabel"
    :data-node-id="nodeId"
    :draggable="!isFreeParent && !isResizing && !isSpacingAdjusting"
    @click.stop="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <!-- Component content slot -->
    <slot></slot>

    <!-- Flow resize handles -->
    <template v-if="showFlowResizeHandles">
      <div class="flow-resize-handle handle-e" @mousedown.stop.prevent="handleFlowResizeStart('e', $event)" />
      <div class="flow-resize-handle handle-s" @mousedown.stop.prevent="handleFlowResizeStart('s', $event)" />
      <div class="flow-resize-handle handle-se" @mousedown.stop.prevent="handleFlowResizeStart('se', $event)" />
    </template>

    <template v-if="showFlowSpacingHandles">
      <div class="flow-spacing-handle spacing-top" @mousedown.stop.prevent="handleFlowSpacingDragStart('top', $event)" />
      <div
        class="flow-spacing-handle spacing-right"
        @mousedown.stop.prevent="handleFlowSpacingDragStart('right', $event)"
      />
      <div
        class="flow-spacing-handle spacing-bottom"
        @mousedown.stop.prevent="handleFlowSpacingDragStart('bottom', $event)"
      />
      <div class="flow-spacing-handle spacing-left" @mousedown.stop.prevent="handleFlowSpacingDragStart('left', $event)" />
    </template>

    <template v-if="showFlowSpacingHints">
      <div v-if="flowSpacingHints.top" class="flow-spacing-hint hint-top">mt {{ flowSpacingHints.top }}</div>
      <div v-if="flowSpacingHints.right" class="flow-spacing-hint hint-right">
        mr {{ flowSpacingHints.right }}
      </div>
      <div v-if="flowSpacingHints.bottom" class="flow-spacing-hint hint-bottom">
        mb {{ flowSpacingHints.bottom }}
      </div>
      <div v-if="flowSpacingHints.left" class="flow-spacing-hint hint-left">
        ml {{ flowSpacingHints.left }}
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, inject, type CSSProperties } from 'vue'
import { storeToRefs } from 'pinia'
import { useComponent } from '@/stores/component'
import type { NodeSchema, NodeStyle } from '@vela/core'
import type { UseFlowDropReturn } from './useFlowDrop'

interface Props {
  nodeId: string
  componentName?: string
  node?: NodeSchema
  parentLayoutMode?: 'flow' | 'free'
}

const props = withDefaults(defineProps<Props>(), {
  componentName: '',
  node: undefined,
  parentLayoutMode: 'flow',
})

const emit = defineEmits<{
  select: [id: string]
}>()

// ========== Inject Flow Drop Logic ==========
const flowDrop = inject<UseFlowDropReturn>('flowDrop')

// ========== Store ==========
const componentStore = useComponent()
const { selectedId, selectedIds, hoveredId, rootNode } = storeToRefs(componentStore)
const { selectComponent, toggleSelection, findNodeById, setHovered, updateStyle } = componentStore

// ========== Refs ==========
const wrapperRef = ref<HTMLDivElement | null>(null)
const isDragging = ref(false)
const isDragOver = ref(false)
const isResizing = ref(false)
const isSpacingAdjusting = ref(false)
const isFreeParent = computed(() => props.parentLayoutMode === 'free')

// ========== Computed ==========
const isSelected = computed(() => selectedIds.value.includes(props.nodeId))
const isHovered = computed(() => hoveredId.value === props.nodeId)
const showFlowResizeHandles = computed(
  () => selectedId.value === props.nodeId && props.parentLayoutMode === 'flow',
)
const showFlowSpacingHandles = computed(() => showFlowResizeHandles.value && !isResizing.value)

const currentNode = computed(() => {
  if (props.node) return props.node
  if (!rootNode.value) return null
  return findNodeById(rootNode.value, props.nodeId)
})

const componentLabel = computed(() => {
  return props.componentName || currentNode.value?.component || ''
})

const formatSpacingValue = (value: unknown): string | null => {
  if (value === null || value === undefined || value === '') {
    return null
  }
  if (typeof value === 'number') {
    return `${Math.round(value)}px`
  }
  if (typeof value === 'string') {
    return value.trim()
  }
  return null
}

const resolveSpacing = (style: NodeStyle, side: 'Top' | 'Right' | 'Bottom' | 'Left'): string | null => {
  const specific = style[`margin${side}`]
  if (specific !== undefined && specific !== null && specific !== '') {
    return formatSpacingValue(specific)
  }
  return formatSpacingValue(style.margin)
}

const flowSpacingHints = computed(() => {
  const style = currentNode.value?.style || {}
  return {
    top: resolveSpacing(style, 'Top'),
    right: resolveSpacing(style, 'Right'),
    bottom: resolveSpacing(style, 'Bottom'),
    left: resolveSpacing(style, 'Left'),
  }
})

const showFlowSpacingHints = computed(() => {
  if (props.parentLayoutMode !== 'flow') return false
  if (!isHovered.value && !isSelected.value) return false
  const hints = flowSpacingHints.value
  return Boolean(hints.top || hints.right || hints.bottom || hints.left)
})

/** 判断是否为容器组件 */
const isContainer = computed(() => {
  return flowDrop?.isContainerNode(currentNode.value as NodeSchema) || false
})

/** 判断是否为空容器 */
const isEmpty = computed(() => {
  if (!isContainer.value || !currentNode.value) return false
  return !currentNode.value.children || currentNode.value.children.length === 0
})

/** Wrapper classes */
const wrapperClasses = computed(() => [
  'editor-node-wrapper',
  {
    'is-selected': isSelected.value,
    'is-hovered': isHovered.value && !isSelected.value,
    'is-dragging': isDragging.value,
    'is-drag-over': isDragOver.value,
    'is-resizing': isResizing.value,
    'is-container': isContainer.value,
    'is-empty': isEmpty.value,
    'is-free-parent': isFreeParent.value,
  },
])

// ========== Styles ==========
const formatValue = (
  val: string | number | undefined,
  fallback: string | number = 'auto',
): string => {
  if (val === undefined || val === null) {
    return typeof fallback === 'number' ? `${fallback}px` : fallback
  }
  if (typeof val === 'number') return `${val}px`
  if (/^\d+(\.\d+)?(px|%|em|rem|vw|vh)$/.test(val) || val === 'auto') return val
  if (!isNaN(parseFloat(val))) return `${val}px`
  return val
}

const formatOptionalValue = (val: string | number | undefined): string | undefined => {
  if (val === undefined || val === null) return undefined
  return formatValue(val)
}

const wrapperStyle = computed<CSSProperties>(() => {
  const node = currentNode.value
  if (!node) {
    return isContainer.value ? { width: '100%' } : {}
  }

  // Subscribe to styleVersion to trigger reactivity on geometry/style updates
  const _v = componentStore.styleVersion[node.id]

  // Free mode: read positioning from node.geometry, sizing from geometry/style
  if (props.parentLayoutMode === 'free') {
    const geometry = node.geometry?.mode === 'free' ? node.geometry : undefined
    const style = node.style || {}
    const rotate = Number(geometry?.rotate ?? 0)
    const rotateTransform = rotate ? `rotate(${rotate}deg)` : undefined

    return {
      position: 'absolute',
      left: formatValue(geometry?.x as number | undefined, 0),
      top: formatValue(geometry?.y as number | undefined, 0),
      width: formatValue((geometry?.width ?? style.width) as string | number | undefined, 'auto'),
      height: formatValue((geometry?.height ?? style.height) as string | number | undefined, 'auto'),
      zIndex: (geometry?.zIndex ?? (style.zIndex as number | undefined)) ?? 0,
      transform: rotateTransform || undefined,
      transformOrigin: rotateTransform ? 'center center' : undefined,
    }
  }

  // Flow mode: sizing and spacing are handled by wrapper
  const style = node.style || {}
  const flowHeight = (style.height ?? style.minHeight) as string | number | undefined
  const flowMinHeight = (style.minHeight ?? style.height) as string | number | undefined
  return {
    width: style.width || (isContainer.value ? '100%' : 'auto'),
    // For ECharts-like components using 100% height, explicit height avoids 0-size init.
    height: formatValue(flowHeight, 'auto'),
    minHeight: formatValue(flowMinHeight, 'auto'),
    margin: formatOptionalValue(style.margin as string | number | undefined),
    marginTop: formatOptionalValue(style.marginTop as string | number | undefined),
    marginRight: formatOptionalValue(style.marginRight as string | number | undefined),
    marginBottom: formatOptionalValue(style.marginBottom as string | number | undefined),
    marginLeft: formatOptionalValue(style.marginLeft as string | number | undefined),
  }
})

// ========== Hover Handlers (Exclusive) ==========
const handleMouseEnter = (e: MouseEvent) => {
  // 阻止事件冒泡，确保只有最内层组件触发悬停
  e.stopPropagation()
  const dragging = isDragging.value
  if (!dragging) {
    setHovered(props.nodeId)
  }
}

const handleMouseLeave = (e: MouseEvent) => {
  // 检查是否真的离开了元素
  const relatedTarget = e.relatedTarget as HTMLElement | null
  const currentTarget = e.currentTarget as HTMLElement

  // 如果移动到子元素，不清除 hover
  if (relatedTarget && currentTarget.contains(relatedTarget)) {
    return
  }

  // 只有当前 hover 的是自己时才清除
  if (hoveredId.value === props.nodeId) {
    setHovered(null)
  }
}

// ========== Drag & Drop Handlers ==========
const handleDragStart = (e: DragEvent) => {
  if (isFreeParent.value) return
  if (!e.dataTransfer || !currentNode.value) return

  isDragging.value = true
  setHovered(null) // 拖拽时清除 hover 状态

  // 设置拖拽数据
  const dragData = {
    nodeId: props.nodeId,
    component: currentNode.value.component,
  }
  e.dataTransfer.setData('application/x-vela', JSON.stringify(dragData))
  e.dataTransfer.effectAllowed = 'move'

  // 通知 flowDrop 当前正在拖拽的组件
  flowDrop?.setDraggingId(props.nodeId)

  // 设置拖拽图像
  if (wrapperRef.value) {
    e.dataTransfer.setDragImage(wrapperRef.value, 10, 10)
  }
}

const handleDragEnd = () => {
  if (isFreeParent.value) return
  isDragging.value = false
  isDragOver.value = false
  flowDrop?.setDraggingId(null)
  flowDrop?.hideIndicator()
}

const handleDragOver = (e: DragEvent) => {
  if (isFreeParent.value) return
  if (!flowDrop || !currentNode.value || !wrapperRef.value) return
  isDragOver.value = true
  flowDrop.handleDragOver(e, currentNode.value, wrapperRef.value)
}

const handleDragLeave = (e: DragEvent) => {
  if (isFreeParent.value) return
  // 检查是否真的离开了
  const relatedTarget = e.relatedTarget as HTMLElement | null
  const currentTarget = e.currentTarget as HTMLElement
  if (relatedTarget && currentTarget.contains(relatedTarget)) {
    return
  }
  isDragOver.value = false
  flowDrop?.handleDragLeave(e)
}

const handleDrop = (e: DragEvent) => {
  if (isFreeParent.value) return
  isDragOver.value = false
  if (!flowDrop || !currentNode.value) return
  flowDrop.handleDrop(e, currentNode.value)
}

type FlowResizeHandle = 'e' | 's' | 'se'
type FlowSpacingSide = 'top' | 'right' | 'bottom' | 'left'
const marginStyleKeyMap: Record<FlowSpacingSide, keyof NodeStyle> = {
  top: 'marginTop',
  right: 'marginRight',
  bottom: 'marginBottom',
  left: 'marginLeft',
}

const toAbsoluteLengthNumber = (val: unknown): number | null => {
  if (typeof val === 'number' && Number.isFinite(val)) return val
  if (typeof val === 'string') {
    const trimmed = val.trim()
    if (!trimmed) return null
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number.parseFloat(trimmed)
    if (/^-?\d+(\.\d+)?px$/.test(trimmed)) return Number.parseFloat(trimmed)
  }
  return null
}

const parseSpacingNumber = (val: unknown): number | null => {
  if (typeof val === 'number' && Number.isFinite(val)) return val
  if (typeof val !== 'string') return null
  const trimmed = val.trim()
  if (!trimmed) return null
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number.parseFloat(trimmed)
  if (/^-?\d+(\.\d+)?px$/.test(trimmed)) return Number.parseFloat(trimmed)
  return null
}

const parseMarginShorthand = (val: string): [string, string, string, string] | null => {
  const parts = val
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 1) return [parts[0], parts[0], parts[0], parts[0]]
  if (parts.length === 2) return [parts[0], parts[1], parts[0], parts[1]]
  if (parts.length === 3) return [parts[0], parts[1], parts[2], parts[1]]
  if (parts.length === 4) return [parts[0], parts[1], parts[2], parts[3]]
  return null
}

const resolveSpacingNumber = (style: NodeStyle, side: FlowSpacingSide): number => {
  const sideKey = marginStyleKeyMap[side]
  const specific = parseSpacingNumber(style[sideKey])
  if (specific !== null) return specific

  if (typeof style.margin === 'string') {
    const shorthand = parseMarginShorthand(style.margin)
    if (shorthand) {
      const sideIndex = side === 'top' ? 0 : side === 'right' ? 1 : side === 'bottom' ? 2 : 3
      const parsed = parseSpacingNumber(shorthand[sideIndex])
      if (parsed !== null) return parsed
    }
  }

  const common = parseSpacingNumber(style.margin)
  if (common !== null) return common

  return 0
}

const handleFlowResizeStart = (handle: FlowResizeHandle, e: MouseEvent) => {
  if (props.parentLayoutMode !== 'flow' || !currentNode.value || !wrapperRef.value) return

  // Ensure current node is the active selection when resize starts
  selectComponent(props.nodeId)
  isResizing.value = true
  setHovered(null)

  const startX = e.clientX
  const startY = e.clientY
  const rect = wrapperRef.value.getBoundingClientRect()
  const style = currentNode.value.style || {}

  const baseWidth = toAbsoluteLengthNumber(style.width) ?? rect.width
  const baseMinHeight = toAbsoluteLengthNumber(style.minHeight ?? style.height) ?? rect.height
  const minWidth = 24
  const minHeight = 24

  let rafId = 0
  let pendingWidth: number | undefined
  let pendingMinHeight: number | undefined

  const flushStyleUpdate = () => {
    rafId = 0
    const patch: Partial<NodeStyle> = {}

    if (pendingWidth !== undefined) {
      patch.width = Math.round(pendingWidth)
    }
    if (pendingMinHeight !== undefined) {
      const nextHeight = Math.round(pendingMinHeight)
      patch.minHeight = nextHeight
      patch.height = nextHeight
    }

    if (Object.keys(patch).length > 0) {
      updateStyle(props.nodeId, patch)
    }
  }

  const prevCursor = document.body.style.cursor
  const prevUserSelect = document.body.style.userSelect
  document.body.style.userSelect = 'none'
  document.body.style.cursor =
    handle === 'e' ? 'ew-resize' : handle === 's' ? 'ns-resize' : 'nwse-resize'

  const onMouseMove = (ev: MouseEvent) => {
    const dx = ev.clientX - startX
    const dy = ev.clientY - startY

    if (handle === 'e' || handle === 'se') {
      pendingWidth = Math.max(minWidth, baseWidth + dx)
    }
    if (handle === 's' || handle === 'se') {
      pendingMinHeight = Math.max(minHeight, baseMinHeight + dy)
    }

    if (rafId === 0) {
      rafId = requestAnimationFrame(flushStyleUpdate)
    }
  }

  const onMouseUp = () => {
    if (rafId !== 0) {
      cancelAnimationFrame(rafId)
      flushStyleUpdate()
    }

    document.body.style.cursor = prevCursor
    document.body.style.userSelect = prevUserSelect
    isResizing.value = false
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

const handleFlowSpacingDragStart = (side: FlowSpacingSide, e: MouseEvent) => {
  if (props.parentLayoutMode !== 'flow' || !currentNode.value) return

  selectComponent(props.nodeId)
  isSpacingAdjusting.value = true
  setHovered(null)

  const startX = e.clientX
  const startY = e.clientY
  const style = currentNode.value.style || {}
  const baseMargin = resolveSpacingNumber(style, side)
  const styleKey = marginStyleKeyMap[side]
  const minMargin = -200
  const maxMargin = 400

  let rafId = 0
  let pendingMargin: number | undefined

  const flushMarginUpdate = () => {
    rafId = 0
    if (pendingMargin === undefined) return

    const patch = { [styleKey]: Math.round(pendingMargin) } as Partial<NodeStyle>
    updateStyle(props.nodeId, patch)
  }

  const prevCursor = document.body.style.cursor
  const prevUserSelect = document.body.style.userSelect
  document.body.style.userSelect = 'none'
  document.body.style.cursor = side === 'top' || side === 'bottom' ? 'ns-resize' : 'ew-resize'

  const onMouseMove = (ev: MouseEvent) => {
    const dx = ev.clientX - startX
    const dy = ev.clientY - startY

    let next = baseMargin
    if (side === 'top') next = baseMargin - dy
    if (side === 'bottom') next = baseMargin + dy
    if (side === 'left') next = baseMargin - dx
    if (side === 'right') next = baseMargin + dx

    pendingMargin = Math.min(maxMargin, Math.max(minMargin, next))

    if (rafId === 0) {
      rafId = requestAnimationFrame(flushMarginUpdate)
    }
  }

  const onMouseUp = () => {
    if (rafId !== 0) {
      cancelAnimationFrame(rafId)
      flushMarginUpdate()
    }

    document.body.style.cursor = prevCursor
    document.body.style.userSelect = prevUserSelect
    isSpacingAdjusting.value = false
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

// ========== Event Handlers ==========
const handleClick = (e: MouseEvent) => {
  // Ctrl/Cmd/Shift + Click: toggle multi-selection
  if (e.ctrlKey || e.metaKey || e.shiftKey) {
    toggleSelection(props.nodeId)
    emit('select', props.nodeId)
    return
  }

  selectComponent(props.nodeId)
  emit('select', props.nodeId)
}

</script>

<style scoped>
/* ========== Base Styles ========== */
.editor-node-wrapper {
  position: relative;
  cursor: pointer;
  box-sizing: border-box;
  max-width: 100%; /* 核心修复：防止撑破画布 */
  min-width: 20px; /* 防止过小无法选中 */
  /* 移除 overflow: hidden，避免裁剪图表等组件的标题、轴名称等内容 */
  overflow: visible;
  transition:
    box-shadow 0.15s ease,
    background-color 0.15s ease;
}

/* ========== Hover State (Exclusive - only innermost) ========== */
.editor-node-wrapper.is-hovered:not(.is-selected):not(.is-dragging) {
  box-shadow: inset 0 0 0 1px rgba(64, 158, 255, 0.5);
}

/* Hover label via ::after */
.editor-node-wrapper.is-hovered:not(.is-selected):not(.is-dragging):not(.is-empty)::after {
  content: attr(data-label);
  position: absolute;
  top: 0;
  left: 0;
  transform: translateY(-100%);
  font-size: 10px;
  line-height: 1;
  color: #fff;
  background: rgba(64, 158, 255, 0.85);
  padding: 2px 6px;
  border-radius: 2px 2px 0 0;
  white-space: nowrap;
  pointer-events: none;
  z-index: 100;
}

/* ========== Dragging State ========== */
.editor-node-wrapper.is-dragging {
  opacity: 0.4;
  box-shadow:
    0 0 0 2px #409eff,
    inset 0 0 0 9999px rgba(64, 158, 255, 0.1) !important;
}

/* ========== Empty Container State (极简设计) ========== */
.editor-node-wrapper.is-empty {
  min-height: 60px;
  background-color: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

/* 默认状态：显示"拖入组件"提示 */
.editor-node-wrapper.is-empty:not(.is-selected):not(.is-drag-over)::before {
  content: '拖入组件';
  font-size: 12px;
  color: #c0c4cc;
  pointer-events: none;
}

/* Empty + Hover (无拖拽): 轻微高亮，但不改变文字 */
.editor-node-wrapper.is-empty.is-hovered:not(.is-selected):not(.is-drag-over) {
  background-color: #f5f7fa;
  box-shadow: inset 0 0 0 1px rgba(64, 158, 255, 0.2);
}

/* Empty + Drag Over: 明显高亮 + 提示释放 */
.editor-node-wrapper.is-empty.is-drag-over:not(.is-selected) {
  background-color: #ecf5ff;
  box-shadow: inset 0 0 0 2px rgba(64, 158, 255, 0.5);
}

.editor-node-wrapper.is-empty.is-drag-over:not(.is-selected)::before {
  content: '释放以添加到 ' attr(data-label);
  color: #409eff;
  font-weight: 500;
}

/* Empty + Selected: 保持选中框，隐藏提示文字 */
.editor-node-wrapper.is-empty.is-selected {
  background-color: #fafcff;
}

/* ========== Container with children ========== */
.editor-node-wrapper.is-container:not(.is-empty) {
  /* 容器有子元素时的微小内边距，便于选中边缘 */
  padding: 2px;
}

.editor-node-wrapper.is-free-parent {
  position: absolute;
}

.flow-resize-handle {
  position: absolute;
  background: #ffffff;
  border: 1px solid #0d99ff;
  border-radius: 2px;
  box-shadow: 0 1px 3px rgba(13, 153, 255, 0.28);
  z-index: 12;
}

.flow-resize-handle.handle-e {
  top: 50%;
  right: -5px;
  width: 10px;
  height: 20px;
  transform: translateY(-50%);
  cursor: ew-resize;
}

.flow-resize-handle.handle-s {
  bottom: -5px;
  left: 50%;
  width: 20px;
  height: 10px;
  transform: translateX(-50%);
  cursor: ns-resize;
}

.flow-resize-handle.handle-se {
  right: -6px;
  bottom: -6px;
  width: 12px;
  height: 12px;
  cursor: nwse-resize;
}

.flow-spacing-handle {
  position: absolute;
  z-index: 11;
  border: 1px dashed rgba(245, 158, 11, 0.9);
  background: rgba(254, 243, 199, 0.4);
  pointer-events: auto;
}

.flow-spacing-handle.spacing-top {
  top: -11px;
  left: 18%;
  width: 64%;
  height: 8px;
  cursor: ns-resize;
}

.flow-spacing-handle.spacing-right {
  top: 18%;
  right: -11px;
  width: 8px;
  height: 64%;
  cursor: ew-resize;
}

.flow-spacing-handle.spacing-bottom {
  bottom: -11px;
  left: 18%;
  width: 64%;
  height: 8px;
  cursor: ns-resize;
}

.flow-spacing-handle.spacing-left {
  top: 18%;
  left: -11px;
  width: 8px;
  height: 64%;
  cursor: ew-resize;
}

.flow-spacing-hint {
  position: absolute;
  z-index: 11;
  padding: 2px 6px;
  border-radius: 10px;
  border: 1px solid rgba(245, 158, 11, 0.55);
  background: rgba(254, 243, 199, 0.9);
  color: #92400e;
  font-size: 10px;
  font-weight: 500;
  line-height: 1.2;
  pointer-events: none;
  white-space: nowrap;
}

.flow-spacing-hint.hint-top {
  left: 50%;
  top: -18px;
  transform: translateX(-50%);
}

.flow-spacing-hint.hint-right {
  top: 50%;
  right: -42px;
  transform: translateY(-50%);
}

.flow-spacing-hint.hint-bottom {
  left: 50%;
  bottom: -18px;
  transform: translateX(-50%);
}

.flow-spacing-hint.hint-left {
  top: 50%;
  left: -42px;
  transform: translateY(-50%);
}
</style>
