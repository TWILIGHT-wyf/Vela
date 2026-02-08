<template>
  <div
    ref="wrapperRef"
    :class="wrapperClasses"
    :style="wrapperStyle"
    :data-label="componentLabel"
    :data-node-id="nodeId"
    :draggable="!isFreeParent"
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
  </div>
</template>

<script setup lang="ts">
import { computed, ref, inject, type CSSProperties } from 'vue'
import { storeToRefs } from 'pinia'
import { useComponent } from '@/stores/component'
import type { NodeSchema } from '@vela/core'
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
const { selectedId, hoveredId, rootNode } = storeToRefs(componentStore)
const { selectComponent, findNodeById, setHovered } = componentStore

// ========== Refs ==========
const wrapperRef = ref<HTMLDivElement | null>(null)
const isDragging = ref(false)
const isDragOver = ref(false)
const isFreeParent = computed(() => props.parentLayoutMode === 'free')

// ========== Computed ==========
const isSelected = computed(() => selectedId.value === props.nodeId)
const isHovered = computed(() => hoveredId.value === props.nodeId)

const currentNode = computed(() => {
  if (props.node) return props.node
  if (!rootNode.value) return null
  return findNodeById(rootNode.value, props.nodeId)
})

const componentLabel = computed(() => {
  return props.componentName || currentNode.value?.component || ''
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

const wrapperStyle = computed<CSSProperties>(() => {
  const node = currentNode.value
  if (!node) {
    return isContainer.value ? { width: '100%' } : {}
  }

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

  // Flow mode: only width and minHeight matter
  const style = node.style || {}
  return {
    width: style.width || (isContainer.value ? '100%' : 'auto'),
    minHeight: style.minHeight || style.height || 'auto',
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

// ========== Event Handlers ==========
const handleClick = () => {
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
</style>
