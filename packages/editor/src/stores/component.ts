import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { NodeSchema } from '@vela/core'
import { generateId } from '@vela/core'
import { useProjectStore } from './project'
import { ElMessage } from 'element-plus'
import { cloneDeep } from 'lodash-es'

/**
 * 组件管理 Store
 * 管理 NodeSchema 的递归树结构和组件操作
 *
 * 性能优化：
 * - 使用 Map 索引实现 O(1) 节点查找
 * - 增量更新索引，避免全量重建
 */
export const useComponent = defineStore('component', () => {
  const projectStore = useProjectStore()

  // ========== State ==========

  /**
   * 当前页面的组件树根节点
   */
  const rootNode = ref<NodeSchema | null>(null)

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

  // ========== O(1) 索引缓存 ==========

  /**
   * 节点索引：id -> NodeSchema
   * 用于 O(1) 时间复杂度的节点查找
   */
  const nodeIndex = new Map<string, NodeSchema>()

  /**
   * 父节点索引：childId -> parentId
   * 用于 O(1) 时间复杂度的父节点查找
   */
  const parentIndex = new Map<string, string>()

  /**
   * 节点样式版本号：id -> version
   * 用于触发特定节点的响应式更新，避免全树重渲染
   */
  const styleVersion = ref<Record<string, number>>({})

  /**
   * 重建整个索引（在加载新树时调用）
   */
  function rebuildIndex() {
    nodeIndex.clear()
    parentIndex.clear()

    if (!rootNode.value) return

    traverse(rootNode.value, (node, parent) => {
      nodeIndex.set(node.id, node)
      if (parent) {
        parentIndex.set(node.id, parent.id)
      }
    })

    console.log(`[ComponentStore] Index rebuilt: ${nodeIndex.size} nodes`)
  }

  /**
   * 向索引中添加节点（增量更新）
   */
  function indexNode(node: NodeSchema, parentId?: string) {
    nodeIndex.set(node.id, node)
    if (parentId) {
      parentIndex.set(node.id, parentId)
    }

    // 递归索引子节点
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        indexNode(child, node.id)
      }
    }
  }

  /**
   * 从索引中移除节点（增量更新）
   */
  function unindexNode(id: string) {
    const node = nodeIndex.get(id)
    if (!node) return

    // 递归移除子节点的索引
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        unindexNode(child.id)
      }
    }

    nodeIndex.delete(id)
    parentIndex.delete(id)
  }

  // ========== Getters ==========

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

  // ========== Utilities ==========

  /**
   * O(1) 节点查找（推荐使用）
   * @param node - 忽略此参数，保留用于兼容性
   * @param targetId - 目标节点 ID
   */
  function findNodeById(node: NodeSchema | null, targetId: string): NodeSchema | null {
    return nodeIndex.get(targetId) || null
  }

  /**
   * O(1) 父节点查找（推荐使用）
   * @param node - 忽略此参数，保留用于兼容性
   * @param targetId - 目标节点 ID
   */
  function findParentNode(node: NodeSchema | null, targetId: string): NodeSchema | null {
    const parentId = parentIndex.get(targetId)
    if (!parentId) return null
    return nodeIndex.get(parentId) || null
  }

  /**
   * 递归遍历树
   */
  function traverse(
    node: NodeSchema,
    callback: (node: NodeSchema, parent: NodeSchema | null) => void,
    parent: NodeSchema | null = null,
  ) {
    callback(node, parent)

    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        traverse(child, callback, node)
      }
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

  // ========== Actions ==========

  /**
   * 加载页面组件树
   */
  function loadTree(tree: NodeSchema) {
    rootNode.value = cloneDeep(tree)
    // 重建索引
    rebuildIndex()
    // 清空选中状态
    selectedId.value = null
    selectedIds.value = []
    hoveredId.value = null
  }

  /**
   * 设置组件树（不深拷贝，用于撤销/重做）
   */
  function setTree(tree: NodeSchema) {
    rootNode.value = tree
    rebuildIndex()
  }

  /**
   * 添加组件到指定父节点
   * @param parentId 父节点 ID，null 表示添加到根节点的 children
   * @param component 新组件节点
   * @param index 插入位置，默认末尾
   */
  function addComponent(parentId: string | null, component: NodeSchema, index?: number): string {
    if (!rootNode.value) {
      console.error('[ComponentStore] Root node is null')
      return ''
    }

    const newComponent = cloneDeep(component)
    const effectiveParentId = parentId || rootNode.value.id

    // 如果没有 parentId，添加到根节点
    if (!parentId) {
      if (!rootNode.value.children) {
        rootNode.value.children = []
      }

      if (index !== undefined) {
        rootNode.value.children.splice(index, 0, newComponent)
      } else {
        rootNode.value.children.push(newComponent)
      }

      // 更新索引
      indexNode(newComponent, rootNode.value.id)

      console.log(`[ComponentStore] Added component to root:`, newComponent.id)
      syncToProjectStore()
      return newComponent.id
    }

    // 查找父节点（O(1)）
    const parentNode = nodeIndex.get(parentId)
    if (!parentNode) {
      console.error('[ComponentStore] Parent node not found:', parentId)
      return ''
    }

    // 初始化 children
    if (!parentNode.children) {
      parentNode.children = []
    }

    // 插入组件
    if (index !== undefined) {
      parentNode.children.splice(index, 0, newComponent)
    } else {
      parentNode.children.push(newComponent)
    }

    // 更新索引
    indexNode(newComponent, parentId)

    console.log(`[ComponentStore] Added component:`, newComponent.id, 'to parent:', parentId)
    syncToProjectStore()
    return newComponent.id
  }

  /**
   * 更新组件的 props
   * 使用版本号触发特定组件的响应式更新，避免全树重渲染
   */
  function updateProps(id: string, props: Record<string, any>) {
    const node = nodeIndex.get(id)
    if (!node) {
      console.warn(`[ComponentStore] Node not found: ${id}`)
      return
    }

    // 使用对象展开创建新对象
    node.props = {
      ...(node.props || {}),
      ...props,
    }

    // 递增该节点的版本号，触发订阅该节点的组件更新
    styleVersion.value = {
      ...styleVersion.value,
      [id]: (styleVersion.value[id] || 0) + 1,
    }

    syncToProjectStore()
  }

  /**
   * 更新组件的 style
   * 使用版本号触发特定组件的响应式更新，避免全树重渲染
   */
  function updateStyle(id: string, style: Record<string, any>) {
    const node = nodeIndex.get(id)
    if (!node) {
      console.warn(`[ComponentStore] updateStyle - Node not found: ${id}`)
      console.warn(`[ComponentStore] Available nodes:`, Array.from(nodeIndex.keys()))
      return
    }

    // 使用对象展开创建新对象
    node.style = {
      ...(node.style || {}),
      ...style,
    }

    // 递增该节点的版本号，触发订阅该节点的组件更新
    styleVersion.value = {
      ...styleVersion.value,
      [id]: (styleVersion.value[id] || 0) + 1,
    }

    syncToProjectStore()
  }

  /**
   * 更新组件的 dataSource
   */
  function updateDataSource(id: string, dataSource: Record<string, any>) {
    const node = nodeIndex.get(id)
    if (!node) {
      console.warn(`[ComponentStore] Node not found: ${id}`)
      return
    }

    node.dataSource = { ...node.dataSource, ...dataSource }
    syncToProjectStore()
  }

  /**
   * 删除组件
   */
  function deleteComponent(id: string) {
    if (!rootNode.value) return

    // 不能删除根节点
    if (id === rootNode.value.id) {
      ElMessage.warning('不能删除根节点')
      return
    }

    // O(1) 查找父节点
    const parentId = parentIndex.get(id)
    if (!parentId) {
      console.warn(`[ComponentStore] Parent not found for: ${id}`)
      return
    }

    const parentNode = nodeIndex.get(parentId)
    if (!parentNode || !parentNode.children) {
      console.warn(`[ComponentStore] Parent node invalid for: ${id}`)
      return
    }

    const index = parentNode.children.findIndex((child) => child.id === id)
    if (index !== -1) {
      // 先从索引中移除（包括子节点）
      unindexNode(id)

      // 从父节点中移除
      parentNode.children.splice(index, 1)

      // 清空选中状态
      if (selectedId.value === id) {
        selectedId.value = null
      }
      selectedIds.value = selectedIds.value.filter((sid) => sid !== id)

      console.log(`[ComponentStore] Deleted component: ${id}`)
      syncToProjectStore()
    }
  }

  /**
   * 批量删除组件
   */
  function deleteComponents(ids: string[]) {
    ids.forEach((id) => deleteComponent(id))
  }

  /**
   * 移动组件到新位置
   * @param id 要移动的组件 ID
   * @param newParentId 新父节点 ID
   * @param newIndex 新位置索引
   */
  function moveComponent(id: string, newParentId: string, newIndex: number) {
    if (!rootNode.value) return

    // 不能移动根节点
    if (id === rootNode.value.id) {
      ElMessage.warning('不能移动根节点')
      return
    }

    // O(1) 查找节点和父节点
    const node = nodeIndex.get(id)
    const oldParentId = parentIndex.get(id)

    if (!node || !oldParentId) {
      console.warn(`[ComponentStore] Cannot find node or parent for: ${id}`)
      return
    }

    const oldParent = nodeIndex.get(oldParentId)
    if (!oldParent || !oldParent.children) {
      console.warn(`[ComponentStore] Old parent invalid for: ${id}`)
      return
    }

    // 从原位置移除
    const oldIndex = oldParent.children.findIndex((child) => child.id === id)
    if (oldIndex === -1) return

    oldParent.children.splice(oldIndex, 1)

    // 查找新父节点
    const newParent = nodeIndex.get(newParentId)
    if (!newParent) {
      console.warn(`[ComponentStore] New parent not found: ${newParentId}`)
      // 恢复到原位置
      oldParent.children.splice(oldIndex, 0, node)
      return
    }

    // 初始化新父节点的 children
    if (!newParent.children) {
      newParent.children = []
    }

    // 插入到新位置
    newParent.children.splice(newIndex, 0, node)

    // 更新父节点索引
    parentIndex.set(id, newParentId)

    console.log(
      `[ComponentStore] Moved component ${id} to parent ${newParentId} at index ${newIndex}`,
    )
    syncToProjectStore()
  }

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
   * 同步到 ProjectStore 的当前页面
   */
  function syncToProjectStore() {
    const currentPage = projectStore.currentPage
    if (currentPage && rootNode.value) {
      currentPage.children = cloneDeep(rootNode.value)
      projectStore.saveStatus = 'unsaved'
    }
  }

  // ========== Compatibility Shims ==========
  // These are provided for backwards compatibility with code using the old flat array API

  /**
   * @deprecated Use rootNode and traverse() instead
   * Provides a flat array view of all components for legacy code
   */
  const componentStore = computed(() => {
    if (!rootNode.value) return []
    return flattenTree(rootNode.value)
  })

  /**
   * @deprecated Use selectedNode instead
   */
  const selectComponentRef = computed(() => selectedNode.value)

  /**
   * Check if a specific component is selected
   */
  function isSelected(id: string): boolean {
    return selectedIds.value.includes(id)
  }

  /**
   * @deprecated Use selectedNode instead
   */
  const selectedComponent = computed(() => selectedNode.value)

  /**
   * @deprecated Use findNodeById(rootNode, id) instead
   */
  function getComponentById(id: string): NodeSchema | null {
    return nodeIndex.get(id) || null
  }

  /**
   * Update component position (x, y in style)
   */
  function updateComponentPosition(id: string, x: number, y: number) {
    updateStyle(id, { x, y })
  }

  /**
   * Update component size (width, height in style)
   */
  function updateComponentSize(id: string, width: number, height: number) {
    updateStyle(id, { width, height })
  }

  /**
   * Update component rotation
   */
  function updateComponentRotation(id: string, rotation: number) {
    updateStyle(id, { rotation })
  }

  // ========== Clipboard ==========

  /**
   * 剪贴板存储
   */
  const clipboard = ref<NodeSchema[]>([])

  /**
   * 是否有可粘贴的内容
   */
  const canPaste = computed(() => clipboard.value.length > 0)

  /**
   * 复制选中的节点
   */
  function copySelectedNodes() {
    if (selectedIds.value.length === 0) {
      ElMessage.warning('请先选择要复制的组件')
      return
    }

    const nodesToCopy = selectedIds.value
      .map((id) => nodeIndex.get(id))
      .filter((node): node is NodeSchema => node !== undefined)

    // 深拷贝节点
    clipboard.value = nodesToCopy.map((node) => cloneDeep(node))
    ElMessage.success(`已复制 ${clipboard.value.length} 个组件`)
  }

  /**
   * 剪切选中的节点
   */
  function cutSelectedNodes() {
    if (selectedIds.value.length === 0) {
      ElMessage.warning('请先选择要剪切的组件')
      return
    }

    // 先复制
    copySelectedNodes()

    // 再删除
    const idsToDelete = [...selectedIds.value]
    idsToDelete.forEach((id) => deleteComponent(id))

    ElMessage.success(`已剪切 ${idsToDelete.length} 个组件`)
  }

  /**
   * 生成新的唯一 ID
   */
  function generateNewId(prefix: string = 'node'): string {
    return generateId(prefix)
  }

  /**
   * 递归更新节点 ID（用于粘贴时避免 ID 冲突）
   */
  function cloneWithNewIds(node: NodeSchema): NodeSchema {
    const newNode = cloneDeep(node)
    newNode.id = generateNewId()

    if (newNode.children && Array.isArray(newNode.children)) {
      newNode.children = newNode.children.map((child) => cloneWithNewIds(child))
    }

    return newNode
  }

  /**
   * 粘贴节点到当前选中的容器或根节点
   */
  function pasteNodes() {
    if (clipboard.value.length === 0) {
      ElMessage.warning('剪贴板为空')
      return
    }

    if (!rootNode.value) {
      ElMessage.warning('请先创建页面')
      return
    }

    // 确定粘贴目标
    let targetNode: NodeSchema = rootNode.value
    let targetId = rootNode.value.id

    // 如果选中了一个节点，检查它是否可以作为容器
    if (selectedId.value) {
      const selected = nodeIndex.get(selectedId.value)
      if (selected && selected.componentName === 'Container') {
        targetNode = selected
        targetId = selected.id
      }
    }

    // 确保目标有 children 数组
    if (!targetNode.children) {
      targetNode.children = []
    }

    // 粘贴节点（使用新 ID）
    const pastedNodes = clipboard.value.map((node) => cloneWithNewIds(node))
    targetNode.children.push(...pastedNodes)

    // 更新索引
    for (const node of pastedNodes) {
      indexNode(node, targetId)
    }

    // 同步到 project store
    syncToProjectStore()

    // 选中粘贴的节点
    const newIds = pastedNodes.map((n) => n.id)
    selectComponents(newIds)

    ElMessage.success(`已粘贴 ${pastedNodes.length} 个组件`)
  }

  // ========== Watchers ==========

  /**
   * 监听页面切换，自动加载新页面的组件树
   */
  watch(
    () => projectStore.currentPage,
    (newPage) => {
      if (newPage && newPage.children) {
        loadTree(newPage.children)
        console.log(`[ComponentStore] Loaded tree for page: ${newPage.name}`)
      } else {
        rootNode.value = null
        rebuildIndex() // 清空索引
      }
    },
    { immediate: true },
  )

  /**
   * 获取节点样式的版本号（用于触发响应式更新）
   */
  function getStyleVersion(id: string): number {
    return styleVersion.value[id] || 0
  }

  return {
    // State
    rootNode,
    selectedId,
    selectedIds,
    hoveredId,
    styleVersion,

    // Getters
    selectedNode,
    selectedNodes,
    hoveredNode,
    getStyleVersion,

    // Utilities
    findNodeById,
    findParentNode,
    getComponentById,
    traverse,

    // Actions
    loadTree,
    setTree,
    flattenTree,
    addComponent,
    updateProps,
    updateStyle,
    updateDataSource,
    deleteComponent,
    deleteComponents,
    moveComponent,
    selectComponent,
    selectComponents,
    toggleSelection,
    setHovered,
    clearSelection,
    syncToProjectStore,

    // Clipboard
    clipboard,
    canPaste,
    copySelectedNodes,
    cutSelectedNodes,
    pasteNodes,

    // Compatibility (deprecated)
    componentStore,
    selectedComponent,
    isSelected,
    updateComponentPosition,
    updateComponentSize,
    updateComponentRotation,
  }
})
