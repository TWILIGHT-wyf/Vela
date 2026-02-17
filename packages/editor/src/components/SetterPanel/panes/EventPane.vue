<template>
  <div class="event-pane" data-testid="events-panel">
    <el-empty v-if="!node" description="请选择一个组件" :image-size="80">
      <template #image>
        <el-icon :size="64"><Select /></el-icon>
      </template>
    </el-empty>

    <div v-else class="event-content">
      <el-scrollbar class="event-scrollbar">
        <div class="event-list">
          <div class="event-section">
            <div class="section-header">
              <span>点击事件</span>
              <el-button
                type="primary"
                size="small"
                :icon="Plus"
                @click="addClickAction"
                data-testid="add-click-event"
                circle
              />
            </div>

            <el-empty v-if="clickActions.length === 0" description="暂无事件" :image-size="40" />

            <div v-else class="action-list">
              <div
                v-for="(action, index) in clickActions"
                :key="action.id || index"
                class="action-item action-card"
              >
                <div class="action-header">
                  <el-select
                    v-model="action.type"
                    placeholder="选择动作类型"
                    size="small"
                    @change="onActionTypeChange(action)"
                  >
                    <el-option label="弹窗提示" value="alert" />
                    <el-option label="打开链接" value="openUrl" />
                    <el-option label="页面跳转" value="navigate" />
                    <el-option label="更新状态" value="updateState" />
                    <el-option label="自定义脚本" value="customScript" />
                  </el-select>
                  <el-button
                    type="danger"
                    size="small"
                    :icon="Delete"
                    circle
                    @click="removeClickAction(index)"
                  />
                </div>

                <el-form-item v-if="action.type === 'alert'" label="提示内容" size="small">
                  <el-input
                    :model-value="getActionMessage(action)"
                    @update:model-value="setActionMessage(action, $event as string)"
                    placeholder="请输入提示内容"
                  />
                </el-form-item>

                <el-form-item v-if="action.type === 'openUrl'" label="URL" size="small">
                  <el-input
                    :model-value="getActionUrl(action)"
                    @update:model-value="setActionUrl(action, $event as string)"
                    placeholder="https://..."
                  />
                </el-form-item>

                <el-form-item v-if="action.type === 'navigate'" label="路径" size="small">
                  <el-input
                    :model-value="getActionPath(action)"
                    @update:model-value="setActionPath(action, $event as string)"
                    placeholder="/path"
                  />
                </el-form-item>

                <el-form-item v-if="action.type === 'customScript'" label="脚本代码" size="small">
                  <el-input
                    :model-value="getActionContent(action)"
                    @update:model-value="setActionContent(action, $event as string)"
                    type="textarea"
                    :rows="4"
                    placeholder="输入 JavaScript 代码"
                  />
                </el-form-item>
              </div>
            </div>
          </div>

          <div class="event-section">
            <div class="section-header">
              <span>悬停事件</span>
              <el-button type="primary" size="small" :icon="Plus" @click="addHoverAction" circle />
            </div>

            <el-empty v-if="hoverActions.length === 0" description="暂无事件" :image-size="40" />

            <div v-else class="action-list">
              <div
                v-for="(action, index) in hoverActions"
                :key="action.id || index"
                class="action-item action-card"
              >
                <div class="action-header">
                  <el-select
                    v-model="action.type"
                    placeholder="选择动作类型"
                    size="small"
                    @change="onActionTypeChange(action)"
                  >
                    <el-option label="弹窗提示" value="alert" />
                    <el-option label="打开链接" value="openUrl" />
                    <el-option label="页面跳转" value="navigate" />
                    <el-option label="更新状态" value="updateState" />
                    <el-option label="自定义脚本" value="customScript" />
                  </el-select>
                  <el-button
                    type="danger"
                    size="small"
                    :icon="Delete"
                    circle
                    @click="removeHoverAction(index)"
                  />
                </div>

                <el-form-item v-if="action.type === 'alert'" label="提示内容" size="small">
                  <el-input
                    :model-value="getActionMessage(action)"
                    @update:model-value="setActionMessage(action, $event as string)"
                    placeholder="请输入提示内容"
                  />
                </el-form-item>

                <el-form-item v-if="action.type === 'openUrl'" label="URL" size="small">
                  <el-input
                    :model-value="getActionUrl(action)"
                    @update:model-value="setActionUrl(action, $event as string)"
                    placeholder="https://..."
                  />
                </el-form-item>

                <el-form-item v-if="action.type === 'navigate'" label="路径" size="small">
                  <el-input
                    :model-value="getActionPath(action)"
                    @update:model-value="setActionPath(action, $event as string)"
                    placeholder="/path"
                  />
                </el-form-item>

                <el-form-item v-if="action.type === 'customScript'" label="脚本代码" size="small">
                  <el-input
                    :model-value="getActionContent(action)"
                    @update:model-value="setActionContent(action, $event as string)"
                    type="textarea"
                    :rows="4"
                    placeholder="输入 JavaScript 代码"
                  />
                </el-form-item>
              </div>
            </div>
          </div>
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEventConfiguration } from '../composables/useEvents'
import type { NodeSchema } from '@vela/core'
import type { ActionSchema } from '@vela/core/types/action'
import { Plus, Delete, Select } from '@element-plus/icons-vue'

type EditableAction = ActionSchema<string> & {
  content?: string
  blank?: boolean
  stateName?: string
}

interface Props {
  node?: NodeSchema | null
}

defineProps<Props>()

const {
  clickActions,
  hoverActions,
  addClickAction,
  removeClickAction,
  addHoverAction,
  removeHoverAction,
} = useEventConfiguration()

function onActionTypeChange(action: EditableAction) {
  if (action.type !== 'customScript') {
    delete action.content
  }
}

// Type-safe getters for action properties
function getActionPath(action: EditableAction): string {
  return action.path || ''
}

function setActionPath(action: EditableAction, value: string) {
  action.path = value
}

function getActionUrl(action: EditableAction): string {
  return action.url || ''
}

function setActionUrl(action: EditableAction, value: string) {
  action.url = value
}

function getActionMessage(action: EditableAction): string {
  return action.message || ''
}

function setActionMessage(action: EditableAction, value: string) {
  action.message = value
}

function getActionContent(action: EditableAction): string {
  return action.content || ''
}

function setActionContent(action: EditableAction, value: string) {
  action.content = value
}
</script>

<style scoped>
.event-pane {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.event-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.event-scrollbar {
  flex: 1;
  height: 100%;
}

.event-list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.event-section {
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-light);
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.action-list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-item {
  background: white;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  padding: 12px;
}

.action-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.action-header .el-select {
  flex: 1;
}

.action-item :deep(.el-form-item) {
  margin-bottom: 12px;
}

.action-item :deep(.el-form-item__label) {
  font-size: 12px;
  font-weight: 500;
}

.action-item :deep(.el-form-item__content) {
  width: 100%;
}
</style>
