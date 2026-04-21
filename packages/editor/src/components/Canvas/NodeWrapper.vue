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
    :draggable="!isResizing && !suppressNativeDrag"
    @click.stop="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <div v-if="!isSimulationMode" class="interaction-blocker" />

    <!-- Component content slot -->
    <slot></slot>

    <!-- Strict selection outline that follows rendered content bbox (grid non-container nodes) -->
    <div
      v-if="contentSelectionOutlineStyle"
      class="content-selection-outline"
      :style="contentSelectionOutlineStyle"
    />

    <NodeResizeHandles v-if="showGridResizeHandles" @start="handleGridResizeStart" />

  </div>
</template>

<script setup lang="ts">
import { computed, ref, inject, watch, onBeforeUnmount, type CSSProperties } from 'vue'
import { storeToRefs } from 'pinia'
import { useComponent } from '@/stores/component'
import { useUIStore } from '@/stores/ui'
import { useCanvasContext } from '@/components/Canvas/composables/useCanvasContext'
import NodeResizeHandles, { type GridResizeHandle } from './NodeResizeHandles.vue'
import {
  countTracks,
  type GridContainerLayout,
  type GridItemLayout,
  type GridNodeGeometry,
  type NodeSchema,
} from '@vela/core'
import type { UseCanvasDropReturn } from './composables/useCanvasDrop'

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

// ========== Inject Canvas Drop Logic ==========
const canvasDrop = inject<UseCanvasDropReturn>('canvasDrop')

// ========== Canvas Context (for scale compensation) ==========
const { scale: canvasScale } = useCanvasContext()

// ========== Store ==========
const componentStore = useComponent()
const uiStore = useUIStore()
const { selectedId, selectedIds, hoveredId, rootNode } = storeToRefs(componentStore)
const { isSimulationMode } = storeToRefs(uiStore)
const {
  selectComponent,
  selectByHitPath,
  toggleSelection,
  findNodeById,
  setHovered,
  updateGeometry,
  previewGeometry,
  clearInteractionDraft,
  getResolvedStyle,
  getResolvedGeometry,
} = componentStore

// ========== Refs ==========
const wrapperRef = ref<HTMLDivElement | null>(null)
const isDragging = ref(false)
const isDragOver = ref(false)
const isResizing = ref(false)
const suppressNativeDrag = ref(false)
let cleanupActiveResize: (() => void) | null = null

const applyWrapperDraggableState = () => {
  const wrapper = wrapperRef.value
  if (!wrapper) return
  wrapper.draggable = !isResizing.value && !suppressNativeDrag.value
}

const setNativeDragSuppressed = (value: boolean) => {
  suppressNativeDrag.value = value
  applyWrapperDraggableState()
}

// ========== Computed ==========
const isSelected = computed(() => selectedIds.value.includes(props.nodeId))
const isHovered = computed(() => hoveredId.value === props.nodeId)
const showGridResizeHandles = computed(() => selectedId.value === props.nodeId)

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

const resolvedStyle = computed(() => getResolvedStyle(props.nodeId, currentNode.value?.style))
const resolvedGeometry = computed(() =>
  getResolvedGeometry(props.nodeId, currentNode.value?.geometry),
)

const isDragFeedbackActive = computed(() => {
  const dragging = Boolean(canvasDrop?.draggingId.value)
  const indicatorVisible = Boolean(canvasDrop?.indicator.value?.visible)
  return dragging || indicatorVisible || isDragOver.value
})
type ContentSelectionRect = { left: number; top: number; width: number; height: number }

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
  if (isContainer.value || isEmpty.value) return false
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

const stopResizeIfNeeded = () => {
  if (!cleanupActiveResize) return
  cleanupActiveResize()
  cleanupActiveResize = null
}

watch(
  () => selectedId.value,
  (nextSelectedId) => {
    if (nextSelectedId !== props.nodeId && isResizing.value) {
      stopResizeIfNeeded()
    }
  },
)

onBeforeUnmount(() => {
  stopResizeIfNeeded()
  setNativeDragSuppressed(false)
})

/** 閸掋倖鏌囬弰顖氭儊娑撳搫顔愰崳銊х矋娴?*/
const isContainer = computed(() => {
  return canvasDrop?.isContainerNode(currentNode.value as NodeSchema) || false
})

/** 閸掋倖鏌囬弰顖氭儊娑撹櫣鈹栫€圭懓娅?*/
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
    const geometry =
      resolvedGeometry.value ||
      layoutItemToGeometry(node.layoutItem, fallbackColSpan, fallbackRowSpan)
    const style = resolvedStyle.value
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
  // 闂冪粯顒涙禍瀣╂閸愭帗鍦洪敍宀€鈥樻穱婵嗗涧閺堝娓堕崘鍛湴缂佸嫪娆㈢憴锕€褰傞幃顒€浠?
  e.stopPropagation()
  const dragging = isDragging.value
  if (!dragging) {
    setHovered(props.nodeId)
  }
}

const handleMouseLeave = (e: MouseEvent) => {
  const relatedTarget = e.relatedTarget as HTMLElement | null
  const currentTarget = e.currentTarget as HTMLElement

  // 婵″倹鐏夌粔璇插З閸掓澘鐡欓崗鍐閿涘奔绗夊〒鍛存珟 hover
  if (relatedTarget && currentTarget.contains(relatedTarget)) {
    return
  }

  // 閸欘亝婀佽ぐ鎾冲 hover 閻ㄥ嫭妲搁懛顏勭箒閺冭埖澧犲〒鍛存珟
  if (hoveredId.value === props.nodeId) {
    setHovered(null)
  }
}

// ========== Drag & Drop Handlers ==========
let dragCancelled = false

const handleDragStart = (e: DragEvent) => {
  if (suppressNativeDrag.value) {
    e.preventDefault()
    return
  }
  if (!e.dataTransfer || !currentNode.value) return

  if (selectedIds.value.length !== 1 || selectedId.value !== props.nodeId) {
    selectComponent(props.nodeId)
    emit('select', props.nodeId)
  }

  isDragging.value = true
  dragCancelled = false
  setHovered(null) // 閹锋牗瀚块弮鑸电闂?hover 閻樿埖鈧?
  // 鐠佸墽鐤嗛幏鏍ㄥ閺佺増宓?
  const dragData = {
    nodeId: props.nodeId,
    component: currentNode.value.component,
  }
  e.dataTransfer.setData('application/x-vela', JSON.stringify(dragData))
  e.dataTransfer.effectAllowed = 'move'

  canvasDrop?.setDraggingId(props.nodeId)

  // 鐠佸墽鐤嗛幏鏍ㄥ閸ユ儳鍎?
  if (wrapperRef.value) {
    e.dataTransfer.setDragImage(wrapperRef.value, 10, 10)
  }

  const onKeyDown = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') {
      dragCancelled = true
      canvasDrop?.hideIndicator()
      window.removeEventListener('keydown', onKeyDown)
    }
  }
  window.addEventListener('keydown', onKeyDown)

  // 閹锋牗瀚跨紒鎾存将閺冭埖绔婚悶鍡欐磧閸氼剙娅?
  const cleanup = () => {
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('dragend', cleanup)
  }
  window.addEventListener('dragend', cleanup)
}

const handleDragEnd = () => {
  isDragging.value = false
  isDragOver.value = false
  dragCancelled = false
  setNativeDragSuppressed(false)
  canvasDrop?.setDraggingId(null)
  canvasDrop?.hideIndicator()
}

const handleDragOver = (e: DragEvent) => {
  if (!canvasDrop || !currentNode.value || !wrapperRef.value) return
  isDragOver.value = true
  canvasDrop.handleDragOver(e, currentNode.value, wrapperRef.value)
}

const handleDragLeave = (e: DragEvent) => {
  const relatedTarget = e.relatedTarget as HTMLElement | null
  const currentTarget = e.currentTarget as HTMLElement
  if (relatedTarget && currentTarget.contains(relatedTarget)) {
    return
  }
  isDragOver.value = false
  canvasDrop?.handleDragLeave(e)
}

const handleDrop = (e: DragEvent) => {
  isDragOver.value = false
  if (!canvasDrop || !currentNode.value) return
  if (dragCancelled) {
    dragCancelled = false
    return
  }
  canvasDrop.handleDrop(e)
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

const handleGridResizeStart = (handle: GridResizeHandle, e: MouseEvent) => {
  if (!currentNode.value || !wrapperRef.value) return
  setNativeDragSuppressed(true)
  handleGridSpanResize(handle, e)
}

const resolveGridGeometry = (): GridNodeGeometry | null => {
  if (!currentNode.value) return null
  if (resolvedGeometry.value?.mode === 'grid') {
    return resolvedGeometry.value
  }
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
  const style = resolvedStyle.value
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
const handleGridSpanResize = (handle: GridResizeHandle, e: MouseEvent) => {
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

  const cursorMap: Record<GridResizeHandle, string> = {
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
        previewGeometry(props.nodeId, pendingGeometry)
      })
    }
  }

  const cleanup = () => {
    if (rafId !== 0) cancelAnimationFrame(rafId)
    if (cancelled) {
      clearInteractionDraft(props.nodeId, 'geometry')
    } else if (pendingGeometry) {
      updateGeometry(props.nodeId, pendingGeometry)
      clearInteractionDraft(props.nodeId, 'geometry')
    }
    document.body.style.cursor = prevCursor
    document.body.style.userSelect = prevUserSelect
    isResizing.value = false
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
    window.removeEventListener('keydown', onKeyDown)
    setNativeDragSuppressed(false)
    if (cleanupActiveResize === cancelResize) {
      cleanupActiveResize = null
    }
  }

  const cancelResize = () => {
    cancelled = true
    cleanup()
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
  cleanupActiveResize = cancelResize
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
  max-width: 100%; /* 閺嶇绺炬穱顔碱槻閿涙岸妲诲銏℃嫼閻鏁剧敮?*/
  min-width: 20px; /* 闂冨弶顒涙潻鍥х毈閺冪姵纭堕柅澶夎厬 */
  /* 缁夊娅?overflow: hidden閿涘矂浼╅崗宥堫梿閸擃亜娴樼悰銊х搼缂佸嫪娆㈤惃鍕垼妫版ǜ鈧浇閰遍崥宥囆炵粵澶婂敶鐎?*/
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

/* ========== Empty Container State (閺嬩胶鐣濈拋鎹愵吀) ========== */
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
  content: '閹锋牕鍙嗙紒鍕';
  font-size: 12px;
  color: #c0c4cc;
  pointer-events: none;
}

/* Empty + Hover (閺冪姵瀚嬮幏?: 鏉炶浜曟妯瑰瘨閿涘奔绲炬稉宥嗘暭閸欐ɑ鏋冪€?*/
.editor-node-wrapper.is-empty.is-hovered:not(.is-selected):not(.is-drag-over) {
  background-color: #f5f7fa;
  box-shadow: inset 0 0 0 1px rgba(64, 158, 255, 0.2);
}

/* Empty + Drag Over: 閺勫孩妯夋妯瑰瘨 + 閹绘劗銇氶柌濠冩杹 */
.editor-node-wrapper.is-empty.is-drag-over:not(.is-selected) {
  background-color: #ecf5ff;
  box-shadow: inset 0 0 0 2px rgba(64, 158, 255, 0.5);
}

.editor-node-wrapper.is-empty.is-drag-over:not(.is-selected)::before {
  content: '闁插﹥鏂佹禒銉﹀潑閸旂姴鍩?' attr(data-label);
  color: #409eff;
  font-weight: 500;
}

/* Empty + Selected: 娣囨繃瀵旈柅澶夎厬濡楀棴绱濋梾鎰閹绘劗銇氶弬鍥х摟 */
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
</style>
