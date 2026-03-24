<template>
  <div
    ref="wrapperRef"
    :class="wrapperClasses"
    :style="wrapperStyle"
    :data-id="nodeId"
    :data-component="componentLabel"
    :data-label="componentLabel"
    :data-node-id="nodeId"
    :data-component-id="nodeId"
    :draggable="!isFreeParent && !isResizing && !isSpacingAdjusting && !suppressNativeDrag"
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

    <!-- Strict selection outline that follows rendered content bbox (grid non-container nodes) -->
    <div
      v-if="contentSelectionOutlineStyle"
      class="content-selection-outline"
      :style="contentSelectionOutlineStyle"
    />

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
          height: Math.max(marginPx.top, MIN_MARGIN_HIT_SIZE) + 'px',
          top: -Math.max(marginPx.top, MIN_MARGIN_HIT_SIZE) + 'px',
        }"
        @mousedown.stop.prevent="handleFlowSpacingDragStart('top', $event)"
        @dragstart.stop.prevent
      >
        <span v-if="showMarginLabel('top')" class="overlay-label">
          {{ formatSpacingLabel('margin', 'top') }}
        </span>
      </div>
      <div
        v-if="isMarginSideVisible('right')"
        class="box-overlay margin-overlay margin-overlay-right"
        :style="{
          width: Math.max(marginPx.right, MIN_MARGIN_HIT_SIZE) + 'px',
          right: -Math.max(marginPx.right, MIN_MARGIN_HIT_SIZE) + 'px',
        }"
        @mousedown.stop.prevent="handleFlowSpacingDragStart('right', $event)"
        @dragstart.stop.prevent
      >
        <span v-if="showMarginLabel('right')" class="overlay-label">
          {{ formatSpacingLabel('margin', 'right') }}
        </span>
      </div>
      <div
        v-if="isMarginSideVisible('bottom')"
        class="box-overlay margin-overlay margin-overlay-bottom"
        :style="{
          height: Math.max(marginPx.bottom, MIN_MARGIN_HIT_SIZE) + 'px',
          bottom: -Math.max(marginPx.bottom, MIN_MARGIN_HIT_SIZE) + 'px',
        }"
        @mousedown.stop.prevent="handleFlowSpacingDragStart('bottom', $event)"
        @dragstart.stop.prevent
      >
        <span v-if="showMarginLabel('bottom')" class="overlay-label">
          {{ formatSpacingLabel('margin', 'bottom') }}
        </span>
      </div>
      <div
        v-if="isMarginSideVisible('left')"
        class="box-overlay margin-overlay margin-overlay-left"
        :style="{
          width: Math.max(marginPx.left, MIN_MARGIN_HIT_SIZE) + 'px',
          left: -Math.max(marginPx.left, MIN_MARGIN_HIT_SIZE) + 'px',
        }"
        @mousedown.stop.prevent="handleFlowSpacingDragStart('left', $event)"
        @dragstart.stop.prevent
      >
        <span v-if="showMarginLabel('left')" class="overlay-label">
          {{ formatSpacingLabel('margin', 'left') }}
        </span>
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
          height: Math.max(paddingPx.top, MIN_PADDING_HIT_SIZE) + 'px',
          left: paddingPx.left + 'px',
          right: paddingPx.right + 'px',
        }"
        @mousedown.stop.prevent="handlePaddingDragStart('top', $event)"
        @dragstart.stop.prevent
      >
        <span v-if="showPaddingLabel('top')" class="overlay-label">
          {{ formatSpacingLabel('padding', 'top') }}
        </span>
      </div>
      <div
        v-if="isPaddingSideVisible('bottom')"
        class="box-overlay padding-overlay padding-overlay-bottom"
        :style="{
          height: Math.max(paddingPx.bottom, MIN_PADDING_HIT_SIZE) + 'px',
          left: paddingPx.left + 'px',
          right: paddingPx.right + 'px',
        }"
        @mousedown.stop.prevent="handlePaddingDragStart('bottom', $event)"
        @dragstart.stop.prevent
      >
        <span v-if="showPaddingLabel('bottom')" class="overlay-label">
          {{ formatSpacingLabel('padding', 'bottom') }}
        </span>
      </div>
      <div
        v-if="isPaddingSideVisible('left')"
        class="box-overlay padding-overlay padding-overlay-left"
        :style="{
          width: Math.max(paddingPx.left, MIN_PADDING_HIT_SIZE) + 'px',
          top: paddingPx.top + 'px',
          bottom: paddingPx.bottom + 'px',
        }"
        @mousedown.stop.prevent="handlePaddingDragStart('left', $event)"
        @dragstart.stop.prevent
      >
        <span v-if="showPaddingLabel('left')" class="overlay-label">
          {{ formatSpacingLabel('padding', 'left') }}
        </span>
      </div>
      <div
        v-if="isPaddingSideVisible('right')"
        class="box-overlay padding-overlay padding-overlay-right"
        :style="{
          width: Math.max(paddingPx.right, MIN_PADDING_HIT_SIZE) + 'px',
          top: paddingPx.top + 'px',
          bottom: paddingPx.bottom + 'px',
        }"
        @mousedown.stop.prevent="handlePaddingDragStart('right', $event)"
        @dragstart.stop.prevent
      >
        <span v-if="showPaddingLabel('right')" class="overlay-label">
          {{ formatSpacingLabel('padding', 'right') }}
        </span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, inject, watch, onBeforeUnmount, type CSSProperties } from 'vue'
import { storeToRefs } from 'pinia'
import { useComponent } from '@/stores/component'
import { useUIStore } from '@/stores/ui'
import { useCanvasContext } from '@/components/Canvas/composables/useCanvasContext'
import {
  countTracks,
  type GridContainerLayout,
  type GridItemLayout,
  type GridNodeGeometry,
  type NodeSchema,
  type NodeStyle,
} from '@vela/core'
import type { UseFlowDropReturn } from './useFlowDrop'

interface Props {
  nodeId: string
  componentName?: string
  node?: NodeSchema
  parentLayoutMode?: 'grid'
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
const { selectedId, selectedIds, hoveredId, rootNode } = storeToRefs(componentStore)
const { isSimulationMode } = storeToRefs(uiStore)
const { selectComponent, selectByHitPath, toggleSelection, findNodeById, setHovered, updateStyle } =
  componentStore

// ========== Refs ==========
const wrapperRef = ref<HTMLDivElement | null>(null)
const isDragging = ref(false)
const isDragOver = ref(false)
const isResizing = ref(false)
const isSpacingAdjusting = ref(false)
const suppressNativeDrag = ref(false)
const activeSpacingKind = ref<'margin' | 'padding' | null>(null)
const activeSpacingSide = ref<'top' | 'right' | 'bottom' | 'left' | null>(null)
let cleanupActiveSpacingAdjust: (() => void) | null = null
const isFreeParent = computed(() => false)

const applyWrapperDraggableState = () => {
  const wrapper = wrapperRef.value
  if (!wrapper) return
  wrapper.draggable =
    !isFreeParent.value &&
    !isResizing.value &&
    !isSpacingAdjusting.value &&
    !suppressNativeDrag.value
}

const setNativeDragSuppressed = (value: boolean) => {
  suppressNativeDrag.value = value
  applyWrapperDraggableState()
}

// ========== Computed ==========
const isSelected = computed(() => selectedIds.value.includes(props.nodeId))
const isHovered = computed(() => hoveredId.value === props.nodeId)
const showFlowResizeHandles = computed(() => selectedId.value === props.nodeId)

const currentNode = computed(() => {
  // Always prefer indexed lookup to avoid stale node snapshots after undo/redo
  // or tree replacement. Fallback to prop only when index is unavailable.
  if (rootNode.value) {
    const indexedNode = findNodeById(rootNode.value, props.nodeId)
    if (indexedNode) return indexedNode
  }
  return props.node || null
})

const componentLabel = computed(() => {
  return props.componentName || currentNode.value?.component || ''
})

const isDragFeedbackActive = computed(() => {
  const dragging = Boolean(flowDrop?.draggingId.value)
  const indicatorVisible = Boolean(flowDrop?.indicator.value?.visible)
  return dragging || indicatorVisible || isDragOver.value
})

const shouldAllowSpacingAdjust = computed(() => {
  return props.parentLayoutMode === 'grid'
})

// ========== Box Model Overlays (Margin + Padding) ==========

type SpacingValues = Record<'top' | 'right' | 'bottom' | 'left', number>
type ContentSelectionRect = { left: number; top: number; width: number; height: number }

const parseComputedLength = (value: string | undefined): number => {
  if (!value) return 0
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const getWrapperContentEl = (): HTMLElement | null => {
  const wrapper = wrapperRef.value
  if (!wrapper) return null

  const escapedNodeId =
    typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
      ? CSS.escape(props.nodeId)
      : props.nodeId.replace(/["\\]/g, '\\$&')

  // Prefer the current node's own rendered content element. Some materials
  // (e.g. button) inject an extra wrapper, so universal-node-content may not
  // be a direct child of NodeWrapper.
  const ownContent = wrapper.querySelector(`.universal-node-content[data-id="${escapedNodeId}"]`)
  if (ownContent instanceof HTMLElement) {
    return ownContent
  }

  return (Array.from(wrapper.children).find(
    (child) => child instanceof HTMLElement && child.classList.contains('universal-node-content'),
  ) || null) as HTMLElement | null
}

const getContentSelectionRect = (): ContentSelectionRect | null => {
  const wrapper = wrapperRef.value
  const content = getWrapperContentEl()
  if (!wrapper || !content) return null

  const wrapperRect = wrapper.getBoundingClientRect()
  const contentRect = content.getBoundingClientRect()
  if (contentRect.width <= 0 || contentRect.height <= 0) return null

  return {
    left: contentRect.left - wrapperRect.left,
    top: contentRect.top - wrapperRect.top,
    width: contentRect.width,
    height: contentRect.height,
  }
}

const showContentSelectionOutline = computed(() => {
  if (!isSelected.value) return false
  if (props.parentLayoutMode !== 'grid') return false
  if (isContainer.value || isEmpty.value || isFreeParent.value) return false
  if (isDragFeedbackActive.value) return false
  return true
})

const contentSelectionOutlineStyle = computed<CSSProperties | null>(() => {
  if (!showContentSelectionOutline.value) return null

  // Trigger recomputation when style/props updates may affect rendered bbox.
  void componentStore.styleVersion[props.nodeId]

  const rect = getContentSelectionRect()
  if (!rect) return null

  return {
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  }
})

const getRenderedSpacingValues = (): { margin: SpacingValues; padding: SpacingValues } | null => {
  const wrapper = wrapperRef.value
  if (!wrapper) return null

  const wrapperComputedStyle = window.getComputedStyle(wrapper)
  const content = getWrapperContentEl()
  const contentComputedStyle = content ? window.getComputedStyle(content) : null

  return {
    margin: {
      top: parseComputedLength(wrapperComputedStyle.marginTop),
      right: parseComputedLength(wrapperComputedStyle.marginRight),
      bottom: parseComputedLength(wrapperComputedStyle.marginBottom),
      left: parseComputedLength(wrapperComputedStyle.marginLeft),
    },
    padding: {
      top: parseComputedLength(contentComputedStyle?.paddingTop),
      right: parseComputedLength(contentComputedStyle?.paddingRight),
      bottom: parseComputedLength(contentComputedStyle?.paddingBottom),
      left: parseComputedLength(contentComputedStyle?.paddingLeft),
    },
  }
}

const spacingSnapshot = computed(() => {
  // Track style mutations to refresh overlay values after style updates.
  void componentStore.styleVersion[props.nodeId]

  // Reading computed styles is expensive. Only do it for active targets to keep
  // canvas interactions stable when switching selection/hover rapidly.
  if (isSelected.value || isHovered.value || isSpacingAdjusting.value) {
    const renderedSpacing = getRenderedSpacingValues()
    if (renderedSpacing) return renderedSpacing
  }

  // Fallback before mount: derive from schema style.
  const style = currentNode.value?.style || {}
  return {
    margin: {
      top: resolveSpacingNumber(style, 'top'),
      right: resolveSpacingNumber(style, 'right'),
      bottom: resolveSpacingNumber(style, 'bottom'),
      left: resolveSpacingNumber(style, 'left'),
    },
    padding: {
      top: resolvePaddingNumber(style, 'top'),
      right: resolvePaddingNumber(style, 'right'),
      bottom: resolvePaddingNumber(style, 'bottom'),
      left: resolvePaddingNumber(style, 'left'),
    },
  }
})

/** Resolved pixel values for each margin side */
const marginPx = computed(() => spacingSnapshot.value.margin)

/** Show margin overlays: any layout mode, selected or hovered */
const showMarginOverlays = computed(() => {
  if (!shouldAllowSpacingAdjust.value) return false
  if (isDragFeedbackActive.value) return false
  if (selectedIds.value.length > 0) return isSelected.value
  return isHovered.value
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
const paddingPx = computed(() => spacingSnapshot.value.padding)

/** Show padding overlays: any mode, selected only (always show to allow dragging from zero) */
const showPaddingOverlays = computed(() => {
  if (!shouldAllowSpacingAdjust.value) return false
  if (isDragFeedbackActive.value) return false
  return isSelected.value
})

const MIN_MARGIN_HIT_SIZE = 14
const MIN_PADDING_HIT_SIZE = 6

const showMarginLabel = (side: FlowSpacingSide): boolean => {
  const val = marginPx.value[side]
  if (isSelected.value) return true
  return val > 0 || (isSpacingAdjusting.value && activeSpacingKind.value === 'margin')
}

const showPaddingLabel = (side: FlowSpacingSide): boolean => {
  if (isSelected.value) return true
  const val = paddingPx.value[side]
  return val > 0 || (isSpacingAdjusting.value && activeSpacingKind.value === 'padding')
}

const formatSpacingLabel = (kind: 'margin' | 'padding', side: FlowSpacingSide): string => {
  const value = kind === 'margin' ? marginPx.value[side] : paddingPx.value[side]
  return `${kind === 'margin' ? 'M' : 'P'}:${Math.round(value)}px`
}

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

const resetSpacingAdjustState = () => {
  isSpacingAdjusting.value = false
  activeSpacingKind.value = null
  activeSpacingSide.value = null
}

const stopSpacingAdjustIfNeeded = () => {
  if (cleanupActiveSpacingAdjust) {
    cleanupActiveSpacingAdjust()
    cleanupActiveSpacingAdjust = null
    return
  }
  resetSpacingAdjustState()
}

watch(
  () => selectedId.value,
  (nextSelectedId) => {
    if (nextSelectedId !== props.nodeId && isSpacingAdjusting.value) {
      stopSpacingAdjustIfNeeded()
    }
  },
)

onBeforeUnmount(() => {
  stopSpacingAdjustIfNeeded()
  setNativeDragSuppressed(false)
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
  'component-node',
  'shape-wrapper',
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

  // Grid mode: components placed via gridColumnStart/End, gridRowStart/End
  if (props.parentLayoutMode === 'grid') {
    const fallbackColSpan = isContainer.value ? 6 : 3
    const fallbackRowSpan = isContainer.value ? 4 : 2
    const geometry = layoutItemToGeometry(node.layoutItem, fallbackColSpan, fallbackRowSpan)
    const style = node.style || {}
    const layoutItem = node.layoutItem?.mode === 'grid' ? node.layoutItem : undefined
    const width =
      layoutItem?.sizeModeX === 'fixed' && Number.isFinite(layoutItem.fixedWidth)
        ? `${layoutItem.fixedWidth}px`
        : formatOptionalValue(style.width as string | number | undefined)
    const height =
      layoutItem?.sizeModeY === 'fixed' && Number.isFinite(layoutItem.fixedHeight)
        ? `${layoutItem.fixedHeight}px`
        : formatOptionalValue(style.height as string | number | undefined)
    const minWidth = formatOptionalValue(style.minWidth as string | number | undefined)
    const minHeight = formatOptionalValue(style.minHeight as string | number | undefined)
    const maxWidth = formatOptionalValue(style.maxWidth as string | number | undefined)
    const maxHeight = formatOptionalValue(style.maxHeight as string | number | undefined)
    const shouldStretchX =
      (layoutItem?.sizeModeX || 'stretch') === 'stretch' &&
      isContainer.value &&
      width === undefined &&
      minWidth === undefined
    const shouldStretchY =
      (layoutItem?.sizeModeY || 'stretch') === 'stretch' &&
      isContainer.value &&
      height === undefined &&
      minHeight === undefined
    const fallbackGridColumn =
      typeof style.gridColumn === 'string' && style.gridColumn.trim().length > 0
        ? style.gridColumn
        : 'auto'
    const fallbackGridRow =
      typeof style.gridRow === 'string' && style.gridRow.trim().length > 0 ? style.gridRow : 'auto'

    return {
      gridColumn: geometry
        ? `${geometry.gridColumnStart} / ${geometry.gridColumnEnd}`
        : fallbackGridColumn,
      gridRow: geometry ? `${geometry.gridRowStart} / ${geometry.gridRowEnd}` : fallbackGridRow,
      justifySelf: shouldStretchX ? 'stretch' : 'start',
      alignSelf: shouldStretchY ? 'stretch' : 'start',
      width,
      height,
      minWidth: minWidth ?? (shouldStretchX ? 0 : undefined),
      minHeight: minHeight ?? (shouldStretchY ? 0 : undefined),
      maxWidth,
      maxHeight,
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
  if (suppressNativeDrag.value) {
    e.preventDefault()
    return
  }
  if (!e.dataTransfer || !currentNode.value) return
  if (isSpacingAdjusting.value) {
    e.preventDefault()
    return
  }

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
  setNativeDragSuppressed(false)
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

const parseGridGapPx = (value: unknown, fallback = 8): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, value)
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.trim())
    if (Number.isFinite(parsed)) {
      return Math.max(0, parsed)
    }
  }
  return fallback
}

const parsePxTrackToken = (token: string): number | null => {
  const trimmed = token.trim()
  const pxMatch = trimmed.match(/^(-?\d+(?:\.\d+)?)px$/i)
  if (!pxMatch) return null
  const parsed = Number.parseFloat(pxMatch[1])
  if (!Number.isFinite(parsed)) return null
  return Math.max(1, parsed)
}

const parseTrackListPx = (template: string | undefined): number[] => {
  if (!template) return []
  const raw = template.trim()
  if (!raw || raw === 'none') return []
  const tokens = raw.split(/\s+/)
  const tracks: number[] = []
  for (const token of tokens) {
    const parsed = parsePxTrackToken(token)
    if (parsed !== null) tracks.push(parsed)
  }
  return tracks
}

const resolveRenderedGridScale = (
  el: HTMLElement,
  rect: DOMRect,
): { scaleX: number; scaleY: number } => {
  const scaleX = el.offsetWidth > 0 && Number.isFinite(rect.width) ? rect.width / el.offsetWidth : 1
  const scaleY =
    el.offsetHeight > 0 && Number.isFinite(rect.height) ? rect.height / el.offsetHeight : 1
  return {
    scaleX: Number.isFinite(scaleX) && scaleX > 0 ? scaleX : 1,
    scaleY: Number.isFinite(scaleY) && scaleY > 0 ? scaleY : 1,
  }
}

const resolveRenderedGridTracks = (
  containerEl: HTMLElement,
  containerRect: DOMRect,
  axis: 'column' | 'row',
  fallbackCount: number,
  fallbackTrackPx: number,
): number[] => {
  const computed = window.getComputedStyle(containerEl)
  const template = axis === 'column' ? computed.gridTemplateColumns : computed.gridTemplateRows
  const renderedTracks = parseTrackListPx(template)
  if (renderedTracks.length > 0) {
    const scale = resolveRenderedGridScale(containerEl, containerRect)
    const axisScale = axis === 'column' ? scale.scaleX : scale.scaleY
    return renderedTracks.map((track) => Math.max(1, track * axisScale))
  }
  return Array(Math.max(1, fallbackCount)).fill(Math.max(12, fallbackTrackPx))
}

const buildLinePositions = (startPx: number, tracks: number[], gapPx: number): number[] => {
  const lines: number[] = [startPx]
  let cursor = startPx
  tracks.forEach((track, index) => {
    cursor += track
    lines.push(cursor)
    if (index < tracks.length - 1) {
      cursor += gapPx
    }
  })
  return lines
}

const extendLinePositions = (
  lines: number[],
  gapPx: number,
  trackPx: number,
  targetLineCount: number,
): number[] => {
  const next = [...lines]
  while (next.length < targetLineCount) {
    const last = next[next.length - 1] ?? 0
    next.push(last + gapPx + trackPx)
  }
  return next
}

const snapClientToLine = (
  clientPx: number,
  linePositions: number[],
  minLine: number,
  maxLine: number,
): number => {
  if (linePositions.length === 0) return 1
  const safeMin = Math.max(1, Math.round(minLine))
  const safeMax = Math.max(safeMin, Math.min(Math.round(maxLine), linePositions.length))
  let bestLine = safeMin
  let minDistance = Number.POSITIVE_INFINITY

  for (let line = safeMin; line <= safeMax; line += 1) {
    const linePx = linePositions[line - 1]
    if (!Number.isFinite(linePx)) continue
    const distance = Math.abs(clientPx - linePx)
    if (distance < minDistance) {
      minDistance = distance
      bestLine = line
    }
  }

  return bestLine
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

const layoutItemToGeometry = (
  layoutItem: GridItemLayout | undefined,
  fallbackColSpan: number,
  fallbackRowSpan: number,
): GridNodeGeometry | null => {
  if (!layoutItem || layoutItem.mode !== 'grid') return null
  const colStart = Math.max(1, Math.round(layoutItem.placement.colStart ?? 1))
  const rowStart = Math.max(1, Math.round(layoutItem.placement.rowStart ?? 1))
  const colSpan = Math.max(1, Math.round(layoutItem.placement.colSpan || fallbackColSpan))
  const rowSpan = Math.max(1, Math.round(layoutItem.placement.rowSpan || fallbackRowSpan))
  return {
    mode: 'grid',
    gridColumnStart: colStart,
    gridColumnEnd: colStart + colSpan,
    gridRowStart: rowStart,
    gridRowEnd: rowStart + rowSpan,
    width:
      layoutItem.sizeModeX === 'fixed' && Number.isFinite(layoutItem.fixedWidth)
        ? layoutItem.fixedWidth
        : undefined,
    height:
      layoutItem.sizeModeY === 'fixed' && Number.isFinite(layoutItem.fixedHeight)
        ? layoutItem.fixedHeight
        : undefined,
  }
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
  if (!currentNode.value || !wrapperRef.value) return
  setNativeDragSuppressed(true)
  if (props.parentLayoutMode === 'grid') {
    handleGridSpanResize(handle, e)
    return
  }
}

const resolveGridGeometry = (): GridNodeGeometry | null => {
  if (!currentNode.value) return null
  const fallbackColSpan = isContainer.value ? 6 : 3
  const fallbackRowSpan = isContainer.value ? 4 : 2
  const fromLayoutItem = layoutItemToGeometry(
    currentNode.value.layoutItem,
    fallbackColSpan,
    fallbackRowSpan,
  )
  if (fromLayoutItem) {
    return fromLayoutItem
  }
  const style = currentNode.value.style || {}
  const defaultColSpan = parseGridSpan(style.gridColumn, fallbackColSpan)
  const defaultRowSpan = parseGridSpan(style.gridRow, fallbackRowSpan)
  return {
    mode: 'grid',
    gridColumnStart: 1,
    gridColumnEnd: 1 + defaultColSpan,
    gridRowStart: 1,
    gridRowEnd: 1 + defaultRowSpan,
  }
}

/**
 * Grid span resize handler.
 * Resize modifies current node placement/span instead of parent fr tracks.
 */
const handleGridSpanResize = (handle: FlowResizeHandle, e: MouseEvent) => {
  if (!currentNode.value || !wrapperRef.value) return

  selectComponent(props.nodeId)
  isResizing.value = true
  setHovered(null)

  const startX = e.clientX
  const startY = e.clientY
  const geo = resolveGridGeometry()
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
  const parentGridContainer =
    parentNode?.container?.mode === 'grid'
      ? (parentNode.container as GridContainerLayout)
      : undefined
  const colCount =
    parentGridContainer?.mode === 'grid'
      ? Array.isArray(parentGridContainer.columnTracks) &&
        parentGridContainer.columnTracks.length > 0
        ? parentGridContainer.columnTracks.length
        : Math.max(1, countTracks(parentGridContainer.columns || '1fr'))
      : 12
  const templateRowCount =
    parentGridContainer?.mode === 'grid'
      ? parentGridContainer.rowTracks === 'auto'
        ? Math.max(1, countTracks(parentGridContainer.rows || '1fr'))
        : Array.isArray(parentGridContainer.rowTracks) && parentGridContainer.rowTracks.length > 0
          ? parentGridContainer.rowTracks.length
          : Math.max(1, countTracks(parentGridContainer.rows || '1fr'))
      : Math.max(1, geo.gridRowEnd - 1)
  const baseMaxRow = Math.max(templateRowCount, geo.gridRowEnd - 1)
  const maxRowCount = Math.max(baseMaxRow + 24, 48)
  const baseColStart = clampNumber(geo.gridColumnStart, 1, Math.max(1, colCount))
  const baseRowStart = geo.gridRowStart
  const baseColSpan = clampNumber(
    Math.max(1, geo.gridColumnEnd - geo.gridColumnStart),
    1,
    Math.max(1, colCount - baseColStart + 1),
  )
  const baseRowSpan = Math.max(1, geo.gridRowEnd - geo.gridRowStart)

  const baseRect = wrapperRef.value.getBoundingClientRect()
  const parentEl = wrapperRef.value.parentElement as HTMLElement | null
  const parentRect = parentEl?.getBoundingClientRect() ?? baseRect
  const parentComputed = parentEl ? window.getComputedStyle(parentEl) : null
  const fallbackColTrackPx = Math.max(12, baseRect.width / baseColSpan)
  const fallbackRowTrackPx = Math.max(12, baseRect.height / baseRowSpan)
  const colGapPx = parseGridGapPx(
    parentComputed?.columnGap ?? parentGridContainer?.gapX ?? parentGridContainer?.gap ?? 8,
    8,
  )
  const rowGapPx = parseGridGapPx(
    parentComputed?.rowGap ?? parentGridContainer?.gapY ?? parentGridContainer?.gap ?? 8,
    8,
  )
  const colTracksPx = parentEl
    ? resolveRenderedGridTracks(parentEl, parentRect, 'column', colCount, fallbackColTrackPx)
    : Array(colCount).fill(Math.max(12, fallbackColTrackPx))
  const baseRowTrackCount = Math.max(templateRowCount, baseRowStart + baseRowSpan - 1)
  const rowTracksPx = parentEl
    ? resolveRenderedGridTracks(parentEl, parentRect, 'row', baseRowTrackCount, fallbackRowTrackPx)
    : Array(baseRowTrackCount).fill(Math.max(12, fallbackRowTrackPx))
  const gridStartX = parentRect.left
  const gridStartY = parentRect.top
  const colLines = buildLinePositions(gridStartX, colTracksPx, colGapPx)
  const rowLinesBase = buildLinePositions(gridStartY, rowTracksPx, rowGapPx)
  const rowTrackFallback = rowTracksPx[rowTracksPx.length - 1] ?? Math.max(12, fallbackRowTrackPx)
  const rowLines = extendLinePositions(rowLinesBase, rowGapPx, rowTrackFallback, maxRowCount + 1)
  const baseLeftPx = colLines[baseColStart - 1] ?? gridStartX
  const baseRightPx = colLines[baseColStart + baseColSpan - 1] ?? baseLeftPx
  const baseTopPx = rowLines[baseRowStart - 1] ?? gridStartY
  const baseBottomPx = rowLines[baseRowStart + baseRowSpan - 1] ?? baseTopPx

  let rafId = 0
  let cancelled = false
  let pendingGeometry: GridNodeGeometry | null = null

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
    const dx = ev.clientX - startX
    const dy = ev.clientY - startY

    let nextColStart = baseColStart
    let nextRowStart = baseRowStart
    let nextColSpan = baseColSpan
    let nextRowSpan = baseRowSpan

    if (handle === 'e' || handle === 'ne' || handle === 'se') {
      const nextColEnd = snapClientToLine(
        baseRightPx + dx,
        colLines,
        baseColStart + 1,
        colCount + 1,
      )
      nextColSpan = clampNumber(nextColEnd - baseColStart, 1, colCount - baseColStart + 1)
    }
    if (handle === 'w' || handle === 'nw' || handle === 'sw') {
      const baseColEnd = baseColStart + baseColSpan
      nextColStart = snapClientToLine(baseLeftPx + dx, colLines, 1, baseColEnd - 1)
      nextColSpan = clampNumber(baseColEnd - nextColStart, 1, colCount - nextColStart + 1)
    }
    if (handle === 's' || handle === 'se' || handle === 'sw') {
      const nextRowEnd = snapClientToLine(
        baseBottomPx + dy,
        rowLines,
        baseRowStart + 1,
        maxRowCount + 1,
      )
      nextRowSpan = clampNumber(nextRowEnd - baseRowStart, 1, maxRowCount - baseRowStart + 1)
    }
    if (handle === 'n' || handle === 'nw' || handle === 'ne') {
      const baseRowEnd = baseRowStart + baseRowSpan
      nextRowStart = snapClientToLine(baseTopPx + dy, rowLines, 1, baseRowEnd - 1)
      nextRowSpan = clampNumber(baseRowEnd - nextRowStart, 1, maxRowCount - nextRowStart + 1)
    }

    pendingGeometry = {
      mode: 'grid',
      gridColumnStart: nextColStart,
      gridColumnEnd: nextColStart + nextColSpan,
      gridRowStart: nextRowStart,
      gridRowEnd: nextRowStart + nextRowSpan,
    }

    if (rafId === 0) {
      rafId = requestAnimationFrame(() => {
        rafId = 0
        if (cancelled || !pendingGeometry) return
        componentStore.updateGeometry(props.nodeId, pendingGeometry)
      })
    }
  }

  const cleanup = () => {
    if (rafId !== 0) cancelAnimationFrame(rafId)
    if (cancelled) {
      componentStore.updateGeometry(props.nodeId, {
        mode: 'grid',
        gridColumnStart: baseColStart,
        gridColumnEnd: baseColStart + baseColSpan,
        gridRowStart: baseRowStart,
        gridRowEnd: baseRowStart + baseRowSpan,
      })
    }
    document.body.style.cursor = prevCursor
    document.body.style.userSelect = prevUserSelect
    isResizing.value = false
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
    window.removeEventListener('keydown', onKeyDown)
    setNativeDragSuppressed(false)
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
  if (!shouldAllowSpacingAdjust.value) return
  if (!currentNode.value) return

  setNativeDragSuppressed(true)
  stopSpacingAdjustIfNeeded()
  selectComponent(props.nodeId)
  isSpacingAdjusting.value = true
  activeSpacingKind.value = 'margin'
  activeSpacingSide.value = side
  setHovered(null)

  const startX = e.clientX
  const startY = e.clientY
  const baseMargin = marginPx.value[side]
  const styleKey = marginStyleKeyMap[side]
  const originalMargin = currentNode.value.style?.margin
  const originalSideValue = currentNode.value.style?.[styleKey]

  let rafId = 0
  let pendingMargin: number | undefined
  let cancelled = false

  const flushMarginUpdate = () => {
    rafId = 0
    if (cancelled || pendingMargin === undefined) return

    const patch = { [styleKey]: Math.round(pendingMargin) } as Partial<NodeStyle>
    patch.margin = undefined
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
    if (side === 'top') next = baseMargin + dy
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
      const restorePatch = {
        [styleKey]: originalSideValue,
        margin: originalMargin,
      } as Partial<NodeStyle>
      updateStyle(props.nodeId, restorePatch)
    }

    document.body.style.cursor = prevCursor
    document.body.style.userSelect = prevUserSelect
    resetSpacingAdjustState()
    if (cleanupActiveSpacingAdjust === cleanup) {
      cleanupActiveSpacingAdjust = null
    }
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
    window.removeEventListener('keydown', onKeyDown)
    setNativeDragSuppressed(false)
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
  cleanupActiveSpacingAdjust = cleanup
}

/** Padding range: 0 to 500px */
const PADDING_RANGE = { min: 0, max: 500 }

const handlePaddingDragStart = (side: FlowSpacingSide, e: MouseEvent) => {
  if (!shouldAllowSpacingAdjust.value) return
  if (!currentNode.value) return

  setNativeDragSuppressed(true)
  stopSpacingAdjustIfNeeded()
  selectComponent(props.nodeId)
  isSpacingAdjusting.value = true
  activeSpacingKind.value = 'padding'
  activeSpacingSide.value = side
  setHovered(null)

  const startX = e.clientX
  const startY = e.clientY
  const baseVal = paddingPx.value[side]
  const styleKey = paddingStyleKeyMap[side]
  const originalPadding = currentNode.value.style?.padding
  const originalSideValue = currentNode.value.style?.[styleKey]

  let rafId = 0
  let pendingVal: number | undefined
  let cancelled = false

  const flushUpdate = () => {
    rafId = 0
    if (cancelled || pendingVal === undefined) return
    const patch = { [styleKey]: Math.round(pendingVal) } as Partial<NodeStyle>
    patch.padding = undefined
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
      const restorePatch = {
        [styleKey]: originalSideValue,
        padding: originalPadding,
      } as Partial<NodeStyle>
      updateStyle(props.nodeId, restorePatch)
    }

    document.body.style.cursor = prevCursor
    document.body.style.userSelect = prevUserSelect
    resetSpacingAdjustState()
    if (cleanupActiveSpacingAdjust === cleanup) {
      cleanupActiveSpacingAdjust = null
    }
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
    window.removeEventListener('keydown', onKeyDown)
    setNativeDragSuppressed(false)
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
  cleanupActiveSpacingAdjust = cleanup
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

  const nextId = selectByHitPath(props.nodeId)
  emit('select', nextId)
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

/* Strict content bbox selection outline for non-container grid items */
.content-selection-outline {
  position: absolute;
  box-sizing: border-box;
  border: 2px solid #0d99ff;
  box-shadow:
    0 0 0 1px rgba(13, 153, 255, 0.3),
    inset 0 0 0 1px rgba(13, 153, 255, 0.1);
  pointer-events: none;
  z-index: 2;
  transition: box-shadow 0.12s ease;
}

.editor-node-wrapper:hover .content-selection-outline {
  box-shadow:
    0 0 0 2px rgba(13, 153, 255, 0.2),
    inset 0 0 0 1px rgba(13, 153, 255, 0.1);
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

/* Empty container hint is only shown when selected (or drag-over),
   to avoid polluting normal canvas display. */
.editor-node-wrapper.is-empty.is-selected:not(.is-drag-over)::before {
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
/* Only show container indicator when selected or hovered, not always */
.editor-node-wrapper.is-container:not(.is-empty).is-selected,
.editor-node-wrapper.is-container:not(.is-empty).is-hovered {
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
  top: -10px;
  left: 50%;
  width: 20px;
  height: 8px;
  transform: translateX(-50%);
  cursor: ns-resize;
}

.flow-resize-handle.handle-s {
  bottom: -10px;
  left: 50%;
  width: 20px;
  height: 8px;
  transform: translateX(-50%);
  cursor: ns-resize;
}

/* Edge handles - vertical bars */
.flow-resize-handle.handle-e {
  top: 50%;
  right: -10px;
  width: 8px;
  height: 20px;
  transform: translateY(-50%);
  cursor: ew-resize;
}

.flow-resize-handle.handle-w {
  top: 50%;
  left: -10px;
  width: 8px;
  height: 20px;
  transform: translateY(-50%);
  cursor: ew-resize;
}

/* Corner handles */
.flow-resize-handle.handle-nw {
  top: -11px;
  left: -11px;
  width: 10px;
  height: 10px;
  cursor: nwse-resize;
}

.flow-resize-handle.handle-ne {
  top: -11px;
  right: -11px;
  width: 10px;
  height: 10px;
  cursor: nesw-resize;
}

.flow-resize-handle.handle-se {
  right: -11px;
  bottom: -11px;
  width: 10px;
  height: 10px;
  cursor: nwse-resize;
}

.flow-resize-handle.handle-sw {
  bottom: -11px;
  left: -11px;
  width: 10px;
  height: 10px;
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
  touch-action: none;
}

.overlay-label {
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  line-height: 1;
  padding: 3px 7px;
  border-radius: 3px;
  opacity: 1;
  letter-spacing: 0.1px;
  pointer-events: none;
}

/* Margin overlays - orange, extend OUTSIDE the wrapper using negative coordinates */
.margin-overlay {
  background: rgba(251, 146, 60, 0.42);
  border: 2px solid rgba(234, 88, 12, 0.72);
  transition:
    background 0.1s,
    box-shadow 0.1s;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.45);
}

.margin-overlay:hover {
  background: rgba(251, 146, 60, 0.56);
  box-shadow: 0 0 0 2px rgba(251, 146, 60, 0.32);
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
  background: rgba(52, 211, 153, 0.34);
  border: 2px solid rgba(16, 185, 129, 0.7);
  transition:
    background 0.1s,
    box-shadow 0.1s;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.4);
}

.padding-overlay:hover {
  background: rgba(52, 211, 153, 0.48);
  box-shadow: 0 0 0 2px rgba(52, 211, 153, 0.28);
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
</style>
