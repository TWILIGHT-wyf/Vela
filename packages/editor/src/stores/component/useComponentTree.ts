import { ref } from 'vue'
import {
  buildFrTemplate,
  countTracks,
  parseFrTemplate,
  type GridContainerLayout,
  type GridNodeGeometry,
  type NodeSchema,
} from '@vela/core'
import { cloneDeep } from 'lodash-es'
import type { ComponentIndexContext } from './useComponentIndex'
import type { ComponentSelectionContext } from './useComponentSelection'

/**
 * 组件树管理
 */
export function useComponentTree(
  indexCtx: ComponentIndexContext,
  selectionCtx: ComponentSelectionContext,
  syncToProjectStore: () => void,
) {
  const { nodeIndex, parentIndex, traverse, rebuildIndex, indexNode, unindexNode } = indexCtx
  const { clearDeletedSelection, clearSelection } = selectionCtx

  /**
   * 当前页面的组件树根节点
   */
  const rootNode = ref<NodeSchema | null>(null)

  function clampInt(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, Math.round(value)))
  }

  function normalizeGridContainer(parent: NodeSchema | null | undefined) {
    if (!parent || parent.container?.mode !== 'grid') return

    const container = parent.container as GridContainerLayout
    const children = parent.children || []
    const normalizedColumns =
      typeof container.columns === 'string' && container.columns.trim().length > 0
        ? container.columns
        : '1fr'
    const colCount = Math.max(1, countTracks(normalizedColumns))

    container.columns = normalizedColumns

    const targetRowCount = Math.max(children.length, 1)
    const rowValues = parseFrTemplate(container.rows || '1fr')

    while (rowValues.length < targetRowCount) {
      rowValues.push(1)
    }
    while (rowValues.length > targetRowCount) {
      rowValues.pop()
    }

    container.rows = buildFrTemplate(rowValues)

    children.forEach((child, index) => {
      const existingGeometry =
        child.geometry?.mode === 'grid' ? (child.geometry as GridNodeGeometry) : undefined

      const colStart = clampInt(existingGeometry?.gridColumnStart ?? 1, 1, colCount)
      const colEnd = clampInt(
        existingGeometry?.gridColumnEnd ?? colCount + 1,
        colStart + 1,
        colCount + 1,
      )

      child.geometry = {
        ...(existingGeometry || {}),
        mode: 'grid',
        gridColumnStart: colStart,
        gridColumnEnd: colEnd,
        gridRowStart: index + 1,
        gridRowEnd: index + 2,
      }
    })
  }

  /**
   * 扁平化树为数组
   */
  function flattenTree(node: NodeSchema): NodeSchema[] {
    const result: NodeSchema[] = []
    traverse(node, (n) => result.push(n))
    return result
  }

  /**
   * 加载页面组件树
   */
  function loadTree(tree: NodeSchema) {
    rootNode.value = cloneDeep(tree)
    rebuildIndex(rootNode.value)
    clearSelection()
  }

  /**
   * 设置组件树（不深拷贝，用于撤销/重做）
   */
  function setTree(tree: NodeSchema) {
    rootNode.value = tree
    rebuildIndex(rootNode.value)
  }

  /**
   * [Raw] 添加组件 - 不记录历史
   */
  function addComponentRaw(parentId: string | null, component: NodeSchema, index?: number): string {
    if (!rootNode.value) {
      console.error('[ComponentTree] Root node is null')
      return ''
    }

    const newComponent = cloneDeep(component)

    if (!parentId) {
      if (!rootNode.value.children) {
        rootNode.value.children = []
      }

      if (index !== undefined) {
        rootNode.value.children.splice(index, 0, newComponent)
      } else {
        rootNode.value.children.push(newComponent)
      }

      normalizeGridContainer(rootNode.value)
      indexNode(newComponent, rootNode.value.id)
      syncToProjectStore()
      return newComponent.id
    }

    const parentNode = nodeIndex.get(parentId)
    if (!parentNode) {
      console.error('[ComponentTree] Parent node not found:', parentId)
      return ''
    }

    if (!parentNode.children) {
      parentNode.children = []
    }

    if (index !== undefined) {
      parentNode.children.splice(index, 0, newComponent)
    } else {
      parentNode.children.push(newComponent)
    }

    normalizeGridContainer(parentNode)
    indexNode(newComponent, parentId)
    syncToProjectStore()
    return newComponent.id
  }

  /**
   * [Raw] 删除组件 - 不记录历史
   */
  function deleteComponentRaw(id: string): void {
    if (!rootNode.value) return

    if (id === rootNode.value.id) {
      return
    }

    const pId = parentIndex.get(id)
    if (!pId) return

    const parent = nodeIndex.get(pId)
    if (!parent?.children) return

    const idx = parent.children.findIndex((child) => child.id === id)
    if (idx !== -1) {
      unindexNode(id)
      parent.children.splice(idx, 1)
      normalizeGridContainer(parent)
      clearDeletedSelection(id)
      syncToProjectStore()
    }
  }

  /**
   * [Raw] 移动组件 - 不记录历史
   */
  function moveComponentRaw(id: string, newParentId: string, newIndex: number): void {
    if (!rootNode.value) return

    if (id === rootNode.value.id) return

    const node = nodeIndex.get(id)
    const oldParentId = parentIndex.get(id)

    if (!node || !oldParentId) return

    const oldParent = nodeIndex.get(oldParentId)
    if (!oldParent?.children) return

    const oldIndex = oldParent.children.findIndex((child) => child.id === id)
    if (oldIndex === -1) return

    oldParent.children.splice(oldIndex, 1)
    normalizeGridContainer(oldParent)

    const newParent = nodeIndex.get(newParentId)
    if (!newParent) {
      oldParent.children.splice(oldIndex, 0, node)
      normalizeGridContainer(oldParent)
      return
    }

    if (!newParent.children) {
      newParent.children = []
    }

    newParent.children.splice(newIndex, 0, node)
    parentIndex.set(id, newParentId)
    normalizeGridContainer(newParent)

    syncToProjectStore()
  }

  return {
    // State
    rootNode,

    // Actions
    loadTree,
    setTree,
    flattenTree,

    // Raw Actions
    addComponentRaw,
    deleteComponentRaw,
    moveComponentRaw,
  }
}

export type ComponentTreeContext = ReturnType<typeof useComponentTree>
