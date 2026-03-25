import { ref, computed } from 'vue'
import type { NodeSchema } from '@vela/core'
import { generateId } from '@vela/core'
import { getComponentDefinition, resolveComponentAlias } from '@vela/core/contracts'
import { cloneDeep } from 'lodash-es'
import { ElMessage } from 'element-plus'
import { useHistoryStore } from '../history'
import { AddComponentCommand, BatchCommand } from '../commands'
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
  deleteComponents: (ids: string[]) => void,
) {
  const { nodeIndex } = indexCtx
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

  function canNodeAcceptChildren(node: NodeSchema | null | undefined): boolean {
    if (!node) return false
    if (Array.isArray(node.children)) return true

    const componentName = node.component || node.componentName
    if (!componentName) return false

    const definition = getComponentDefinition(resolveComponentAlias(componentName))
    return Boolean(definition?.isContainer)
  }

  /**
   * 复制选中的节点
   */
  function copySelectedNodes() {
    if (selectedIds.value.length === 0) {
      ElMessage.warning('请先选择要复制的组件')
      return
    }

    const normalizedIds = Array.from(
      new Set(
        selectedIds.value.filter((id) => {
          let parentId = indexCtx.getParentId(id)
          while (parentId) {
            if (selectedIds.value.includes(parentId)) {
              return false
            }
            parentId = indexCtx.getParentId(parentId)
          }
          return true
        }),
      ),
    )

    const nodesToCopy = normalizedIds
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
    const idsToDelete = Array.from(
      new Set(
        selectedIds.value.filter((id) => {
          let parentId = indexCtx.getParentId(id)
          while (parentId) {
            if (selectedIds.value.includes(parentId)) {
              return false
            }
            parentId = indexCtx.getParentId(parentId)
          }
          return true
        }),
      ),
    )
    deleteComponents(idsToDelete)

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
    let targetParentId: string | null = null

    // 如果选中了一个节点，检查它是否可以作为容器
    if (selectedId.value) {
      const selected = nodeIndex.get(selectedId.value)
      const canAcceptChildren = canNodeAcceptChildren(selected)
      if (canAcceptChildren && selected) {
        targetParentId = selected.id
      }
    }

    const pastedNodes = clipboard.value.map((node) => cloneWithNewIds(node))
    const addCommands = pastedNodes.map((node) => new AddComponentCommand(targetParentId, node))
    const historyStore = useHistoryStore()
    historyStore.executeCommand(
      new BatchCommand(addCommands, `Paste ${pastedNodes.length} components`),
      true,
    )

    // 选中粘贴的节点
    const newIds = addCommands
      .map((command) => command.getAddedId())
      .filter((id): id is string => Boolean(id))
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
