import { ref, computed } from 'vue'
import type { NodeSchema } from '@vela/core'
import type { ComponentIndexContext } from './useComponentIndex'

/**
 * 组件选中状态管理
 */
export function useComponentSelection(indexCtx: ComponentIndexContext) {
  const { nodeIndex } = indexCtx

  /**
   * 当前选中的组件 ID（单选或多选的第一个）
   */
  const selectedId = ref<string | null>(null)

  /**
   * 多选的组件 ID 数组
   */
  const selectedIds = ref<string[]>([])

  /**
   * Hover 的组件 ID
   */
  const hoveredId = ref<string | null>(null)

  /**
   * 获取当前选中的组件节点
   */
  const selectedNode = computed<NodeSchema | null>(() => {
    if (!selectedId.value) return null
    return nodeIndex.get(selectedId.value) || null
  })

  /**
   * 获取所有选中的组件节点
   */
  const selectedNodes = computed<NodeSchema[]>(() => {
    if (selectedIds.value.length === 0) return []
    return selectedIds.value
      .map((id) => nodeIndex.get(id))
      .filter((node): node is NodeSchema => node !== undefined)
  })

  /**
   * 获取 hover 的组件节点
   */
  const hoveredNode = computed<NodeSchema | null>(() => {
    if (!hoveredId.value) return null
    return nodeIndex.get(hoveredId.value) || null
  })

  /**
   * 选中组件
   */
  function selectComponent(id: string | null) {
    selectedId.value = id
    selectedIds.value = id ? [id] : []
  }

  /**
   * 多选组件
   */
  function selectComponents(ids: string[]) {
    selectedIds.value = ids
    selectedId.value = ids.length > 0 ? ids[0] : null
  }

  /**
   * 切换组件的选中状态（用于 Ctrl+Click）
   */
  function toggleSelection(id: string) {
    const index = selectedIds.value.indexOf(id)
    if (index !== -1) {
      selectedIds.value.splice(index, 1)
    } else {
      selectedIds.value.push(id)
    }

    selectedId.value = selectedIds.value.length > 0 ? selectedIds.value[0] : null
  }

  /**
   * 设置 hover 组件
   */
  function setHovered(id: string | null) {
    hoveredId.value = id
  }

  /**
   * 清空选中
   */
  function clearSelection() {
    selectedId.value = null
    selectedIds.value = []
  }

  /**
   * 清除已删除节点的选中状态
   */
  function clearDeletedSelection(deletedId: string) {
    if (selectedId.value === deletedId) {
      selectedId.value = null
    }
    selectedIds.value = selectedIds.value.filter((sid) => sid !== deletedId)
  }

  /**
   * Check if a specific component is selected
   */
  function isSelected(id: string): boolean {
    return selectedIds.value.includes(id)
  }

  return {
    // State
    selectedId,
    selectedIds,
    hoveredId,

    // Getters
    selectedNode,
    selectedNodes,
    hoveredNode,

    // Actions
    selectComponent,
    selectComponents,
    toggleSelection,
    setHovered,
    clearSelection,
    clearDeletedSelection,
    isSelected,
  }
}

export type ComponentSelectionContext = ReturnType<typeof useComponentSelection>
