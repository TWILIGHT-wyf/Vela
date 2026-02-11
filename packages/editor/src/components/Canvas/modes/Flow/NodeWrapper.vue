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
    <!-- Interaction blocker: prevents component-internal events (click, change, etc.)
         from firing in edit mode. Removed in simulation/preview mode so components
         become fully interactive. Positioned above component content (z-index: 1)
         but below resize handles and box-model overlays (z-index: 11+). -->
    <div v-if="!isSimulationMode" class="interaction-blocker" />

    <!-- Component content slot -->
    <slot></slot>

    <!-- Flow resize handles -->
    <template v-if="showFlowResizeHandles">
      <div
        class="flow-resize-handle handle-n"
        @mousedown.stop.prevent="handleFlowResizeStart('n', $event)"
      />
      <div
        class="flow-resize-handle handle-e"
        @mousedown.stop.prevent="handleFlowResizeStart('e', $event)"
      />
      <div
        class="flow-resize-handle handle-s"
        @mousedown.stop.prevent="handleFlowResizeStart('s', $event)"
      />
      <div
        class="flow-resize-handle handle-w"
        @mousedown.stop.prevent="handleFlowResizeStart('w', $event)"
      />
      <div
        class="flow-resize-handle handle-nw"
        @mousedown.stop.prevent="handleFlowResizeStart('nw', $event)"
      />
      <div
        class="flow-resize-handle handle-ne"
        @mousedown.stop.prevent="handleFlowResizeStart('ne', $event)"
      />
      <div
        class="flow-resize-handle handle-se"
        @mousedown.stop.prevent="handleFlowResizeStart('se', $event)"
      />
      <div
        class="flow-resize-handle handle-sw"
        @mousedown.stop.prevent="handleFlowResizeStart('sw', $event)"
      />
    </template>

    <!-- Margin overlays: semi-transparent orange zones that extend OUTSIDE the wrapper.
         Shown when selected (grid mode) or hovered. Always visible as a thin 4px strip so
         users can drag from zero to add margin. -->
    <template v-if="showMarginOverlays">
      <div
        v-if="isMarginSideVisible('top')"
        class="box-overlay margin-overlay margin-overlay-top"
        :style="{
          height: Math.max(marginPx.top, 4) + 'px',
          top: -Math.max(marginPx.top, 4) + 'px',
        }"
        @mousedown.stop.prevent="handleFlowSpacingDragStart('top', $event)"
      >
        <span v-if="marginPx.top > 0" class="overlay-label">{{ marginPx.top }}</span>
      </div>
      <div
        v-if="isMarginSideVisible('right')"
        class="box-overlay margin-overlay margin-overlay-right"
        :style="{
          width: Math.max(marginPx.right, 4) + 'px',
          right: -Math.max(marginPx.right, 4) + 'px',
        }"
        @mousedown.stop.prevent="handleFlowSpacingDragStart('right', $event)"
      >
        <span v-if="marginPx.right > 0" class="overlay-label">{{ marginPx.right }}</span>
      </div>
      <div
        v-if="isMarginSideVisible('bottom')"
        class="box-overlay margin-overlay margin-overlay-bottom"
        :style="{
          height: Math.max(marginPx.bottom, 4) + 'px',
          bottom: -Math.max(marginPx.bottom, 4) + 'px',
        }"
        @mousedown.stop.prevent="handleFlowSpacingDragStart('bottom', $event)"
      >
        <span v-if="marginPx.bottom > 0" class="overlay-label">{{ marginPx.bottom }}</span>
      </div>
      <div
        v-if="isMarginSideVisible('left')"
        class="box-overlay margin-overlay margin-overlay-left"
        :style="{
          width: Math.max(marginPx.left, 4) + 'px',
          left: -Math.max(marginPx.left, 4) + 'px',
        }"
        @mousedown.stop.prevent="handleFlowSpacingDragStart('left', $event)"
      >
        <span v-if="marginPx.left > 0" class="overlay-label">{{ marginPx.left }}</span>
      </div>
    </template>

    <!-- Padding overlays: semi-transparent green zones inside the wrapper.
         Shown when selected. Always render with at least 4px so users can drag from zero.
         Side overlays avoid corners by offsetting left/right by the adjacent side's padding. -->
    <template v-if="showPaddingOverlays">
      <div
        v-if="isPaddingSideVisible('top')"
        class="box-overlay padding-overlay padding-overlay-top"
        :style="{
          height: Math.max(paddingPx.top, 4) + 'px',
          left: paddingPx.left + 'px',
          right: paddingPx.right + 'px',
        }"
        @mousedown.stop.prevent="handlePaddingDragStart('top', $event)"
      >
        <span v-if="paddingPx.top > 0" class="overlay-label">{{ paddingPx.top }}</span>
      </div>
      <div
        v-if="isPaddingSideVisible('bottom')"
        class="box-overlay padding-overlay padding-overlay-bottom"
        :style="{
          height: Math.max(paddingPx.bottom, 4) + 'px',
          left: paddingPx.left + 'px',
          right: paddingPx.right + 'px',
        }"
        @mousedown.stop.prevent="handlePaddingDragStart('bottom', $event)"
      >
        <span v-if="paddingPx.bottom > 0" class="overlay-label">{{ paddingPx.bottom }}</span>
      </div>
      <div
        v-if="isPaddingSideVisible('left')"
        class="box-overlay padding-overlay padding-overlay-left"
        :style="{
          width: Math.max(paddingPx.left, 4) + 'px',
          top: Math.max(paddingPx.top, 4) + 'px',
          bottom: Math.max(paddingPx.bottom, 4) + 'px',
        }"
        @mousedown.stop.prevent="handlePaddingDragStart('left', $event)"
      >
        <span v-if="paddingPx.left > 0" class="overlay-label">{{ paddingPx.left }}</span>
      </div>
      <div
        v-if="isPaddingSideVisible('right')"
        class="box-overlay padding-overlay padding-overlay-right"
        :style="{
          width: Math.max(paddingPx.right, 4) + 'px',
          top: Math.max(paddingPx.top, 4) + 'px',
          bottom: Math.max(paddingPx.bottom, 4) + 'px',
        }"
        @mousedown.stop.prevent="handlePaddingDragStart('right', $event)"
      >
        <span v-if="paddingPx.right > 0" class="overlay-label">{{ paddingPx.right }}</span>
      </div>
    </template>

    <!-- Flow resize dimension tooltip -->
    <div v-if="flowResizeInfo" class="flow-resize-tooltip">
      C{{ flowResizeInfo.width }} × R{{ flowResizeInfo.height }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, inject, type CSSProperties } from 'vue'
import { storeToRefs } from 'pinia'
import { useComponent } from '@/stores/component'
import { useUIStore } from '@/stores/ui'
import { useSizeStore } from '@/stores/size'
import { useCanvasContext } from '../../composables/useCanvasContext'
import type { NodeSchema, NodeStyle, GridContainerLayout, GridNodeGeometry } from '@vela/core'
import { parseFrTemplate, buildFrTemplate } from '@vela/core'
import type { UseFlowDropReturn } from './useFlowDrop'

interface Props {
  nodeId: string
  componentName?: string
  node?: NodeSchema
  parentLayoutMode?: 'free' | 'grid'
}

const props = withDefaults(defineProps<Props>(), {
  componentName: '',
  node: undefined,
  parentLayoutMode: 'grid',
})

const emit = defineEmits<{
  select: [id: string]
}>()

// ========== Inject Flow Drop Logic ==========
const flowDrop = inject<UseFlowDropReturn>('flowDrop')

// ========== Canvas Context (for scale compensation) ==========
const { scale: canvasScale } = useCanvasContext()

// ========== Store ==========
const componentStore = useComponent()
const uiStore = useUIStore()
const sizeStore = useSizeStore()
const { selectedId, selectedIds, hoveredId, rootNode } = storeToRefs(componentStore)
const { isSimulationMode } = storeToRefs(uiStore)
const { selectComponent, toggleSelection, findNodeById, setHovered, updateStyle } = componentStore

// ========== Refs ==========
const wrapperRef = ref<HTMLDivElement | null>(null)
const isDragging = ref(false)
const isDragOver = ref(false)
const isResizing = ref(false)
const isSpacingAdjusting = ref(false)
const activeSpacingKind = ref<'margin' | 'padding' | null>(null)
const activeSpacingSide = ref<'top' | 'right' | 'bottom' | 'left' | null>(null)
const flowResizeInfo = ref<{ width: number; height: number } | null>(null)
const isFreeParent = computed(() => props.parentLayoutMode === 'free')

// ========== Computed ==========
const isSelected = computed(() => selectedIds.value.includes(props.nodeId))
const isHovered = computed(() => hoveredId.value === props.nodeId)
const showFlowResizeHandles = computed(
  () => selectedId.value === props.nodeId && props.parentLayoutMode === 'grid',
)

const currentNode = computed(() => {
  if (props.node) return props.node
  if (!rootNode.value) return null
  return findNodeById(rootNode.value, props.nodeId)
})

const componentLabel = computed(() => {
  return props.componentName || currentNode.value?.component || ''
})

const isDragFeedbackActive = computed(() => {
  const dragging = Boolean(flowDrop?.draggingId.value)
  const indicatorVisible = Boolean(flowDrop?.indicator.value?.visible)
  return dragging || indicatorVisible || isDragOver.value
})

// ========== Box Model Overlays (Margin + Padding) ==========

/** Resolved pixel values for each margin side */
const marginPx = computed(() => {
  const style = currentNode.value?.style || {}
  return {
    top: resolveSpacingNumber(style, 'top'),
    right: resolveSpacingNumber(style, 'right'),
    bottom: resolveSpacingNumber(style, 'bottom'),
    left: resolveSpacingNumber(style, 'left'),
  }
})

/** Show margin overlays: any layout mode, selected or hovered */
const showMarginOverlays = computed(() => {
  if (isDragFeedbackActive.value) return false
  return isSelected.value || isHovered.value
})

const paddingStyleKeyMap: Record<FlowSpacingSide, keyof NodeStyle> = {
  top: 'paddingTop',
  right: 'paddingRight',
  bottom: 'paddingBottom',
  left: 'paddingLeft',
}

const parsePaddingShorthand = (val: string): [string, string, string, string] | null => {
  const parts = val.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) return [parts[0], parts[0], parts[0], parts[0]]
  if (parts.length === 2) return [parts[0], parts[1], parts[0], parts[1]]
  if (parts.length === 3) return [parts[0], parts[1], parts[2], parts[1]]
  if (parts.length === 4) return [parts[0], parts[1], parts[2], parts[3]]
  return null
}

const resolvePaddingNumber = (style: NodeStyle, side: FlowSpacingSide): number => {
  const sideKey = paddingStyleKeyMap[side]
  const specific = parseSpacingNumber(style[sideKey])
  if (specific !== null) return specific

  if (typeof style.padding === 'string') {
    const shorthand = parsePaddingShorthand(style.padding)
    if (shorthand) {
      const sideIndex = side === 'top' ? 0 : side === 'right' ? 1 : side === 'bottom' ? 2 : 3
      const parsed = parseSpacingNumber(shorthand[sideIndex])
      if (parsed !== null) return parsed
    }
  }

  const common = parseSpacingNumber(style.padding)
  if (common !== null) return common
  return 0
}

/** Resolved pixel values for each padding side */
const paddingPx = computed(() => {
  const style = currentNode.value?.style || {}
  return {
    top: resolvePaddingNumber(style, 'top'),
    right: resolvePaddingNumber(style, 'right'),
    bottom: resolvePaddingNumber(style, 'bottom'),
    left: resolvePaddingNumber(style, 'left'),
  }
})

/** Show padding overlays: any mode, selected only (always show to allow dragging from zero) */
const showPaddingOverlays = computed(() => {
  if (isDragFeedbackActive.value) return false
  return isSelected.value
})

const isMarginSideVisible = (side: FlowSpacingSide): boolean => {
  if (!showMarginOverlays.value) return false
  if (!isSpacingAdjusting.value || activeSpacingKind.value !== 'margin') return true
  return activeSpacingSide.value === side
}

const isPaddingSideVisible = (side: FlowSpacingSide): boolean => {
  if (!showPaddingOverlays.value) return false
  if (!isSpacingAdjusting.value || activeSpacingKind.value !== 'padding') return true
  return activeSpacingSide.value === side
}

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
    'is-grid-item': props.parentLayoutMode === 'grid',
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
  void _v

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
      height: formatValue(
        (geometry?.height ?? style.height) as string | number | undefined,
        'auto',
      ),
      zIndex: geometry?.zIndex ?? (style.zIndex as number | undefined) ?? 0,
      transform: rotateTransform || undefined,
      transformOrigin: rotateTransform ? 'center center' : undefined,
    }
  }

  // Adaptive grid mode: components placed via gridColumnStart/End, gridRowStart/End
  if (props.parentLayoutMode === 'grid') {
    const geometry =
      node.geometry?.mode === 'grid' ? (node.geometry as GridNodeGeometry) : undefined
    const style = node.style || {}

    return {
      gridColumn: geometry ? `${geometry.gridColumnStart} / ${geometry.gridColumnEnd}` : '1 / 2',
      gridRow: geometry ? `${geometry.gridRowStart} / ${geometry.gridRowEnd}` : '1 / 2',
      // No explicit width/height: CSS grid's default justify-self/align-self:stretch fills the cell.
      // Setting width:100% here would cause margin overflow (100% + margins > cell width).
      margin: formatOptionalValue(style.margin as string | number | undefined),
      marginTop: formatOptionalValue(style.marginTop as string | number | undefined),
      marginRight: formatOptionalValue(style.marginRight as string | number | undefined),
      marginBottom: formatOptionalValue(style.marginBottom as string | number | undefined),
      marginLeft: formatOptionalValue(style.marginLeft as string | number | undefined),
    }
  }

  return {}
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
let dragCancelled = false

const handleDragStart = (e: DragEvent) => {
  if (isFreeParent.value) return
  if (!e.dataTransfer || !currentNode.value) return

  isDragging.value = true
  dragCancelled = false
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

  // Escape 键取消拖拽
  const onKeyDown = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') {
      dragCancelled = true
      flowDrop?.hideIndicator()
      window.removeEventListener('keydown', onKeyDown)
    }
  }
  window.addEventListener('keydown', onKeyDown)

  // 拖拽结束时清理监听器
  const cleanup = () => {
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('dragend', cleanup)
  }
  window.addEventListener('dragend', cleanup)
}

const handleDragEnd = () => {
  if (isFreeParent.value) return
  isDragging.value = false
  isDragOver.value = false
  dragCancelled = false
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
  // 如果拖拽被取消，不执行放置
  if (dragCancelled) {
    dragCancelled = false
    return
  }
  flowDrop.handleDrop(e)
}

type FlowResizeHandle = 'n' | 'e' | 's' | 'w' | 'nw' | 'ne' | 'se' | 'sw'
type FlowSpacingSide = 'top' | 'right' | 'bottom' | 'left'
const marginStyleKeyMap: Record<FlowSpacingSide, keyof NodeStyle> = {
  top: 'marginTop',
  right: 'marginRight',
  bottom: 'marginBottom',
  left: 'marginLeft',
}

/**
 * Parse a CSS length value (px or unitless number) into a number.
 * Returns null for non-absolute values (%, em, rem, etc.).
 */
const parseAbsoluteLength = (val: unknown): number | null => {
  if (typeof val === 'number' && Number.isFinite(val)) return val
  if (typeof val === 'string') {
    const trimmed = val.trim()
    if (!trimmed) return null
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number.parseFloat(trimmed)
    if (/^-?\d+(\.\d+)?px$/.test(trimmed)) return Number.parseFloat(trimmed)
  }
  return null
}

const clampNumber = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value))
}

const parseGridSpan = (value: unknown, fallback: number): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(1, Math.round(value))
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    const spanMatch = trimmed.match(/^span\s+(\d+)$/i)
    if (spanMatch) {
      return Math.max(1, Number.parseInt(spanMatch[1], 10))
    }
    const parsed = Number.parseFloat(trimmed)
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.max(1, Math.round(parsed))
    }
  }
  return fallback
}

const parseSpacingNumber = parseAbsoluteLength

const parseMarginShorthand = (val: string): [string, string, string, string] | null => {
  const parts = val.trim().split(/\s+/).filter(Boolean)

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
  if (props.parentLayoutMode !== 'grid') return
  if (!currentNode.value || !wrapperRef.value) return

  // Adaptive grid mode: resize by adjusting fr ratios
  if (props.parentLayoutMode === 'grid') {
    handleGridFrResize(handle, e)
    return
  }

  // Ensure current node is the active selection when resize starts
  selectComponent(props.nodeId)
  isResizing.value = true
  setHovered(null)

  const startX = e.clientX
  const startY = e.clientY
  const style = currentNode.value.style || {}
  const parentEl = wrapperRef.value.parentElement
  const parentRect = parentEl?.getBoundingClientRect()
  const parentStyle = parentEl ? window.getComputedStyle(parentEl) : null
  const columnsRaw = Number.parseInt(parentStyle?.getPropertyValue('--vela-grid-columns') || '', 10)
  const gapRaw = Number.parseFloat(parentStyle?.getPropertyValue('--vela-grid-gap') || '')
  const rowHeightRaw = Number.parseFloat(
    parentStyle?.getPropertyValue('--vela-grid-row-height') || '',
  )
  const columns = Number.isFinite(columnsRaw) ? clampNumber(columnsRaw, 1, 24) : 12
  const gap = Number.isFinite(gapRaw) ? clampNumber(Math.round(gapRaw), 0, 48) : 12
  const rowHeight = Number.isFinite(rowHeightRaw)
    ? clampNumber(Math.round(rowHeightRaw), 8, 120)
    : 24
  const parentWidth = parentRect?.width ?? parentEl?.clientWidth ?? sizeStore.width
  const cellWidth = Math.max(1, (parentWidth - (columns - 1) * gap) / columns)
  const colUnit = Math.max(1, cellWidth + gap)
  const rowUnit = Math.max(1, rowHeight + gap)
  const baseColSpan = parseGridSpan(style.gridColumn, isContainer.value ? 12 : 3)
  const baseRowSpan = parseGridSpan(style.gridRow, 4)

  let rafId = 0
  let pendingColSpan: number | undefined
  let pendingRowSpan: number | undefined
  let cancelled = false

  const flushStyleUpdate = () => {
    rafId = 0
    if (cancelled) return

    const patch: Partial<NodeStyle> = {}

    if (pendingColSpan !== undefined) {
      patch.gridColumn = `span ${pendingColSpan}`
    }
    if (pendingRowSpan !== undefined) {
      patch.gridRow = `span ${pendingRowSpan}`
    }
    patch.width = '100%'
    patch.height = '100%'
    patch.minHeight = '100%'

    if (Object.keys(patch).length > 0) {
      updateStyle(props.nodeId, patch)
    }
  }

  const cursorMap: Record<FlowResizeHandle, string> = {
    n: 'ns-resize',
    s: 'ns-resize',
    e: 'ew-resize',
    w: 'ew-resize',
    nw: 'nwse-resize',
    se: 'nwse-resize',
    ne: 'nesw-resize',
    sw: 'nesw-resize',
  }

  const prevCursor = document.body.style.cursor
  const prevUserSelect = document.body.style.userSelect
  document.body.style.userSelect = 'none'
  document.body.style.cursor = cursorMap[handle]

  const onMouseMove = (ev: MouseEvent) => {
    if (cancelled) return

    // Compensate for canvas zoom: mouse pixels → stage pixels
    const s = canvasScale.value || 1
    const dx = (ev.clientX - startX) / s
    const dy = (ev.clientY - startY) / s
    const colDelta = Math.round(dx / colUnit)
    const rowDelta = Math.round(dy / rowUnit)

    // East/West resize: adjust column span
    if (handle === 'e' || handle === 'ne' || handle === 'se') {
      pendingColSpan = clampNumber(baseColSpan + colDelta, 1, columns)
    }
    if (handle === 'w' || handle === 'nw' || handle === 'sw') {
      pendingColSpan = clampNumber(baseColSpan - colDelta, 1, columns)
    }

    // North/South resize: adjust row span
    if (handle === 's' || handle === 'se' || handle === 'sw') {
      pendingRowSpan = clampNumber(baseRowSpan + rowDelta, 1, 48)
    }
    if (handle === 'n' || handle === 'nw' || handle === 'ne') {
      pendingRowSpan = clampNumber(baseRowSpan - rowDelta, 1, 48)
    }

    flowResizeInfo.value = {
      width: Math.round(pendingColSpan ?? baseColSpan),
      height: Math.round(pendingRowSpan ?? baseRowSpan),
    }

    if (rafId === 0) {
      rafId = requestAnimationFrame(flushStyleUpdate)
    }
  }

  const cleanup = () => {
    if (rafId !== 0) {
      cancelAnimationFrame(rafId)
      if (!cancelled) {
        flushStyleUpdate()
      }
    }

    // Restore original values when Escape was pressed
    if (cancelled) {
      const restorePatch: Partial<NodeStyle> = {
        gridColumn: `span ${baseColSpan}`,
        gridRow: `span ${baseRowSpan}`,
        width: '100%',
        height: '100%',
        minHeight: '100%',
      }
      updateStyle(props.nodeId, restorePatch)
    }

    document.body.style.cursor = prevCursor
    document.body.style.userSelect = prevUserSelect
    isResizing.value = false
    flowResizeInfo.value = null
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
    window.removeEventListener('keydown', onKeyDown)
  }

  const onMouseUp = () => {
    cleanup()
  }

  const onKeyDown = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') {
      cancelled = true
      cleanup()
    }
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
  window.addEventListener('keydown', onKeyDown)
}

/**
 * Grid fr-ratio resize handler.
 * Adjusts the parent container's grid-template-columns/rows fr values.
 */
const handleGridFrResize = (handle: FlowResizeHandle, e: MouseEvent) => {
  if (!currentNode.value || !wrapperRef.value) return

  selectComponent(props.nodeId)
  isResizing.value = true
  setHovered(null)

  const startX = e.clientX
  const startY = e.clientY
  const geo =
    currentNode.value.geometry?.mode === 'grid'
      ? (currentNode.value.geometry as GridNodeGeometry)
      : null
  if (!geo) {
    isResizing.value = false
    return
  }

  const parentId = componentStore.getParentId(props.nodeId)
  if (!parentId) {
    isResizing.value = false
    return
  }
  const parentNode = componentStore.findNodeById(parentId)
  const parentContainer =
    parentNode?.container?.mode === 'grid' ? (parentNode.container as GridContainerLayout) : null
  if (!parentContainer) {
    isResizing.value = false
    return
  }

  const parentEl = wrapperRef.value.parentElement
  const parentRect = parentEl?.getBoundingClientRect()
  if (!parentRect) {
    isResizing.value = false
    return
  }

  const colFrValues = parseFrTemplate(parentContainer.columns)
  const rowFrValues = parseFrTemplate(parentContainer.rows)
  const baseColFr = [...colFrValues]
  const baseRowFr = [...rowFrValues]
  const totalColPx = parentRect.width
  const totalRowPx = parentRect.height

  // Determine which boundary line this handle drags
  // For east handle: the boundary is between column (colEnd-2) and (colEnd-1) (0-indexed)
  const colBoundary =
    handle === 'e' || handle === 'ne' || handle === 'se'
      ? geo.gridColumnEnd - 2 // 0-indexed right boundary
      : handle === 'w' || handle === 'nw' || handle === 'sw'
        ? geo.gridColumnStart - 2 // 0-indexed left boundary
        : -1
  const rowBoundary =
    handle === 's' || handle === 'se' || handle === 'sw'
      ? geo.gridRowEnd - 2
      : handle === 'n' || handle === 'nw' || handle === 'ne'
        ? geo.gridRowStart - 2
        : -1

  let rafId = 0
  let cancelled = false

  const cursorMap: Record<FlowResizeHandle, string> = {
    n: 'ns-resize',
    s: 'ns-resize',
    e: 'ew-resize',
    w: 'ew-resize',
    nw: 'nwse-resize',
    se: 'nwse-resize',
    ne: 'nesw-resize',
    sw: 'nesw-resize',
  }
  const prevCursor = document.body.style.cursor
  const prevUserSelect = document.body.style.userSelect
  document.body.style.userSelect = 'none'
  document.body.style.cursor = cursorMap[handle]

  const onMouseMove = (ev: MouseEvent) => {
    if (cancelled) return
    const s = canvasScale.value || 1
    const dx = (ev.clientX - startX) / s
    const dy = (ev.clientY - startY) / s

    const newColFr = [...baseColFr]
    const newRowFr = [...baseRowFr]

    // Adjust column fr values
    if (colBoundary >= 0 && colBoundary < colFrValues.length - 1) {
      const totalColFr = baseColFr.reduce((a, b) => a + b, 0)
      const frPerPx = totalColFr / totalColPx
      const sign = handle === 'w' || handle === 'nw' || handle === 'sw' ? -1 : 1
      const frDelta = dx * frPerPx * sign
      newColFr[colBoundary] = Math.max(0.1, baseColFr[colBoundary] + frDelta)
      newColFr[colBoundary + 1] = Math.max(0.1, baseColFr[colBoundary + 1] - frDelta)
    }

    // Adjust row fr values
    if (rowBoundary >= 0 && rowBoundary < rowFrValues.length - 1) {
      const totalRowFr = baseRowFr.reduce((a, b) => a + b, 0)
      const frPerPx = totalRowFr / totalRowPx
      const sign = handle === 'n' || handle === 'nw' || handle === 'ne' ? -1 : 1
      const frDelta = dy * frPerPx * sign
      newRowFr[rowBoundary] = Math.max(0.1, baseRowFr[rowBoundary] + frDelta)
      newRowFr[rowBoundary + 1] = Math.max(0.1, baseRowFr[rowBoundary + 1] - frDelta)
    }

    flowResizeInfo.value = {
      width: Math.round(newColFr[colBoundary >= 0 ? colBoundary : 0] * 10) / 10,
      height: Math.round(newRowFr[rowBoundary >= 0 ? rowBoundary : 0] * 10) / 10,
    }

    if (rafId === 0) {
      const cols = buildFrTemplate(newColFr)
      const rows = buildFrTemplate(newRowFr)
      rafId = requestAnimationFrame(() => {
        rafId = 0
        if (cancelled) return
        componentStore.updateGridTemplate(parentId, cols, rows)
      })
    }
  }

  const cleanup = () => {
    if (rafId !== 0) cancelAnimationFrame(rafId)
    if (cancelled) {
      componentStore.updateGridTemplate(
        parentId,
        buildFrTemplate(baseColFr),
        buildFrTemplate(baseRowFr),
      )
    }
    document.body.style.cursor = prevCursor
    document.body.style.userSelect = prevUserSelect
    isResizing.value = false
    flowResizeInfo.value = null
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
    window.removeEventListener('keydown', onKeyDown)
  }

  const onMouseUp = () => cleanup()
  const onKeyDown = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') {
      cancelled = true
      cleanup()
    }
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
  window.addEventListener('keydown', onKeyDown)
}

/** Margin 调整范围配置 */
const MARGIN_RANGE = { min: -500, max: 1000 }

const handleFlowSpacingDragStart = (side: FlowSpacingSide, e: MouseEvent) => {
  if (!currentNode.value) return

  selectComponent(props.nodeId)
  isSpacingAdjusting.value = true
  activeSpacingKind.value = 'margin'
  activeSpacingSide.value = side
  setHovered(null)

  const startX = e.clientX
  const startY = e.clientY
  const style = currentNode.value.style || {}
  const baseMargin = resolveSpacingNumber(style, side)
  const styleKey = marginStyleKeyMap[side]

  let rafId = 0
  let pendingMargin: number | undefined
  let cancelled = false

  const flushMarginUpdate = () => {
    rafId = 0
    if (cancelled || pendingMargin === undefined) return

    const patch = { [styleKey]: Math.round(pendingMargin) } as Partial<NodeStyle>
    updateStyle(props.nodeId, patch)
  }

  const prevCursor = document.body.style.cursor
  const prevUserSelect = document.body.style.userSelect
  document.body.style.userSelect = 'none'
  document.body.style.cursor = side === 'top' || side === 'bottom' ? 'ns-resize' : 'ew-resize'

  const onMouseMove = (ev: MouseEvent) => {
    if (cancelled) return

    // Compensate for canvas zoom: mouse pixels → stage pixels
    const s = canvasScale.value || 1
    const dx = (ev.clientX - startX) / s
    const dy = (ev.clientY - startY) / s

    let next = baseMargin
    if (side === 'top') next = baseMargin - dy
    if (side === 'bottom') next = baseMargin + dy
    if (side === 'left') next = baseMargin - dx
    if (side === 'right') next = baseMargin + dx

    pendingMargin = Math.min(MARGIN_RANGE.max, Math.max(MARGIN_RANGE.min, next))

    if (rafId === 0) {
      rafId = requestAnimationFrame(flushMarginUpdate)
    }
  }

  const cleanup = () => {
    if (rafId !== 0) {
      cancelAnimationFrame(rafId)
      if (!cancelled) {
        flushMarginUpdate()
      }
    }

    // Restore original margin when Escape was pressed
    if (cancelled) {
      const restorePatch = { [styleKey]: Math.round(baseMargin) } as Partial<NodeStyle>
      updateStyle(props.nodeId, restorePatch)
    }

    document.body.style.cursor = prevCursor
    document.body.style.userSelect = prevUserSelect
    isSpacingAdjusting.value = false
    activeSpacingKind.value = null
    activeSpacingSide.value = null
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
    window.removeEventListener('keydown', onKeyDown)
  }

  const onMouseUp = () => {
    cleanup()
  }

  const onKeyDown = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') {
      cancelled = true
      cleanup()
    }
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
  window.addEventListener('keydown', onKeyDown)
}

/** Padding range: 0 to 500px */
const PADDING_RANGE = { min: 0, max: 500 }

const handlePaddingDragStart = (side: FlowSpacingSide, e: MouseEvent) => {
  if (!currentNode.value) return

  selectComponent(props.nodeId)
  isSpacingAdjusting.value = true
  activeSpacingKind.value = 'padding'
  activeSpacingSide.value = side
  setHovered(null)

  const startX = e.clientX
  const startY = e.clientY
  const style = currentNode.value.style || {}
  const baseVal = resolvePaddingNumber(style, side)
  const styleKey = paddingStyleKeyMap[side]

  let rafId = 0
  let pendingVal: number | undefined
  let cancelled = false

  const flushUpdate = () => {
    rafId = 0
    if (cancelled || pendingVal === undefined) return
    const patch = { [styleKey]: Math.round(pendingVal) } as Partial<NodeStyle>
    updateStyle(props.nodeId, patch)
  }

  const prevCursor = document.body.style.cursor
  const prevUserSelect = document.body.style.userSelect
  document.body.style.userSelect = 'none'
  document.body.style.cursor = side === 'top' || side === 'bottom' ? 'ns-resize' : 'ew-resize'

  const onMouseMove = (ev: MouseEvent) => {
    if (cancelled) return
    const s = canvasScale.value || 1
    const dx = (ev.clientX - startX) / s
    const dy = (ev.clientY - startY) / s

    // Dragging inward (toward content center) increases padding
    let next = baseVal
    if (side === 'top') next = baseVal + dy
    if (side === 'bottom') next = baseVal - dy
    if (side === 'left') next = baseVal + dx
    if (side === 'right') next = baseVal - dx

    pendingVal = Math.min(PADDING_RANGE.max, Math.max(PADDING_RANGE.min, next))

    if (rafId === 0) {
      rafId = requestAnimationFrame(flushUpdate)
    }
  }

  const cleanup = () => {
    if (rafId !== 0) {
      cancelAnimationFrame(rafId)
      if (!cancelled) flushUpdate()
    }

    if (cancelled) {
      const restorePatch = { [styleKey]: Math.round(baseVal) } as Partial<NodeStyle>
      updateStyle(props.nodeId, restorePatch)
    }

    document.body.style.cursor = prevCursor
    document.body.style.userSelect = prevUserSelect
    isSpacingAdjusting.value = false
    activeSpacingKind.value = null
    activeSpacingSide.value = null
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
    window.removeEventListener('keydown', onKeyDown)
  }

  const onMouseUp = () => cleanup()
  const onKeyDown = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') {
      cancelled = true
      cleanup()
    }
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
  window.addEventListener('keydown', onKeyDown)
}

// ========== Event Handlers ==========
const handleClick = (e: MouseEvent) => {
  // Alt + Click: quick-select parent container to improve nested container editing
  if (e.altKey) {
    const parentId = componentStore.getParentId(props.nodeId)
    if (parentId) {
      selectComponent(parentId)
      emit('select', parentId)
      return
    }
  }

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

.editor-node-wrapper.is-grid-item {
  border: 1px solid rgba(14, 116, 144, 0.14);
  background: rgba(240, 249, 255, 0.16);
}

/* ========== Interaction Blocker ========== */
/* Transparent overlay that captures all pointer events in edit mode.
   This prevents component-internal handlers (switch toggle, button click, etc.)
   from firing while editing. z-index 1 sits above the component content
   but below resize handles (z-index 12) and box-model overlays (z-index 11). */
.interaction-blocker {
  position: absolute;
  inset: 0;
  z-index: 1;
  cursor: pointer;
  background: transparent;
  pointer-events: auto;
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
  /* Use inset box-shadow instead of padding to avoid shifting child positions.
     padding would move the inner component element and cause absolute-positioned
     children (free-mode sub-layout) to drift. */
  box-shadow: inset 0 0 0 1px rgba(14, 116, 144, 0.35);
  background: rgba(240, 249, 255, 0.45);
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

/* Edge handles - horizontal bars */
.flow-resize-handle.handle-n {
  top: -5px;
  left: 50%;
  width: 20px;
  height: 10px;
  transform: translateX(-50%);
  cursor: ns-resize;
}

.flow-resize-handle.handle-s {
  bottom: -5px;
  left: 50%;
  width: 20px;
  height: 10px;
  transform: translateX(-50%);
  cursor: ns-resize;
}

/* Edge handles - vertical bars */
.flow-resize-handle.handle-e {
  top: 50%;
  right: -5px;
  width: 10px;
  height: 20px;
  transform: translateY(-50%);
  cursor: ew-resize;
}

.flow-resize-handle.handle-w {
  top: 50%;
  left: -5px;
  width: 10px;
  height: 20px;
  transform: translateY(-50%);
  cursor: ew-resize;
}

/* Corner handles */
.flow-resize-handle.handle-nw {
  top: -6px;
  left: -6px;
  width: 12px;
  height: 12px;
  cursor: nwse-resize;
}

.flow-resize-handle.handle-ne {
  top: -6px;
  right: -6px;
  width: 12px;
  height: 12px;
  cursor: nesw-resize;
}

.flow-resize-handle.handle-se {
  right: -6px;
  bottom: -6px;
  width: 12px;
  height: 12px;
  cursor: nwse-resize;
}

.flow-resize-handle.handle-sw {
  bottom: -6px;
  left: -6px;
  width: 12px;
  height: 12px;
  cursor: nesw-resize;
}

/* ========== Box Model Overlays (Margin + Padding) ========== */

.box-overlay {
  position: absolute;
  z-index: 11;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  user-select: none;
}

.overlay-label {
  font-size: 9px;
  font-weight: 600;
  white-space: nowrap;
  line-height: 1;
  padding: 1px 4px;
  border-radius: 3px;
  opacity: 0.9;
}

/* Margin overlays - orange, extend OUTSIDE the wrapper using negative coordinates */
.margin-overlay {
  background: rgba(251, 146, 60, 0.18);
  border: 1px solid rgba(234, 88, 12, 0.45);
  transition: background 0.1s;
}

.margin-overlay:hover {
  background: rgba(251, 146, 60, 0.32);
}

.margin-overlay .overlay-label {
  background: rgba(255, 237, 213, 0.97);
  color: #c2410c;
  border: 1px solid rgba(234, 88, 12, 0.25);
}

.margin-overlay-top {
  left: 0;
  right: 0;
  cursor: ns-resize;
  /* top is set via inline style: -Math.max(marginTop, 4)px */
}

.margin-overlay-bottom {
  left: 0;
  right: 0;
  cursor: ns-resize;
  /* bottom is set via inline style: -Math.max(marginBottom, 4)px */
}

.margin-overlay-left {
  top: 0;
  bottom: 0;
  cursor: ew-resize;
  /* left is set via inline style: -Math.max(marginLeft, 4)px */
}

.margin-overlay-right {
  top: 0;
  bottom: 0;
  cursor: ew-resize;
  /* right is set via inline style: -Math.max(marginRight, 4)px */
}

/* Padding overlays - green, stay inside the wrapper */
.padding-overlay {
  background: rgba(52, 211, 153, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.4);
  transition: background 0.1s;
}

.padding-overlay:hover {
  background: rgba(52, 211, 153, 0.28);
}

.padding-overlay .overlay-label {
  background: rgba(209, 250, 229, 0.97);
  color: #065f46;
  border: 1px solid rgba(16, 185, 129, 0.25);
}

.padding-overlay-top {
  top: 0;
  cursor: ns-resize;
  /* height, left, right set via inline style */
}

.padding-overlay-bottom {
  bottom: 0;
  cursor: ns-resize;
  /* height, left, right set via inline style */
}

.padding-overlay-left {
  left: 0;
  cursor: ew-resize;
  /* width, top, bottom set via inline style */
}

.padding-overlay-right {
  right: 0;
  cursor: ew-resize;
  /* width, top, bottom set via inline style */
}

.flow-resize-tooltip {
  position: absolute;
  right: 0;
  bottom: -22px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.4;
  white-space: nowrap;
  pointer-events: none;
  z-index: 100;
}
</style>
