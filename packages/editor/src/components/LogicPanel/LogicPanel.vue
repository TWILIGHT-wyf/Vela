<template>
  <div class="logic-panel-root" data-testid="logic-panel">
    <el-tabs v-model="activeTab" class="logic-tabs" stretch>
      <el-tab-pane label="动作" name="actions">
        <div class="actions-pane">
          <div class="actions-toolbar">
            <el-radio-group v-model="actionScope" size="small" @change="handleScopeChange">
              <el-radio-button label="page">页面动作</el-radio-button>
              <el-radio-button label="global">全局动作</el-radio-button>
            </el-radio-group>
            <el-button type="primary" size="small" :icon="Plus" @click="addAction(actionScope)">
              新增动作
            </el-button>
          </div>

          <div class="actions-body">
            <div class="action-list">
              <el-empty
                v-if="scopedActions.length === 0"
                description="当前分组暂无动作"
                :image-size="52"
              />
              <div v-else class="action-list-inner">
                <div
                  v-for="(action, index) in scopedActions"
                  :key="`logic-${actionScope}-${index}`"
                  class="action-list-item"
                  :class="{ active: index === selectedActionIndex }"
                  @click="selectedActionIndex = index"
                >
                  <div class="action-list-main">
                    <div class="action-list-id">{{ action.id || '(未命名动作)' }}</div>
                    <div class="action-list-meta">
                      <el-tag size="small">{{ action.type }}</el-tag>
                      <span class="action-order">#{{ index + 1 }}</span>
                    </div>
                  </div>
                  <el-button
                    type="danger"
                    size="small"
                    :icon="Delete"
                    circle
                    @click.stop="removeAction(actionScope, index)"
                  />
                </div>
              </div>
            </div>

            <div class="action-editor">
              <el-empty
                v-if="!selectedAction"
                description="请选择左侧动作进行编辑"
                :image-size="72"
              />
              <el-form v-else label-position="top" size="small" class="action-editor-form">
                <el-form-item label="动作 ID">
                  <el-input
                    :model-value="selectedAction.id"
                    @update:model-value="setActionId(actionScope, selectedActionIndex, $event)"
                  />
                </el-form-item>
                <el-form-item label="动作类型">
                  <el-select
                    :model-value="selectedAction.type"
                    @change="setActionType(actionScope, selectedActionIndex, $event as string)"
                  >
                    <el-option
                      v-for="option in actionTypeOptions"
                      :key="`option-${option.value}`"
                      :label="option.label"
                      :value="option.value"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item label="payload(JSON)">
                  <el-input
                    :model-value="formatJson(asRecord(selectedAction).payload)"
                    type="textarea"
                    :rows="4"
                    @change="setActionPayload(actionScope, selectedActionIndex, $event)"
                  />
                </el-form-item>
                <el-form-item label="handlers(JSON)">
                  <el-input
                    :model-value="formatJson(asRecord(selectedAction).handlers)"
                    type="textarea"
                    :rows="4"
                    placeholder='{"success":"a1","fail":"a2"}'
                    @change="
                      setActionJsonField(actionScope, selectedActionIndex, 'handlers', $event)
                    "
                  />
                </el-form-item>
                <el-form-item label="next(JSON: string/ref)">
                  <el-input
                    :model-value="formatJson(asRecord(selectedAction).next)"
                    type="textarea"
                    :rows="3"
                    placeholder='"next_action" 或 {"type":"ref","scope":"page","id":"x"}'
                    @change="setActionJsonField(actionScope, selectedActionIndex, 'next', $event)"
                  />
                </el-form-item>
                <div class="flow-grid">
                  <el-form-item label="延迟(ms)">
                    <el-input-number
                      :model-value="toNumber(asRecord(selectedAction).delay)"
                      :min="0"
                      :step="50"
                      controls-position="right"
                      @change="
                        setActionTopLevelField(actionScope, selectedActionIndex, 'delay', $event)
                      "
                    />
                  </el-form-item>
                  <el-form-item label="防抖(ms)">
                    <el-input-number
                      :model-value="toNumber(asRecord(selectedAction).debounce)"
                      :min="0"
                      :step="50"
                      controls-position="right"
                      @change="
                        setActionTopLevelField(actionScope, selectedActionIndex, 'debounce', $event)
                      "
                    />
                  </el-form-item>
                  <el-form-item label="节流(ms)">
                    <el-input-number
                      :model-value="toNumber(asRecord(selectedAction).throttle)"
                      :min="0"
                      :step="50"
                      controls-position="right"
                      @change="
                        setActionTopLevelField(actionScope, selectedActionIndex, 'throttle', $event)
                      "
                    />
                  </el-form-item>
                </div>
                <el-form-item label="执行条件表达式">
                  <el-input
                    :model-value="getConditionExpression(selectedAction)"
                    placeholder="例如: state.count > 0"
                    @update:model-value="
                      setActionConditionExpression(actionScope, selectedActionIndex, $event)
                    "
                  />
                </el-form-item>
                <el-form-item label="确认提示文本(为空则不确认)">
                  <el-input
                    :model-value="getConfirmMessage(selectedAction)"
                    @update:model-value="
                      setActionConfirmMessage(actionScope, selectedActionIndex, $event)
                    "
                  />
                </el-form-item>
                <el-form-item label="调试日志(log)">
                  <el-switch
                    :model-value="Boolean(asRecord(selectedAction).log)"
                    @change="setActionLog(actionScope, selectedActionIndex, $event)"
                  />
                </el-form-item>
                <el-form-item label="额外字段(JSON)">
                  <el-input
                    :model-value="formatJson(getActionExtraFields(selectedAction))"
                    type="textarea"
                    :rows="3"
                    @change="setActionExtraFields(actionScope, selectedActionIndex, $event)"
                  />
                </el-form-item>
              </el-form>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="事件" name="events">
        <div class="events-pane">
          <EventPane v-if="selectedComponent && !isPageNode" :node="selectedComponent" />
          <el-empty
            v-else
            description="请先选中画布中的组件，再在这里配置组件事件"
            :image-size="64"
          />
        </div>
      </el-tab-pane>

      <el-tab-pane label="状态" name="state">
        <div class="placeholder-pane">
          <el-empty description="状态管理面板建设中，将在后续迭代提供" :image-size="64" />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import { storeToRefs } from 'pinia'
import { useProjectStore } from '@/stores/project'
import { useComponent } from '@/stores/component'
import EventPane from '@/components/SetterPanel/panes/EventPane.vue'
import type { ActionSchema, AnyActionSchema } from '@vela/core/types/action'
import { ACTION_TYPE_OPTIONS } from '@/constants/action-types'

type ActionScope = 'page' | 'global'
type JsonFieldKey = 'payload' | 'handlers' | 'next'

const activeTab = ref('actions')
const actionScope = ref<ActionScope>('page')
const selectedActionIndex = ref(-1)
const actionTypeOptions = ACTION_TYPE_OPTIONS

const projectStore = useProjectStore()
const componentStore = useComponent()
const { currentPage } = storeToRefs(projectStore)

const selectedComponent = computed(() => componentStore.selectedNode)
const isPageNode = computed(() => {
  if (!selectedComponent.value) return true
  const name = selectedComponent.value.component || selectedComponent.value.componentName
  return name === 'Page'
})

function asRecord(value: unknown): Record<string, unknown> {
  return (value as Record<string, unknown>) || {}
}

function toString(value: unknown): string {
  if (typeof value === 'string') return value
  if (value === undefined || value === null) return ''
  return String(value)
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  return undefined
}

function cloneActions(actions: ActionSchema<string>[]): ActionSchema<string>[] {
  return JSON.parse(JSON.stringify(actions))
}

function normalizeActions(actions: unknown): ActionSchema<string>[] {
  if (!Array.isArray(actions)) return []
  return actions.filter((action): action is ActionSchema<string> => {
    return (
      typeof action === 'object' &&
      action !== null &&
      typeof (action as { id?: unknown }).id === 'string' &&
      typeof (action as { type?: unknown }).type === 'string'
    )
  })
}

function parseJson(input: unknown): { ok: true; value: unknown } | { ok: false } {
  const text = toString(input).trim()
  if (!text) return { ok: true, value: undefined }
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch {
    ElMessage.error('JSON 格式错误')
    return { ok: false }
  }
}

function formatJson(value: unknown): string {
  if (value === undefined) return ''
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return ''
  }
}

function getActions(scope: ActionScope): ActionSchema<string>[] {
  if (scope === 'page') return normalizeActions(currentPage.value?.actions)
  return normalizeActions(projectStore.project.logic?.actions)
}

function setActions(scope: ActionScope, actions: ActionSchema<string>[]) {
  if (scope === 'page') {
    if (!currentPage.value) return
    currentPage.value.actions = actions as AnyActionSchema[]
  } else {
    if (!projectStore.project.logic) projectStore.project.logic = {}
    projectStore.project.logic.actions = actions as AnyActionSchema[]
  }
  projectStore.saveStatus = 'unsaved'
}

function updateActionAt(
  scope: ActionScope,
  index: number,
  updater: (action: ActionSchema<string>) => void,
) {
  const actions = cloneActions(getActions(scope))
  if (index < 0 || index >= actions.length) return
  updater(actions[index])
  setActions(scope, actions)
}

const scopedActions = computed(() => getActions(actionScope.value))
const selectedAction = computed(() => {
  const actions = scopedActions.value
  if (selectedActionIndex.value < 0 || selectedActionIndex.value >= actions.length) return null
  return actions[selectedActionIndex.value]
})

function ensureSelection() {
  const actions = scopedActions.value
  if (actions.length === 0) {
    selectedActionIndex.value = -1
    return
  }
  if (selectedActionIndex.value < 0 || selectedActionIndex.value >= actions.length) {
    selectedActionIndex.value = 0
  }
}

function handleScopeChange(scope: string | number | boolean) {
  actionScope.value = scope === 'global' ? 'global' : 'page'
  ensureSelection()
}

function createDefaultAction(idPrefix: string): ActionSchema<string> {
  return {
    id: `${idPrefix}_${Date.now().toString(36)}`,
    type: 'showToast',
    payload: {
      message: 'hello',
      type: 'info',
    },
  }
}

function addAction(scope: ActionScope) {
  const actions = cloneActions(getActions(scope))
  actions.push(createDefaultAction(scope === 'page' ? 'page_action' : 'global_action'))
  setActions(scope, actions)
  actionScope.value = scope
  selectedActionIndex.value = actions.length - 1
}

function removeAction(scope: ActionScope, index: number) {
  const actions = cloneActions(getActions(scope))
  if (index < 0 || index >= actions.length) return
  actions.splice(index, 1)
  setActions(scope, actions)

  if (actionScope.value !== scope) return
  if (actions.length === 0) {
    selectedActionIndex.value = -1
    return
  }
  if (selectedActionIndex.value >= actions.length) {
    selectedActionIndex.value = actions.length - 1
  }
}

function setActionId(scope: ActionScope, index: number, value: unknown) {
  updateActionAt(scope, index, (action) => {
    action.id = toString(value).trim()
  })
}

function setActionType(scope: ActionScope, index: number, value: string) {
  updateActionAt(scope, index, (action) => {
    action.type = value
  })
}

function setActionPayload(scope: ActionScope, index: number, value: unknown) {
  setActionJsonField(scope, index, 'payload', value)
}

function setActionJsonField(scope: ActionScope, index: number, key: JsonFieldKey, value: unknown) {
  const parsed = parseJson(value)
  if (!parsed.ok) return
  updateActionAt(scope, index, (action) => {
    const record = asRecord(action)
    if (parsed.value === undefined) {
      delete record[key]
      return
    }
    record[key] = parsed.value
  })
}

function setActionTopLevelField(
  scope: ActionScope,
  index: number,
  key: 'delay' | 'debounce' | 'throttle',
  value: unknown,
) {
  updateActionAt(scope, index, (action) => {
    const record = asRecord(action)
    const nextValue = toNumber(value)
    if (nextValue === undefined || nextValue <= 0) {
      delete record[key]
      return
    }
    record[key] = nextValue
  })
}

function getConditionExpression(action: ActionSchema<string>): string {
  const condition = asRecord(action).condition
  if (condition && typeof condition === 'object') {
    const expr = (condition as Record<string, unknown>).value
    return toString(expr)
  }
  return ''
}

function setActionConditionExpression(scope: ActionScope, index: number, value: unknown) {
  const text = toString(value).trim()
  updateActionAt(scope, index, (action) => {
    const record = asRecord(action)
    if (!text) {
      delete record.condition
      return
    }
    record.condition = { type: 'expression', value: text }
  })
}

function getConfirmMessage(action: ActionSchema<string>): string {
  const confirm = asRecord(action).confirm
  if (!confirm || typeof confirm !== 'object') return ''
  return toString((confirm as Record<string, unknown>).message)
}

function setActionConfirmMessage(scope: ActionScope, index: number, value: unknown) {
  const text = toString(value).trim()
  updateActionAt(scope, index, (action) => {
    const record = asRecord(action)
    if (!text) {
      delete record.confirm
      return
    }
    record.confirm = { message: text }
  })
}

function setActionLog(scope: ActionScope, index: number, value: unknown) {
  updateActionAt(scope, index, (action) => {
    const record = asRecord(action)
    if (!value) {
      delete record.log
      return
    }
    record.log = Boolean(value)
  })
}

function getActionExtraFields(action: ActionSchema<string>): Record<string, unknown> {
  const reserved = new Set([
    'id',
    'type',
    'name',
    'description',
    'group',
    'payload',
    'handlers',
    'condition',
    'delay',
    'debounce',
    'throttle',
    'confirm',
    'next',
    'log',
  ])
  const output: Record<string, unknown> = {}
  for (const [key, fieldValue] of Object.entries(asRecord(action))) {
    if (!reserved.has(key)) output[key] = fieldValue
  }
  return output
}

function setActionExtraFields(scope: ActionScope, index: number, value: unknown) {
  const parsed = parseJson(value)
  if (!parsed.ok) return
  updateActionAt(scope, index, (action) => {
    const reserved = new Set([
      'id',
      'type',
      'name',
      'description',
      'group',
      'payload',
      'handlers',
      'condition',
      'delay',
      'debounce',
      'throttle',
      'confirm',
      'next',
      'log',
    ])
    const record = asRecord(action)
    for (const key of Object.keys(record)) {
      if (!reserved.has(key)) delete record[key]
    }
    if (!parsed.value || typeof parsed.value !== 'object') return
    for (const [key, fieldValue] of Object.entries(parsed.value as Record<string, unknown>)) {
      if (!reserved.has(key)) record[key] = fieldValue
    }
  })
}

watch(scopedActions, () => {
  ensureSelection()
})

watch(actionScope, () => {
  ensureSelection()
})
</script>

<style scoped>
.logic-panel-root {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.logic-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.logic-tabs :deep(.el-tabs__header) {
  margin: 0;
  padding: 0 10px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--el-border-color-light);
}

.logic-tabs :deep(.el-tabs__content) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.logic-tabs :deep(.el-tab-pane) {
  height: 100%;
}

.actions-pane {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 12px;
  gap: 12px;
}

.actions-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
}

.actions-body {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 12px;
}

.action-list {
  width: 280px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  overflow-y: auto;
  background: var(--el-fill-color-blank);
}

.action-list-inner {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-fill-color-light);
  padding: 8px 10px;
  cursor: pointer;
}

.action-list-item.active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.action-list-main {
  min-width: 0;
  flex: 1;
}

.action-list-id {
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
  font-size: 12px;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.action-list-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-order {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.action-editor {
  flex: 1;
  min-width: 0;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  background: var(--el-fill-color-blank);
  padding: 12px;
  overflow-y: auto;
}

.action-editor-form :deep(.el-input-number) {
  width: 100%;
}

.flow-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.flow-grid :deep(.el-input-number) {
  width: 100%;
}

.events-pane,
.placeholder-pane {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

@media (max-width: 1200px) {
  .actions-body {
    flex-direction: column;
  }

  .action-list {
    width: 100%;
    max-height: 240px;
  }
}
</style>
