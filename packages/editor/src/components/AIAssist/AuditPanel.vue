<template>
  <div class="audit-panel">
    <div class="panel-header">
      <h3 class="panel-title">审计日志</h3>
      <div class="header-actions">
        <el-button :icon="Download" size="small" @click="handleExport">导出</el-button>
      </div>
    </div>

    <div class="audit-stats">
      <el-statistic title="总记录数" :value="auditRecords.length" />
      <el-statistic title="今日操作" :value="todayCount" />
    </div>

    <div class="records-list">
      <el-empty v-if="auditRecords.length === 0" description="暂无审计记录" />

      <el-timeline v-else>
        <el-timeline-item
          v-for="record in auditRecords"
          :key="record.id"
          :timestamp="formatTimestamp(record.timestamp)"
          placement="top"
        >
          <el-card>
            <div class="record-header">
              <el-tag :type="getActionType(record.action)">
                {{ getActionLabel(record.action) }}
              </el-tag>
              <span class="record-prompt">{{ record.prompt }}</span>
            </div>

            <div class="record-body">
              <div class="record-row">
                <span class="label">变更摘要:</span>
                <span class="value">{{ record.changeSummary }}</span>
              </div>

              <div v-if="record.appliedDiffs && record.appliedDiffs.length > 0" class="record-row">
                <span class="label">应用变更:</span>
                <div class="diffs-tags">
                  <el-tag
                    v-for="(diff, idx) in record.appliedDiffs"
                    :key="idx"
                    size="small"
                    type="info"
                  >
                    {{ diff }}
                  </el-tag>
                </div>
              </div>

              <div class="record-row">
                <span class="label">Agent 版本:</span>
                <span class="value">{{ record.agentVersion }}</span>
              </div>

              <div v-if="record.note" class="record-row">
                <span class="label">备注:</span>
                <span class="value note">{{ record.note }}</span>
              </div>
            </div>

            <div
              v-if="record.action !== 'rejected' && record.beforeSnapshot"
              class="record-actions"
            >
              <el-button size="small" type="warning" @click="handleRollback(record.id)">
                <el-icon><RefreshLeft /></el-icon>
                回滚到此状态
              </el-button>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Download, RefreshLeft } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useSuggestion } from '@/stores/suggestion'
import type { AuditRecord } from '@/types/suggestion'

const suggestionStore = useSuggestion()

const auditRecords = computed(() => suggestionStore.auditRecords)

const todayCount = computed(() => {
  const today = new Date().setHours(0, 0, 0, 0)
  return auditRecords.value.filter((r) => r.timestamp >= today).length
})

function getActionType(action: AuditRecord['action']): 'success' | 'warning' | 'info' | 'danger' {
  const map: Record<AuditRecord['action'], 'success' | 'warning' | 'info' | 'danger'> = {
    accepted: 'success',
    partial: 'info',
    rejected: 'danger',
    rollback: 'warning',
  }
  return map[action]
}

function getActionLabel(action: AuditRecord['action']): string {
  const map: Record<AuditRecord['action'], string> = {
    accepted: '全部接受',
    partial: '部分接受',
    rejected: '拒绝',
    rollback: '回滚',
  }
  return map[action]
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

async function handleRollback(auditId: string) {
  try {
    await ElMessageBox.confirm('确定要回滚到此状态吗？这将撤销之后的所有变更。', '确认回滚', {
      type: 'warning',
      confirmButtonText: '确定回滚',
      cancelButtonText: '取消',
    })
    suggestionStore.rollback(auditId)
    ElMessage.success('已回滚到指定状态')
  } catch {
    // 用户取消
  }
}

async function handleExport() {
  try {
    const data = suggestionStore.exportAudit()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `audit-log-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
    ElMessage.success('审计日志已导出')
  } catch (error) {
    ElMessage.error('导出失败: ' + (error as Error).message)
  }
}
</script>

<style scoped>
.audit-panel {
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

.header-actions {
  display: flex;
  gap: 8px;
}

.audit-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
}

.records-list {
  flex: 1;
  overflow-y: auto;
}

.record-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.record-prompt {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.record-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.record-row {
  display: flex;
  gap: 8px;
  font-size: 13px;
}

.label {
  color: var(--el-text-color-secondary);
  min-width: 80px;
  flex-shrink: 0;
}

.value {
  color: var(--el-text-color-primary);
  flex: 1;
}

.value.note {
  font-style: italic;
  color: var(--el-text-color-secondary);
}

.diffs-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.record-actions {
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}
</style>
