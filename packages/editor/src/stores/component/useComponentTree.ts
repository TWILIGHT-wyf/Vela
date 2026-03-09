import { ref } from 'vue'
import {
  normalizeGridContainerFields,
  syncRowsTemplate,
  type GridContainerLayout,
  type NodeSchema,
} from '@vela/core'
import { getComponentDefinition, resolveComponentAlias } from '@vela/core/contracts'
import { cloneDeep } from 'lodash-es'
import {
  maxOccupiedRow,
  nodeToPlacement,
  resolveGridPlacements,
  writePlacementToNode,
} from '@/utils/gridPlacement'
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

  function normalizeGridContainer(parent: NodeSchema | null | undefined) {
    if (!parent || parent.container?.mode !== 'grid') return

    const container = parent.container as GridContainerLayout
    const children = parent.children || []

    // ── 使用共享纯函数规范化容器字段 ──
    const { templateMode, colCount } = normalizeGridContainerFields(container)

    // ── 容器型节点判断 ──
    const isContainerNode = (node: NodeSchema): boolean => {
      if (
        node.container?.mode === 'grid' ||
        node.container?.mode === 'free' ||
        node.container?.mode === 'flow'
      ) {
        return true
      }
      const componentName = node.component || node.componentName
      if (!componentName) return Array.isArray(node.children)
      const definition = getComponentDefinition(resolveComponentAlias(componentName))
      if (definition?.isContainer) return true
      return Array.isArray(node.children)
    }

    // ── Legacy sizing 清理 ──
    const isPercentage100 = (value: unknown): boolean =>
      typeof value === 'string' && value.trim() === '100%'

    const sanitizeLegacyGridItemSizing = (node: NodeSchema): void => {
      if (!node.style || isContainerNode(node)) return
      const width100 = isPercentage100(node.style.width)
      const height100 = isPercentage100(node.style.height)
      const minHeight100 = isPercentage100(node.style.minHeight)
      if (!width100 || (!height100 && !minHeight100)) return
      delete node.style.width
      if (height100) delete node.style.height
      if (minHeight100) delete node.style.minHeight
    }

    // ── 解析放置 ──
    const placementMap = resolveGridPlacements(
      children.map((child, index) => {
        sanitizeLegacyGridItemSizing(child)
        const hasExplicitPlacement =
          child.layoutItem?.mode === 'grid' || child.geometry?.mode === 'grid'
        return {
          id: child.id,
          explicit: hasExplicitPlacement,
          placement: hasExplicitPlacement
            ? nodeToPlacement(child, colCount)
            : {
                colStart: 1,
                colSpan: isContainerNode(child)
                  ? templateMode === 'autoFit'
                    ? 1
                    : Math.min(6, colCount)
                  : 3,
                rowStart: index + 1,
                rowSpan: isContainerNode(child) ? 2 : 2,
              },
        }
      }),
      colCount,
    )

    // ── 写入放置结果 ──
    children.forEach((child) => {
      sanitizeLegacyGridItemSizing(child)
      const placement = placementMap.get(child.id)
      if (!placement) return
      writePlacementToNode(child, placement)
    })

    // ── 使用共享函数同步行模板 ──
    syncRowsTemplate(container, maxOccupiedRow(placementMap.values()))
  }

  function normalizeGridHierarchy(node: NodeSchema | null | undefined) {
    if (!node) return
    if (node.container?.mode === 'grid') {
      normalizeGridContainer(node)
    }
    if (node.children && node.children.length > 0) {
      node.children.forEach((child) => normalizeGridHierarchy(child))
    }
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
    normalizeGridHierarchy(rootNode.value)
    rebuildIndex(rootNode.value)
    clearSelection()
  }

  /**
   * 设置组件树（不深拷贝，用于撤销/重做）
   */
  function setTree(tree: NodeSchema) {
    normalizeGridHierarchy(tree)
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
