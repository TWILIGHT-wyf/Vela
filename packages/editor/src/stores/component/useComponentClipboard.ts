import { ref, computed } from 'vue'
import type { NodeSchema } from '@vela/core'
import { generateId } from '@vela/core'
import { cloneDeep } from 'lodash-es'
import { ElMessage } from 'element-plus'
import type { ComponentIndexContext } from './useComponentIndex'
import type { ComponentSelectionContext } from './useComponentSelection'
import type { ComponentTreeContext } from './useComponentTree'

/**
 * 组件剪贴板管理
 */
export function useComponentClipboard(
  indexCtx: ComponentIndexContext,
  selectionCtx: ComponentSelectionContext,
  treeCtx: ComponentTreeContext,
  deleteComponent: (id: string) => void,
  syncToProjectStore: () => void,
) {
  const { nodeIndex, indexNode } = indexCtx
  const { selectedId, selectedIds, selectComponents } = selectionCtx
  const { rootNode } = treeCtx

  /**
   * 剪贴板存储
   */
  const clipboard = ref<NodeSchema[]>([])

  /**
   * 是否有可粘贴的内容
   */
  const canPaste = computed(() => clipboard.value.length > 0)

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

  return {
    clipboard,
    canPaste,
    copySelectedNodes,
    cutSelectedNodes,
    pasteNodes,
  }
}

export type ComponentClipboardContext = ReturnType<typeof useComponentClipboard>
