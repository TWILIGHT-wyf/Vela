import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { NodeSchema } from '@vela/core'
import { useProjectStore } from './project'
import { ElMessage } from 'element-plus'
import { cloneDeep } from 'lodash-es'

/**
 * ��������� Store
 * ���� NodeSchema �ĵݹ����ṹ�������
 */
export const useComponent = defineStore('component', () => {
  const projectStore = useProjectStore()

  // ========== State ==========

  /**
   * ��ǰҳ�����������ڵ�
   */
  const rootNode = ref<NodeSchema | null>(null)

  /**
   * ��ǰѡ�е���� ID����ѡ���ѡ�ĵ�һ����
   */
  const selectedId = ref<string | null>(null)

  /**
   * ��ѡ����� ID ����
   */
  const selectedIds = ref<string[]>([])

  /**
   * Hover ����� ID
   */
  const hoveredId = ref<string | null>(null)

  // ========== Getters ==========

  /**
   * ��ȡ��ǰѡ�е�����ڵ�
   */
  const selectedNode = computed<NodeSchema | null>(() => {
    if (!selectedId.value || !rootNode.value) return null
    return findNodeById(rootNode.value, selectedId.value)
  })

  /**
   * ��ȡ����ѡ�е�����ڵ�
   */
  const selectedNodes = computed<NodeSchema[]>(() => {
    if (!rootNode.value || selectedIds.value.length === 0) return []
    return selectedIds.value
      .map((id) => findNodeById(rootNode.value!, id))
      .filter((node): node is NodeSchema => node !== null)
  })

  /**
   * ��ȡ hover ������ڵ�
   */
  const hoveredNode = computed<NodeSchema | null>(() => {
    if (!hoveredId.value || !rootNode.value) return null
    return findNodeById(rootNode.value, hoveredId.value)
  })

  // ========== Utilities ==========

  /**
   * �ݹ���ҽڵ�
   */
  function findNodeById(node: NodeSchema, targetId: string): NodeSchema | null {
    if (node.id === targetId) {
      return node
    }

    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        const found = findNodeById(child, targetId)
        if (found) return found
      }
    }

    return null
  }

  /**
   * �ݹ���Ҹ��ڵ�
   */
  function findParentNode(node: NodeSchema, targetId: string): NodeSchema | null {
    if (!node.children || !Array.isArray(node.children)) {
      return null
    }

    for (const child of node.children) {
      if (child.id === targetId) {
        return node
      }

      const found = findParentNode(child, targetId)
      if (found) return found
    }

    return null
  }

  /**
   * �ݹ������
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
   * ��ƽ����Ϊ����
   */
  function flattenTree(node: NodeSchema): NodeSchema[] {
    const result: NodeSchema[] = []
    traverse(node, (n) => result.push(n))
    return result
  }

  // ========== Actions ==========

  /**
   * ����ҳ��������
   */
  function loadTree(tree: NodeSchema) {
    rootNode.value = cloneDeep(tree)
    // ���ѡ��״̬
    selectedId.value = null
    selectedIds.value = []
    hoveredId.value = null
  }

  /**
   * ������������������ڳ���/������
   */
  function setTree(tree: NodeSchema) {
    rootNode.value = tree
  }

  /**
   * ���������ָ�����ڵ�
   * @param parentId ���ڵ� ID��null ��ʾ���ӵ����ڵ�� children
   * @param component ������ڵ�
   * @param index ����λ�ã�Ĭ��ĩβ
   */
  function addComponent(parentId: string | null, component: NodeSchema, index?: number): string {
    if (!rootNode.value) {
      console.error('[ComponentStore] Root node is null')
      return ''
    }

    const newComponent = cloneDeep(component)

    // ���û�� parentId�����ӵ����ڵ�
    if (!parentId) {
      if (!rootNode.value.children) {
        rootNode.value.children = []
      }

      if (index !== undefined) {
        rootNode.value.children.splice(index, 0, newComponent)
      } else {
        rootNode.value.children.push(newComponent)
      }

      console.log(`[ComponentStore] Added component to root:`, newComponent.id)
      syncToProjectStore()
      return newComponent.id
    }

    // ���Ҹ��ڵ�
    const parentNode = findNodeById(rootNode.value, parentId)
    if (!parentNode) {
      console.error('[ComponentStore] Parent node not found:', parentId)
      return ''
    }

    // ��ʼ�� children
    if (!parentNode.children) {
      parentNode.children = []
    }

    // �������
    if (index !== undefined) {
      parentNode.children.splice(index, 0, newComponent)
    } else {
      parentNode.children.push(newComponent)
    }

    console.log(`[ComponentStore] Added component:`, newComponent.id, 'to parent:', parentId)
    syncToProjectStore()
    return newComponent.id
  }

  /**
   * ��������� props
   */
  function updateProps(id: string, props: Record<string, any>) {
    if (!rootNode.value) return

    const node = findNodeById(rootNode.value, id)
    if (!node) {
      console.warn(`[ComponentStore] Node not found: ${id}`)
      return
    }

    if (!node.props) {
      node.props = {}
    }
    Object.assign(node.props, props)
    syncToProjectStore()
  }

  /**
   * ��������� style
   */
  function updateStyle(id: string, style: Record<string, any>) {
    if (!rootNode.value) return

    const node = findNodeById(rootNode.value, id)
    if (!node) {
      console.warn(`[ComponentStore] Node not found: ${id}`)
      return
    }

    if (!node.style) {
      node.style = {}
    }

    Object.assign(node.style, style)
    syncToProjectStore()
  }

  /**
   * ɾ�����
   */
  function deleteComponent(id: string) {
    if (!rootNode.value) return

    // ������ɾ�����ڵ�
    if (id === rootNode.value.id) {
      ElMessage.warning('����ɾ�����ڵ�')
      return
    }

    const parentNode = findParentNode(rootNode.value, id)
    if (!parentNode || !parentNode.children) {
      console.warn(`[ComponentStore] Parent not found for: ${id}`)
      return
    }

    const index = parentNode.children.findIndex((child) => child.id === id)
    if (index !== -1) {
      parentNode.children.splice(index, 1)

      // ���ѡ��״̬
      if (selectedId.value === id) {
        selectedId.value = null
      }
      selectedIds.value = selectedIds.value.filter((sid) => sid !== id)

      console.log(`[ComponentStore] Deleted component: ${id}`)
      syncToProjectStore()
    }
  }

  /**
   * ����ɾ�����
   */
  function deleteComponents(ids: string[]) {
    ids.forEach((id) => deleteComponent(id))
  }

  /**
   * �ƶ��������λ��
   * @param id Ҫ�ƶ������ ID
   * @param newParentId �¸��ڵ� ID
   * @param newIndex ��λ������
   */
  function moveComponent(id: string, newParentId: string, newIndex: number) {
    if (!rootNode.value) return

    // �������ƶ����ڵ�
    if (id === rootNode.value.id) {
      ElMessage.warning('�����ƶ����ڵ�')
      return
    }

    // ���ұ��ƶ��Ľڵ���丸�ڵ�
    const node = findNodeById(rootNode.value, id)
    const oldParent = findParentNode(rootNode.value, id)

    if (!node || !oldParent || !oldParent.children) {
      console.warn(`[ComponentStore] Cannot find node or parent for: ${id}`)
      return
    }

    // ��ԭλ���Ƴ�
    const oldIndex = oldParent.children.findIndex((child) => child.id === id)
    if (oldIndex === -1) return

    oldParent.children.splice(oldIndex, 1)

    // �����¸��ڵ�
    const newParent = findNodeById(rootNode.value, newParentId)
    if (!newParent) {
      console.warn(`[ComponentStore] New parent not found: ${newParentId}`)
      // �ָ���ԭλ��
      oldParent.children.splice(oldIndex, 0, node)
      return
    }

    // ��ʼ���¸��ڵ�� children
    if (!newParent.children) {
      newParent.children = []
    }

    // ���뵽��λ��
    newParent.children.splice(newIndex, 0, node)

    console.log(
      `[ComponentStore] Moved component ${id} to parent ${newParentId} at index ${newIndex}`,
    )
    syncToProjectStore()
  }

  /**
   * ѡ�����
   */
  function selectComponent(id: string | null) {
    selectedId.value = id
    selectedIds.value = id ? [id] : []
  }

  /**
   * ��ѡ���
   */
  function selectComponents(ids: string[]) {
    selectedIds.value = ids
    selectedId.value = ids.length > 0 ? ids[0] : null
  }

  /**
   * �л����ѡ��״̬������ Ctrl+Click��
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
   * ���� hover ���
   */
  function setHovered(id: string | null) {
    hoveredId.value = id
  }

  /**
   * ���ѡ��
   */
  function clearSelection() {
    selectedId.value = null
    selectedIds.value = []
  }

  /**
   * ͬ���� ProjectStore �ĵ�ǰҳ��
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
    if (!rootNode.value) return null
    return findNodeById(rootNode.value, id)
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
    if (selectedIds.value.length === 0 || !rootNode.value) {
      ElMessage.warning('请先选择要复制的组件')
      return
    }

    const nodesToCopy = selectedIds.value
      .map((id) => findNodeById(rootNode.value!, id))
      .filter((node): node is NodeSchema => node !== null)

    // 深拷贝节点
    clipboard.value = nodesToCopy.map((node) => cloneDeep(node))
    ElMessage.success(`已复制 ${clipboard.value.length} 个组件`)
  }

  /**
   * 剪切选中的节点
   */
  function cutSelectedNodes() {
    if (selectedIds.value.length === 0 || !rootNode.value) {
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
  function generateNewId(): string {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
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

    // 如果选中了一个节点，检查它是否可以作为容器
    if (selectedId.value) {
      const selected = findNodeById(rootNode.value, selectedId.value)
      if (selected && selected.componentName === 'Container') {
        targetNode = selected
      }
    }

    // 确保目标有 children 数组
    if (!targetNode.children) {
      targetNode.children = []
    }

    // 粘贴节点（使用新 ID）
    const pastedNodes = clipboard.value.map((node) => cloneWithNewIds(node))
    targetNode.children.push(...pastedNodes)

    // 同步到 project store
    syncToProjectStore()

    // 选中粘贴的节点
    const newIds = pastedNodes.map((n) => n.id)
    selectComponents(newIds)

    ElMessage.success(`已粘贴 ${pastedNodes.length} 个组件`)
  }

  // ========== Watchers ==========

  /**
   * ����ҳ���л����Զ�������ҳ��������
   */
  watch(
    () => projectStore.currentPage,
    (newPage) => {
      if (newPage && newPage.children) {
        loadTree(newPage.children)
        console.log(`[ComponentStore] Loaded tree for page: ${newPage.name}`)
      } else {
        rootNode.value = null
      }
    },
    { immediate: true },
  )

  return {
    // State
    rootNode,
    selectedId,
    selectedIds,
    hoveredId,

    // Getters
    selectedNode,
    selectedNodes,
    hoveredNode,

    // Compatibility Shims (deprecated)
    componentStore,
    selectComponentRef,
    selectedComponent,
    isSelected,
    getComponentById,
    updateComponentPosition,
    updateComponentSize,
    updateComponentRotation,

    // Utilities
    findNodeById,
    findParentNode,
    traverse,
    flattenTree,

    // Actions
    loadTree,
    setTree,
    addComponent,
    updateProps,
    updateStyle,
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
  }
})
