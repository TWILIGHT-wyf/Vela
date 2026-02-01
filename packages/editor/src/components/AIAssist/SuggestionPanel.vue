<template>
  <div class="suggestion-panel">
    <div class="panel-header">
      <h3 class="panel-title">AI 建议助手</h3>
      <el-badge :value="pendingCount" :hidden="pendingCount === 0" type="primary">
        <el-button :icon="Refresh" circle size="small" @click="handleClearAll" />
      </el-badge>
    </div>

    <!-- 输入区域 -->
    <div class="input-section">
      <el-input
        v-model="prompt"
        type="textarea"
        :rows="3"
        placeholder="描述您的需求，例如: 添加双列 KPI、折线图和饼图..."
        :disabled="suggestionStore.isGenerating"
        @keydown.ctrl.enter="handleGenerate"
      />
      <el-button
        type="primary"
        :loading="suggestionStore.isGenerating"
        :disabled="!prompt.trim()"
        @click="handleGenerate"
      >
        <el-icon><MagicStick /></el-icon>
        生成建议
      </el-button>
    </div>

    <!-- 统计信息 -->
    <div v-if="suggestions.length > 0" class="stats-section">
      <el-statistic title="待处理" :value="pendingCount" />
      <el-statistic title="已接受" :value="suggestionStore.acceptedCount" />
      <el-statistic title="已拒绝" :value="suggestionStore.rejectedCount" />
    </div>

    <!-- 建议列表 -->
    <div class="suggestions-list">
      <el-empty v-if="suggestions.length === 0" description="暂无建议，输入需求后点击生成" />

      <div
        v-for="item in suggestions"
        :key="item.result.id"
        class="suggestion-item"
        :class="{ active: currentPreview?.id === item.result.id }"
      >
        <div class="item-header">
          <div class="item-info">
            <span class="item-prompt">{{ item.result.request.prompt }}</span>
            <el-tag :type="getStatusType(item.status)" size="small">
              {{ getStatusLabel(item.status) }}
            </el-tag>
          </div>
          <div class="item-meta">
            <span class="item-time">{{ formatTime(item.createdAt) }}</span>
            <el-tag v-if="!item.result.validated" type="danger" size="small">校验失败</el-tag>
            <el-tag v-else type="success" size="small">
              置信度 {{ ((item.result.confidence ?? 0) * 100).toFixed(0) }}%
            </el-tag>
          </div>
        </div>

        <div class="item-summary">
          {{ item.result.summary }} ({{ item.result.diffs.length }} 项变更)
        </div>

        <div
          v-if="item.result.validationErrors && item.result.validationErrors.length > 0"
          class="item-errors"
        >
          <el-alert type="error" :closable="false">
            <template #title>
              <div class="error-list">
                <div v-for="(err, idx) in item.result.validationErrors" :key="idx">{{ err }}</div>
              </div>
            </template>
          </el-alert>
        </div>

        <div v-if="item.status === 'pending'" class="item-actions">
          <el-button size="small" @click="handlePreview(item.result.id)">
            <el-icon><View /></el-icon>
            预览
          </el-button>
          <el-button
            size="small"
            type="primary"
            :disabled="!item.result.validated"
            @click="handleAccept(item.result.id)"
          >
            <el-icon><Check /></el-icon>
            全部接受
          </el-button>
          <el-button size="small" @click="handleReject(item.result.id)">
            <el-icon><Close /></el-icon>
            拒绝
          </el-button>
        </div>

        <div v-else-if="item.status === 'previewing'" class="item-preview">
          <div class="preview-header">
            <span>预览变更</span>
            <el-button size="small" text @click="handleCancelPreview">取消预览</el-button>
          </div>
          <div class="diffs-container">
            <DiffViewer
              v-for="(diff, idx) in item.result.diffs"
              :key="idx"
              :diff="toDiffItem(diff)"
              :selectable="true"
              :default-selected="true"
              @select-change="(val) => handleDiffSelect(idx, val)"
            />
          </div>
          <div class="preview-actions">
            <el-button type="primary" @click="handleApplySelected(item.result.id)">
              <el-icon><Check /></el-icon>
              应用选中 ({{ selectedDiffs.length }}/{{ item.result.diffs.length }})
            </el-button>
            <el-button @click="handleCancelPreview">取消</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MagicStick, View, Check, Close, Refresh } from '@element-plus/icons-vue'
import { useSuggestion } from '@/stores/suggestion'
import type { SuggestionStatus, SuggestionDiff, DiffItem } from '@vela/core/types/suggestion'
import DiffViewer from './DiffViewer.vue'

/**
 * Transform SuggestionDiff to DiffItem for DiffViewer component
 */
function toDiffItem(suggestionDiff: SuggestionDiff): DiffItem {
  return {
    action: suggestionDiff.type,
    componentType: suggestionDiff.newComponent?.componentName || suggestionDiff.after?.componentName || 'Unknown',
    componentId: suggestionDiff.targetId,
    description: suggestionDiff.description,
    component: suggestionDiff.newComponent,
    oldValue: suggestionDiff.before,
    newValue: suggestionDiff.after,
  }
}

const suggestionStore = useSuggestion()

const prompt = ref('')
const selectedDiffs = ref<number[]>([])

const suggestions = computed(() => suggestionStore.suggestions)
const currentPreview = computed(() => suggestionStore.currentPreview)
const pendingCount = computed(() => suggestionStore.pendingSuggestions.length)

async function handleGenerate() {
  if (!prompt.value.trim()) return

  try {
    await suggestionStore.generate(prompt.value)
    ElMessage.success('建议生成成功')
    prompt.value = ''
  } catch (error) {
    ElMessage.error('生成建议失败: ' + (error as Error).message)
  }
}

function handlePreview(suggestionId: string) {
  suggestionStore.preview(suggestionId)
  // 默认全选
  const item = suggestions.value.find((s) => s.result.id === suggestionId)
  if (item) {
    selectedDiffs.value = Array.from({ length: item.result.diffs.length }, (_, i) => i)
  }
}

function handleCancelPreview() {
  suggestionStore.cancelPreview()
  selectedDiffs.value = []
}

function handleAccept(suggestionId: string) {
  suggestionStore.accept(suggestionId)
  ElMessage.success('已应用所有变更')
}

async function handleReject(suggestionId: string) {
  try {
    const { value } = await ElMessageBox.prompt('请输入拒绝原因（可选）', '拒绝建议', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputType: 'textarea',
    })
    suggestionStore.reject(suggestionId, value || undefined)
    ElMessage.info('已拒绝此建议')
  } catch {
    // 用户取消
  }
}

function handleApplySelected(suggestionId: string) {
  if (selectedDiffs.value.length === 0) {
    ElMessage.warning('请至少选择一个变更')
    return
  }
  suggestionStore.acceptPartial(suggestionId, selectedDiffs.value)
  ElMessage.success(`已应用 ${selectedDiffs.value.length} 项变更`)
  selectedDiffs.value = []
}

function handleDiffSelect(index: number, selected: boolean) {
  if (selected) {
    if (!selectedDiffs.value.includes(index)) {
      selectedDiffs.value.push(index)
    }
  } else {
    selectedDiffs.value = selectedDiffs.value.filter((i) => i !== index)
  }
}

async function handleClearAll() {
  try {
    await ElMessageBox.confirm('确定要清空所有建议历史吗？', '清空历史', {
      type: 'warning',
    })
    suggestionStore.clearSuggestions()
    ElMessage.success('已清空历史')
  } catch {
    // 用户取消
  }
}

function getStatusType(status: SuggestionStatus): 'info' | 'warning' | 'success' | 'danger' {
  const map: Record<SuggestionStatus, 'info' | 'warning' | 'success' | 'danger'> = {
    pending: 'info',
    previewing: 'warning',
    accepted: 'success',
    rejected: 'danger',
  }
  return map[status]
}

function getStatusLabel(status: SuggestionStatus): string {
  const map: Record<SuggestionStatus, string> = {
    pending: '待处理',
    previewing: '预览中',
    accepted: '已接受',
    rejected: '已拒绝',
  }
  return map[status]
}

function formatTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  return new Date(timestamp).toLocaleDateString()
}
</script>

<style scoped>
.suggestion-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: var(--el-bg-color);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--el-border-color);
}

.panel-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.stats-section {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
}

.suggestions-list {
  flex: 1;
  overflow-y: auto;
}

.suggestion-item {
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  background: var(--el-bg-color);
  transition: all 0.3s;
}

.suggestion-item:hover {
  box-shadow: var(--el-box-shadow-light);
}

.suggestion-item.active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.item-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.item-prompt {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.item-summary {
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.item-errors {
  margin-bottom: 12px;
}

.error-list {
  font-size: 13px;
}

.item-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.item-preview {
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.diffs-container {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 12px;
}

.preview-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>
