<template>
  <div class="diff-viewer">
    <div class="diff-header">
      <span class="diff-title">变更预览</span>
      <el-tag :type="getActionType(diff.action)" size="small">{{
        getActionLabel(diff.action)
      }}</el-tag>
    </div>

    <div class="diff-body">
      <div class="diff-component-info">
        <el-icon><Files /></el-icon>
        <span class="component-type">{{ diff.componentType }}</span>
        <span class="component-desc">{{ diff.description }}</span>
      </div>

      <div v-if="diff.action === 'add' && diff.component" class="diff-details add">
        <div class="detail-section">
          <div class="section-title">新增组件</div>
          <div class="property-grid">
            <div class="property-item">
              <span class="prop-label">名称:</span>
              <span class="prop-value highlight-new">{{ diff.component.title || diff.component.componentName }}</span>
            </div>
            <div class="property-item">
              <span class="prop-label">位置:</span>
              <span class="prop-value highlight-new">
                x:{{ diff.component.style?.x }}, y:{{ diff.component.style?.y }}
              </span>
            </div>
            <div class="property-item">
              <span class="prop-label">尺寸:</span>
              <span class="prop-value highlight-new">
                {{ diff.component.style?.width }} × {{ diff.component.style?.height }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="diff.action === 'modify'" class="diff-details modify">
        <div class="detail-section">
          <div class="section-title">属性变更: {{ diff.path }}</div>
          <div class="value-comparison">
            <div class="old-value">
              <span class="label">旧值:</span>
              <code class="highlight-old">{{ formatValue(diff.oldValue) }}</code>
            </div>
            <el-icon class="arrow"><Right /></el-icon>
            <div class="new-value">
              <span class="label">新值:</span>
              <code class="highlight-new">{{ formatValue(diff.newValue) }}</code>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="diff.action === 'delete'" class="diff-details delete">
        <div class="detail-section">
          <div class="section-title">删除组件</div>
          <div class="warning-message">
            <el-icon><WarningFilled /></el-icon>
            <span>此操作将删除组件 ID: {{ diff.componentId }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectable" class="diff-footer">
      <el-checkbox v-model="selected" @change="(val: unknown) => handleSelectChange(!!val)">
        应用此变更
      </el-checkbox>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Files, Right, WarningFilled } from '@element-plus/icons-vue'
import type { DiffItem, DiffActionType } from '@/types/suggestion'

interface Props {
  diff: DiffItem
  selectable?: boolean
  defaultSelected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selectable: false,
  defaultSelected: true,
})

const emit = defineEmits<{
  (e: 'selectChange', value: boolean): void
}>()

const selected = ref(props.defaultSelected)

function getActionType(action: DiffActionType): 'success' | 'warning' | 'danger' {
  const map: Record<DiffActionType, 'success' | 'warning' | 'danger'> = {
    add: 'success',
    modify: 'warning',
    delete: 'danger',
  }
  return map[action]
}

function getActionLabel(action: DiffActionType): string {
  const map: Record<DiffActionType, string> = {
    add: '新增',
    modify: '修改',
    delete: '删除',
  }
  return map[action]
}

function formatValue(value: unknown): string {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }
  return String(value)
}

function handleSelectChange(val: boolean) {
  emit('selectChange', val)
}
</script>

<style scoped>
.diff-viewer {
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  padding: 16px;
  background: var(--el-bg-color);
  margin-bottom: 12px;
  transition: all 0.3s;
}

.diff-viewer:hover {
  box-shadow: var(--el-box-shadow-light);
}

.diff-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.diff-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.diff-body {
  margin-bottom: 12px;
}

.diff-component-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
}

.component-type {
  font-weight: 600;
  color: var(--el-color-primary);
}

.component-desc {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.diff-details {
  padding: 12px;
  border-radius: 4px;
}

.diff-details.add {
  background: var(--el-color-success-light-9);
  border: 1px solid var(--el-color-success-light-5);
}

.diff-details.modify {
  background: var(--el-color-warning-light-9);
  border: 1px solid var(--el-color-warning-light-5);
}

.diff-details.delete {
  background: var(--el-color-danger-light-9);
  border: 1px solid var(--el-color-danger-light-5);
}

.detail-section {
  margin-bottom: 8px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-weight: 600;
  font-size: 13px;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
}

.property-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.property-item {
  display: flex;
  gap: 8px;
  font-size: 13px;
}

.prop-label {
  color: var(--el-text-color-secondary);
  min-width: 50px;
}

.prop-value {
  color: var(--el-text-color-primary);
  font-family: 'Consolas', 'Monaco', monospace;
}

.highlight-new {
  background: var(--el-color-success-light-9);
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 500;
}

.highlight-old {
  background: var(--el-color-danger-light-9);
  padding: 2px 6px;
  border-radius: 3px;
  text-decoration: line-through;
}

.value-comparison {
  display: flex;
  align-items: center;
  gap: 12px;
}

.old-value,
.new-value {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

code {
  display: block;
  padding: 8px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}

.arrow {
  color: var(--el-text-color-placeholder);
  font-size: 20px;
}

.warning-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: var(--el-color-danger-light-9);
  border-radius: 4px;
  color: var(--el-color-danger);
}

.diff-footer {
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}
</style>
