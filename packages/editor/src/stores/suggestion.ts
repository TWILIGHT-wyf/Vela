/**
 * 建议面板 Pinia Store
 * 管理建议状态、历史记录、审计日志
 * V2.0: Uses NodeSchema directly without conversion
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  SuggestionRequest,
  SuggestionResult,
  SuggestionItem,
  AuditRecord,
} from '@/types/suggestion'
import type { NodeSchema } from '@vela/core'
import { generateSuggestion, applyDiffs } from '@/services/suggestionService'
import { useComponent } from '@/stores/component'
import { useUIStore } from '@/stores/ui'
import { nanoid } from 'nanoid'

/**
 * Deep clone NodeSchema array for snapshots
 */
function cloneNodes(nodes: NodeSchema[]): NodeSchema[] {
  return JSON.parse(JSON.stringify(nodes))
}

/**
 * Apply NodeSchema changes to component store
 */
function applyNodesToStore(
  nodes: NodeSchema[],
  componentStore: ReturnType<typeof useComponent>,
): void {
  for (const node of nodes) {
    const existingNode = componentStore.getComponentById(node.id)
    if (existingNode) {
      // Update existing node
      componentStore.updateStyle(node.id, node.style || {})
      componentStore.updateProps(node.id, node.props || {})
    } else {
      // Add new node to root
      componentStore.addComponent(null, node)
    }
  }
}

export const useSuggestion = defineStore('suggestion', () => {
  // 状态
  const suggestions = ref<SuggestionItem[]>([])
  const auditRecords = ref<AuditRecord[]>([])
  const isGenerating = ref(false)
  const currentPreview = ref<SuggestionResult | null>(null)

  // 计算属性
  const pendingSuggestions = computed(() => suggestions.value.filter((s) => s.status === 'pending'))
  const acceptedCount = computed(
    () => suggestions.value.filter((s) => s.status === 'accepted').length,
  )
  const rejectedCount = computed(
    () => suggestions.value.filter((s) => s.status === 'rejected').length,
  )

  /**
   * 生成新建议
   */
  async function generate(prompt: string) {
    const componentStore = useComponent()
    const uiStore = useUIStore()

    isGenerating.value = true
    try {
      const request: SuggestionRequest = {
        prompt,
        context: {
          components: cloneNodes(componentStore.componentStore),
          canvasSize: {
            width: uiStore.canvasWidth,
            height: uiStore.canvasHeight,
          },
        },
        timestamp: Date.now(),
      }

      const result = await generateSuggestion(request)

      const item: SuggestionItem = {
        result,
        status: 'pending',
        createdAt: Date.now(),
      }

      suggestions.value.unshift(item)
      return result
    } catch (error) {
      console.error('[SuggestionStore] 生成建议失败:', error)
      throw error
    } finally {
      isGenerating.value = false
    }
  }

  /**
   * 预览建议
   */
  function preview(suggestionId: string) {
    const item = suggestions.value.find((s) => s.result.id === suggestionId)
    if (item) {
      currentPreview.value = item.result
      item.status = 'previewing'
    }
  }

  /**
   * 取消预览
   */
  function cancelPreview() {
    if (currentPreview.value) {
      const item = suggestions.value.find((s) => s.result.id === currentPreview.value?.id)
      if (item) {
        item.status = 'pending'
      }
    }
    currentPreview.value = null
  }

  /**
   * 接受建议（全部）
   */
  function accept(suggestionId: string) {
    const componentStore = useComponent()
    const item = suggestions.value.find((s) => s.result.id === suggestionId)
    if (!item) return

    const beforeSnapshot = cloneNodes(componentStore.componentStore)

    // 应用所有差异
    const { components: newComponents, appliedCount } = applyDiffs(
      cloneNodes(componentStore.componentStore),
      item.result.diffs,
    )

    if (appliedCount > 0) {
      applyNodesToStore(newComponents, componentStore)

      // 记录审计日志
      const audit: AuditRecord = {
        id: nanoid(),
        suggestionId: item.result.id,
        prompt: item.result.request.prompt,
        action: 'accepted',
        appliedDiffs: item.result.diffs.map((d: { description: string }) => d.description),
        agentVersion: item.result.agentVersion,
        changeSummary: `应用了 ${appliedCount} 个变更`,
        beforeSnapshot,
        afterSnapshot: cloneNodes(newComponents),
        timestamp: Date.now(),
      }
      auditRecords.value.unshift(audit)

      item.status = 'accepted'
      currentPreview.value = null
    }
  }

  /**
   * 部分接受建议
   */
  function acceptPartial(suggestionId: string, diffIndices: number[]) {
    const componentStore = useComponent()
    const item = suggestions.value.find((s) => s.result.id === suggestionId)
    if (!item) return

    const beforeSnapshot = cloneNodes(componentStore.componentStore)

    // 筛选要应用的差异
    const selectedDiffs = item.result.diffs.filter((_: unknown, index: number) =>
      diffIndices.includes(index),
    )

    const { components: newComponents, appliedCount } = applyDiffs(
      cloneNodes(componentStore.componentStore),
      selectedDiffs,
    )

    if (appliedCount > 0) {
      applyNodesToStore(newComponents, componentStore)

      // 记录审计日志
      const audit: AuditRecord = {
        id: nanoid(),
        suggestionId: item.result.id,
        prompt: item.result.request.prompt,
        action: 'partial',
        appliedDiffs: selectedDiffs.map((d: { description: string }) => d.description),
        agentVersion: item.result.agentVersion,
        changeSummary: `应用了 ${appliedCount}/${item.result.diffs.length} 个变更`,
        beforeSnapshot,
        afterSnapshot: cloneNodes(newComponents),
        timestamp: Date.now(),
      }
      auditRecords.value.unshift(audit)

      item.status = 'accepted'
      currentPreview.value = null
    }
  }

  /**
   * 拒绝建议
   */
  function reject(suggestionId: string, note?: string) {
    const item = suggestions.value.find((s) => s.result.id === suggestionId)
    if (!item) return

    // 记录审计日志
    const audit: AuditRecord = {
      id: nanoid(),
      suggestionId: item.result.id,
      prompt: item.result.request.prompt,
      action: 'rejected',
      agentVersion: item.result.agentVersion,
      changeSummary: '用户拒绝了此建议',
      beforeSnapshot: [],
      timestamp: Date.now(),
      note,
    }
    auditRecords.value.unshift(audit)

    item.status = 'rejected'
    currentPreview.value = null
  }

  /**
   * 回滚到指定审计记录
   */
  function rollback(auditId: string) {
    const componentStore = useComponent()
    const audit = auditRecords.value.find((a) => a.id === auditId)
    if (!audit || !audit.beforeSnapshot) return

    const beforeRollback = cloneNodes(componentStore.componentStore)

    // 恢复快照
    applyNodesToStore(audit.beforeSnapshot, componentStore)

    // 记录回滚操作
    const rollbackAudit: AuditRecord = {
      id: nanoid(),
      suggestionId: audit.suggestionId,
      prompt: `回滚: ${audit.prompt}`,
      action: 'rollback',
      agentVersion: audit.agentVersion,
      changeSummary: `回滚到 ${new Date(audit.timestamp).toLocaleString()} 的状态`,
      beforeSnapshot: beforeRollback,
      afterSnapshot: cloneNodes(audit.beforeSnapshot),
      timestamp: Date.now(),
    }
    auditRecords.value.unshift(rollbackAudit)
  }

  /**
   * 清空建议历史
   */
  function clearSuggestions() {
    suggestions.value = []
    currentPreview.value = null
  }

  /**
   * 导出审计日志
   */
  function exportAudit(): string {
    const data = {
      exportTime: new Date().toISOString(),
      totalRecords: auditRecords.value.length,
      records: auditRecords.value.map((r) => ({
        id: r.id,
        prompt: r.prompt,
        action: r.action,
        changeSummary: r.changeSummary,
        timestamp: new Date(r.timestamp).toISOString(),
        note: r.note,
      })),
    }
    return JSON.stringify(data, null, 2)
  }

  return {
    // 状态
    suggestions,
    auditRecords,
    isGenerating,
    currentPreview,

    // 计算属性
    pendingSuggestions,
    acceptedCount,
    rejectedCount,

    // 方法
    generate,
    preview,
    cancelPreview,
    accept,
    acceptPartial,
    reject,
    rollback,
    clearSuggestions,
    exportAudit,
  }
})
