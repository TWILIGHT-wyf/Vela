import { defineStore } from 'pinia'
import { computed, watch } from 'vue'
import type { NodeGeometry, NodeSchema, NodeStyle } from '@vela/core'
import { ElMessage } from 'element-plus'
import { cloneDeep } from 'lodash-es'
import { useProjectStore } from '../project'
import { useHistoryStore } from '../history'
import {
  setStoreAccessor,
  AddComponentCommand,
  BatchCommand,
  DeleteComponentCommand,
  MoveComponentCommand,
  UpdateStyleCommand,
  UpdateGeometryCommand,
  UpdatePropsCommand,
  UpdateDataSourceCommand,
  UpdateEventsCommand,
  UpdateChildLayoutCommand,
  UpdateGridTemplateCommand,
} from '../commands/index'

import { useComponentIndex } from './useComponentIndex'
import { useComponentSelection } from './useComponentSelection'
import { useComponentStyle } from './useComponentStyle'
import { useComponentTree } from './useComponentTree'
import { useComponentClipboard } from './useComponentClipboard'

/**
 * 组件管理 Store
 * 管理 NodeSchema 的递归树结构和组件操作
 *
 * 架构设计：
 * - useComponentIndex: O(1) 索引管理
 * - useComponentSelection: 选中状态管理
 * - useComponentStyle: 样式和属性管理
 * - useComponentTree: 树结构管理
 * - useComponentClipboard: 剪贴板操作
 */
export const useComponent = defineStore('component', () => {
  const projectStore = useProjectStore()

  // ========== 同步函数 ==========

  /**
   * 同步到 ProjectStore 的当前页面
   */
  function syncToProjectStore() {
    const currentPage = projectStore.currentPage
    if (currentPage && treeCtx.rootNode.value) {
      currentPage.children = cloneDeep(treeCtx.rootNode.value)
      const rootMode = treeCtx.rootNode.value.container?.mode
      if (rootMode === 'free' || rootMode === 'flow' || rootMode === 'grid') {
        // @deprecated flow 模式已弃用，统一映射为 grid 模式。
        // 存量 flow 数据在加载时自动升级为 grid。
        const normalizedMode = rootMode === 'free' ? 'free' : 'grid'
        if (!currentPage.config) {
          currentPage.config = {}
        }
        if (currentPage.config.defaultLayoutMode !== normalizedMode) {
          currentPage.config.defaultLayoutMode = normalizedMode
        }
      }
      projectStore.saveStatus = 'unsaved'
    }
  }

  // ========== 组合各个模块 ==========

  const indexCtx = useComponentIndex()
  const selectionCtx = useComponentSelection(indexCtx)
  const styleCtx = useComponentStyle(indexCtx, syncToProjectStore)
  const treeCtx = useComponentTree(indexCtx, selectionCtx, syncToProjectStore)

  // ========== 命令式 Actions ==========

  /**
   * 添加组件到指定父节点（通过命令执行，支持撤销）
   */
  function addComponent(parentId: string | null, component: NodeSchema, index?: number): string {
    if (!treeCtx.rootNode.value) {
      console.error('[ComponentStore] Root node is null')
      return ''
    }

    const historyStore = useHistoryStore()
    const cmd = new AddComponentCommand(parentId, component, index)
    historyStore.executeCommand(cmd)

    console.log(`[ComponentStore] Added component via command:`, cmd.getAddedId())
    return cmd.getAddedId() || ''
  }

  /**
   * 更新组件的 props（通过命令执行，支持撤销）
   */
  function updateProps(id: string, props: Record<string, unknown>) {
    const node = indexCtx.nodeIndex.get(id)
    if (!node) {
      console.warn(`[ComponentStore] Node not found: ${id}`)
      return
    }

    const historyStore = useHistoryStore()
    const cmd = new UpdatePropsCommand(id, props)
    historyStore.executeCommand(cmd)
  }

  /**
   * 更新组件的 style（通过命令执行，支持撤销）
   */
  function updateStyle(id: string, style: Partial<NodeStyle>) {
    const node = indexCtx.nodeIndex.get(id)
    if (!node) {
      console.warn(`[ComponentStore] updateStyle - Node not found: ${id}`)
      return
    }

    const historyStore = useHistoryStore()
    const cmd = new UpdateStyleCommand(id, style)
    historyStore.executeCommand(cmd)
  }

  /**
   * 更新组件的几何信息（通过命令执行，支持撤销）
   */
  function updateGeometry(id: string, geometry: Partial<NodeGeometry>) {
    const node = indexCtx.nodeIndex.get(id)
    if (!node) {
      console.warn(`[ComponentStore] updateGeometry - Node not found: ${id}`)
      return
    }

    const historyStore = useHistoryStore()
    const cmd = new UpdateGeometryCommand(id, geometry)
    historyStore.executeCommand(cmd)
  }

  /**
   * 更新组件的 dataSource（通过命令执行，支持撤销）
   */
  function updateDataSource(id: string, dataSource: Record<string, unknown>) {
    const node = indexCtx.nodeIndex.get(id)
    if (!node) {
      console.warn(`[ComponentStore] Node not found: ${id}`)
      return
    }

    const historyStore = useHistoryStore()
    const cmd = new UpdateDataSourceCommand(id, dataSource)
    historyStore.executeCommand(cmd)
  }

  /**
   * 更新组件的事件配置（通过命令执行，支持撤销）
   */
  function updateEvents(id: string, events: Record<string, unknown[]>) {
    const node = indexCtx.nodeIndex.get(id)
    if (!node) {
      console.warn(`[ComponentStore] Node not found: ${id}`)
      return
    }

    const historyStore = useHistoryStore()
    const cmd = new UpdateEventsCommand(id, events)
    historyStore.executeCommand(cmd)
  }

  /**
   * 更新组件的布局模式（通过命令执行，支持撤销）
   */
  function updateContainerLayout(id: string, layoutMode: 'free' | 'flow' | 'grid') {
    const node = indexCtx.nodeIndex.get(id)
    if (!node) {
      console.warn(`[ComponentStore] Node not found: ${id}`)
      return
    }
    if (node.container?.mode === layoutMode) return

    const historyStore = useHistoryStore()
    const cmd = new UpdateChildLayoutCommand(id, layoutMode)
    historyStore.executeCommand(cmd)
  }

  /**
   * 更新自适应网格模板（通过命令执行，支持撤销）
   */
  function updateGridTemplate(id: string, columns: string, rows: string) {
    const node = indexCtx.nodeIndex.get(id)
    if (!node || node.container?.mode !== 'grid') return

    const historyStore = useHistoryStore()
    const cmd = new UpdateGridTemplateCommand(id, columns, rows)
    historyStore.executeCommand(cmd)
  }

  /**
   * 删除组件（通过命令执行，支持撤销）
   */
  function deleteComponent(id: string) {
    if (!treeCtx.rootNode.value) return

    if (id === treeCtx.rootNode.value.id) {
      ElMessage.warning('不能删除根节点')
      return
    }

    const historyStore = useHistoryStore()
    const cmd = new DeleteComponentCommand(id)
    historyStore.executeCommand(cmd)

    console.log(`[ComponentStore] Deleted component via command: ${id}`)
  }

  /**
   * 批量删除组件
   */
  function deleteComponents(ids: string[]) {
    ids.forEach((id) => deleteComponent(id))
  }

  /**
   * 移动组件到新位置（通过命令执行，支持撤销）
   */
  function moveComponent(id: string, newParentId: string, newIndex: number) {
    if (!treeCtx.rootNode.value) return

    if (id === treeCtx.rootNode.value.id) {
      ElMessage.warning('不能移动根节点')
      return
    }

    const historyStore = useHistoryStore()
    const cmd = new MoveComponentCommand(id, newParentId, newIndex)
    historyStore.executeCommand(cmd)

    console.log(
      `[ComponentStore] Moved component ${id} via command to parent ${newParentId} at index ${newIndex}`,
    )
  }

  /**
   * 原子化移动 + 几何更新（一个历史记录步骤）
   */
  function moveComponentWithGeometry(
    id: string,
    newParentId: string,
    newIndex: number,
    geometry: Partial<NodeGeometry>,
  ) {
    if (!treeCtx.rootNode.value) return

    if (id === treeCtx.rootNode.value.id) {
      ElMessage.warning('不能移动根节点')
      return
    }

    const historyStore = useHistoryStore()
    const batch = new BatchCommand(
      [
        new MoveComponentCommand(id, newParentId, newIndex),
        new UpdateGeometryCommand(id, geometry),
      ],
      `Move and update geometry of ${id}`,
    )
    historyStore.executeCommand(batch, true)
  }

  // ========== 剪贴板 ==========

  const clipboardCtx = useComponentClipboard(
    indexCtx,
    selectionCtx,
    treeCtx,
    deleteComponent,
    syncToProjectStore,
  )

  // ========== Computed ==========

  /**
   * 组件数量（不含根节点），使用 Map.size O(1) 计算
   */
  const nodeCount = computed(() => {
    return Math.max(0, indexCtx.nodeIndex.size - 1)
  })

  // ========== Compatibility Shims ==========

  /**
   * @deprecated Use rootNode and traverse() instead
   */
  const componentStore = computed(() => {
    if (!treeCtx.rootNode.value) return []
    return treeCtx.flattenTree(treeCtx.rootNode.value)
  })

  /**
   * @deprecated Use selectedNode instead
   */
  const selectedComponent = computed(() => selectionCtx.selectedNode.value)

  /**
   * @deprecated Use findNodeById(rootNode, id) instead
   */
  function getComponentById(id: string): NodeSchema | null {
    return indexCtx.nodeIndex.get(id) || null
  }

  /**
   * Update component position in geometry
   */
  function updateComponentPosition(id: string, x: number, y: number) {
    updateGeometry(id, { mode: 'free', x, y })
  }

  /**
   * Update component size in geometry
   */
  function updateComponentSize(id: string, width: number, height: number) {
    updateGeometry(id, { mode: 'free', width, height })
  }

  /**
   * Update component rotation in geometry
   */
  function updateComponentRotation(id: string, rotate: number) {
    updateGeometry(id, { mode: 'free', rotate })
  }

  // ========== 响应式属性引用工厂（包装） ==========

  function createPropRef<T = unknown>(
    id: string,
    propName: string,
    defaultValue?: T,
  ): import('vue').WritableComputedRef<T> {
    return styleCtx.createPropRef(id, propName, defaultValue, updateProps)
  }

  function createStyleRef<T = unknown>(
    id: string,
    styleName: string,
    defaultValue?: T,
  ): import('vue').WritableComputedRef<T> {
    return styleCtx.createStyleRef(id, styleName, defaultValue, updateStyle)
  }

  function createPropRefs(
    id: string,
    propConfigs: Array<{ name: string; defaultValue?: unknown }>,
  ): Record<string, import('vue').WritableComputedRef<unknown>> {
    return styleCtx.createPropRefs(id, propConfigs, updateProps)
  }

  function createStyleRefs(
    id: string,
    styleConfigs: Array<{ name: string; defaultValue?: unknown }>,
  ): Record<string, import('vue').WritableComputedRef<unknown>> {
    return styleCtx.createStyleRefs(id, styleConfigs, updateStyle)
  }

  // ========== Watchers ==========

  /**
   * 监听页面切换，自动加载新页面的组件树
   */
  watch(
    () => projectStore.currentPage,
    (newPage) => {
      if (newPage && newPage.children) {
        treeCtx.loadTree(newPage.children)
        console.log(`[ComponentStore] Loaded tree for page: ${newPage.name}`)
      } else {
        treeCtx.rootNode.value = null
        indexCtx.rebuildIndex(null)
      }
    },
    { immediate: true },
  )

  // ========== 初始化 Store Accessor ==========

  setStoreAccessor({
    findNodeById: (_node: NodeSchema | null, id: string) => indexCtx.findNodeById(id),
    getNodeIndex: indexCtx.getNodeIndex,
    getParentId: indexCtx.getParentId,
    addComponentRaw: treeCtx.addComponentRaw,
    deleteComponentRaw: treeCtx.deleteComponentRaw,
    moveComponentRaw: treeCtx.moveComponentRaw,
    updateStyleRaw: styleCtx.updateStyleRaw,
    updatePropsRaw: styleCtx.updatePropsRaw,
    updateDataSourceRaw: styleCtx.updateDataSourceRaw,
    updateGeometryRaw: styleCtx.updateGeometryRaw,
    updateEventsRaw: styleCtx.updateEventsRaw,
    updateChildLayoutRaw: styleCtx.updateContainerLayoutRaw,
    updateGridTemplateRaw: styleCtx.updateGridTemplateRaw,
  })

  return {
    // State
    rootNode: treeCtx.rootNode,
    selectedId: selectionCtx.selectedId,
    selectedIds: selectionCtx.selectedIds,
    hoveredId: selectionCtx.hoveredId,
    styleVersion: styleCtx.styleVersion,
    parentIndex: indexCtx.parentIndex,

    // Getters
    selectedNode: selectionCtx.selectedNode,
    selectedNodes: selectionCtx.selectedNodes,
    hoveredNode: selectionCtx.hoveredNode,
    getStyleVersion: styleCtx.getStyleVersion,
    nodeCount,

    // Utilities
    findNodeById: (nodeOrId: NodeSchema | null | string, targetId?: string) => {
      // Simplified API: findNodeById(id)
      if (typeof nodeOrId === 'string') {
        return indexCtx.findNodeById(nodeOrId)
      }

      // Legacy API: findNodeById(root, id) - search within provided subtree.
      // If root is null/undefined, fallback to global index lookup for backward compatibility.
      if (!targetId) {
        return null
      }

      if (!nodeOrId) {
        return indexCtx.findNodeById(targetId)
      }

      let matched: NodeSchema | null = null
      indexCtx.traverse(nodeOrId, (node) => {
        if (!matched && node.id === targetId) {
          matched = node
        }
      })
      return matched
    },
    findParentNode: (nodeOrId: NodeSchema | null | string, targetId?: string) => {
      // Simplified API: findParentNode(id)
      if (typeof nodeOrId === 'string') {
        return indexCtx.findParentNode(nodeOrId)
      }

      // Legacy API: findParentNode(root, id) - search parent within provided subtree.
      // If root is null/undefined, fallback to global index lookup for backward compatibility.
      if (!targetId) {
        return null
      }

      if (!nodeOrId) {
        return indexCtx.findParentNode(targetId)
      }

      let matchedParent: NodeSchema | null = null
      indexCtx.traverse(nodeOrId, (node, parent) => {
        if (!matchedParent && node.id === targetId) {
          matchedParent = parent
        }
      })
      return matchedParent
    },
    getComponentById,
    getNodeIndex: indexCtx.getNodeIndex,
    getParentId: indexCtx.getParentId,
    traverse: indexCtx.traverse,

    // Actions
    loadTree: treeCtx.loadTree,
    setTree: treeCtx.setTree,
    flattenTree: treeCtx.flattenTree,
    addComponent,
    updateProps,
    updateStyle,
    updateGeometry,
    updateDataSource,
    updateEvents,
    updateContainerLayout,
    updateGridTemplate,
    deleteComponent,
    deleteComponents,
    moveComponent,
    moveComponentWithGeometry,
    selectComponent: selectionCtx.selectComponent,
    selectComponents: selectionCtx.selectComponents,
    selectByHitPath: selectionCtx.selectByHitPath,
    toggleSelection: selectionCtx.toggleSelection,
    setHovered: selectionCtx.setHovered,
    clearSelection: selectionCtx.clearSelection,
    syncToProjectStore,

    // Raw 方法（供命令内部使用）
    addComponentRaw: treeCtx.addComponentRaw,
    deleteComponentRaw: treeCtx.deleteComponentRaw,
    moveComponentRaw: treeCtx.moveComponentRaw,
    updateStyleRaw: styleCtx.updateStyleRaw,
    updatePropsRaw: styleCtx.updatePropsRaw,
    updateDataSourceRaw: styleCtx.updateDataSourceRaw,
    updateGeometryRaw: styleCtx.updateGeometryRaw,
    updateEventsRaw: styleCtx.updateEventsRaw,
    updateChildLayoutRaw: styleCtx.updateContainerLayoutRaw,
    updateGridTemplateRaw: styleCtx.updateGridTemplateRaw,

    // Clipboard
    clipboard: clipboardCtx.clipboard,
    canPaste: clipboardCtx.canPaste,
    copySelectedNodes: clipboardCtx.copySelectedNodes,
    cutSelectedNodes: clipboardCtx.cutSelectedNodes,
    pasteNodes: clipboardCtx.pasteNodes,

    // Compatibility (deprecated)
    componentStore,
    selectedComponent,
    isSelected: selectionCtx.isSelected,
    updateComponentPosition,
    updateComponentSize,
    updateComponentRotation,

    // 响应式属性引用工厂
    createPropRef,
    createStyleRef,
    createPropRefs,
    createStyleRefs,
  }
})

// 重新导出类型
export type { ComponentIndexContext } from './useComponentIndex'
export type { ComponentSelectionContext } from './useComponentSelection'
export type { ComponentStyleContext } from './useComponentStyle'
export type { ComponentTreeContext } from './useComponentTree'
export type { ComponentClipboardContext } from './useComponentClipboard'
