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
              <span>节点动作注册 (node.actions)</span>
              <el-button type="primary" size="small" :icon="Plus" @click="addNodeAction" circle />
            </div>

            <el-empty v-if="nodeActions.length === 0" description="暂无节点动作" :image-size="40" />

            <div v-else class="action-list">
              <div
                v-for="(action, index) in nodeActions"
                :key="`node-action-${index}`"
                class="action-item"
              >
                <div class="action-header">
                  <el-tag size="small" type="info">#{{ index + 1 }}</el-tag>
                  <el-button
                    type="danger"
                    size="small"
                    :icon="Delete"
                    circle
                    @click="removeNodeAction(index)"
                  />
                </div>

                <el-form-item label="动作 ID" size="small">
                  <el-input
                    :model-value="action.id"
                    @update:model-value="setNodeActionId(index, $event)"
                  />
                </el-form-item>

                <el-form-item label="动作类型" size="small">
                  <el-select
                    :model-value="action.type"
                    @change="setNodeActionType(index, $event as string)"
                  >
                    <el-option
                      v-for="option in actionTypeOptions"
                      :key="`node-${option.value}`"
                      :label="option.label"
                      :value="option.value"
                    />
                  </el-select>
                </el-form-item>

                <template v-if="action.type === 'showDialog'">
                  <el-form-item label="目标弹窗页" size="small">
                    <el-select
                      :model-value="getDialogPayloadField(action, 'dialogId')"
                      filterable
                      clearable
                      placeholder="选择一个弹窗页"
                      @change="setNodeDialogPayloadField(index, 'dialogId', $event)"
                    >
                      <el-option
                        v-for="page in dialogPageOptions"
                        :key="`node-dialog-${page.id}`"
                        :label="`${page.name} (${page.id})`"
                        :value="page.id"
                      />
                    </el-select>
                  </el-form-item>

                  <el-form-item label="弹窗标题" size="small">
                    <el-input
                      :model-value="getDialogPayloadField(action, 'title')"
                      placeholder="可选，支持纯文本标题"
                      @update:model-value="setNodeDialogPayloadField(index, 'title', $event)"
                    />
                  </el-form-item>

                  <div class="flow-grid">
                    <el-form-item label="显示取消按钮" size="small">
                      <el-switch
                        :model-value="getDialogBooleanPayloadField(action, 'showCancel', true)"
                        @change="setNodeDialogBooleanPayloadField(index, 'showCancel', $event)"
                      />
                    </el-form-item>

                    <el-form-item label="确认按钮文本" size="small">
                      <el-input
                        :model-value="getDialogPayloadField(action, 'confirmText')"
                        placeholder="确认"
                        @update:model-value="
                          setNodeDialogPayloadField(index, 'confirmText', $event)
                        "
                      />
                    </el-form-item>

                    <el-form-item label="取消按钮文本" size="small">
                      <el-input
                        :model-value="getDialogPayloadField(action, 'cancelText')"
                        placeholder="取消"
                        @update:model-value="setNodeDialogPayloadField(index, 'cancelText', $event)"
                      />
                    </el-form-item>
                  </div>

                  <div v-if="getDialogStateFields(action).length" class="dialog-state-card">
                    <div class="dialog-state-card__header">目标弹窗状态映射</div>
                    <div class="dialog-state-card__hint">
                      配置后会写入目标弹窗页的页面状态。支持固定值、JSON，或
                      <code v-pre>{{ state.xxx }}</code>
                      模板表达式。
                    </div>

                    <div class="dialog-state-grid">
                      <el-form-item
                        v-for="field in getDialogStateFields(action)"
                        :key="`node-dialog-state-${action.id}-${field.key}`"
                        size="small"
                      >
                        <template #label>
                          <span class="dialog-state-label">
                            <span>{{ field.key }}</span>
                            <span class="dialog-state-type">{{ field.type }}</span>
                          </span>
                        </template>
                        <el-input
                          :model-value="getDialogStateFieldValue(action, field)"
                          :placeholder="getDialogStateFieldPlaceholder(field)"
                          @update:model-value="setNodeDialogStateField(index, field, $event)"
                        />
                      </el-form-item>
                    </div>
                  </div>

                  <el-form-item
                    :label="
                      getDialogStateFields(action).length ? '额外传入数据(JSON)' : '传入数据(JSON)'
                    "
                    size="small"
                  >
                    <el-input
                      :model-value="formatJson(getDialogPayloadJsonField(action, 'data'))"
                      type="textarea"
                      :rows="3"
                      placeholder='{"recordId":"{{state.dialogData.id}}"}'
                      @change="setNodeDialogPayloadJsonField(index, 'data', $event)"
                    />
                  </el-form-item>
                </template>

                <template v-else-if="action.type === 'closeDialog'">
                  <el-form-item label="目标弹窗页" size="small">
                    <el-select
                      :model-value="getDialogPayloadField(action, 'dialogId')"
                      filterable
                      clearable
                      placeholder="留空则关闭当前弹窗"
                      @change="setNodeDialogPayloadField(index, 'dialogId', $event)"
                    >
                      <el-option
                        v-for="page in dialogPageOptions"
                        :key="`node-close-dialog-${page.id}`"
                        :label="`${page.name} (${page.id})`"
                        :value="page.id"
                      />
                    </el-select>
                  </el-form-item>

                  <el-form-item label="返回数据(JSON)" size="small">
                    <el-input
                      :model-value="formatJson(getDialogPayloadJsonField(action, 'result'))"
                      type="textarea"
                      :rows="3"
                      placeholder='{"success":true}'
                      @change="setNodeDialogPayloadJsonField(index, 'result', $event)"
                    />
                  </el-form-item>
                </template>

                <el-form-item label="payload(JSON)" size="small">
                  <el-input
                    :model-value="formatJson(asRecord(action).payload)"
                    type="textarea"
                    :rows="4"
                    @change="setNodeActionJsonField(index, 'payload', $event)"
                  />
                </el-form-item>

                <el-form-item label="handlers(JSON)" size="small">
                  <el-input
                    :model-value="formatJson(asRecord(action).handlers)"
                    type="textarea"
                    :rows="3"
                    placeholder='{"success":"a1","fail":"a2"}'
                    @change="setNodeActionJsonField(index, 'handlers', $event)"
                  />
                </el-form-item>

                <el-form-item label="next(JSON: string/ref)" size="small">
                  <el-input
                    :model-value="formatJson(asRecord(action).next)"
                    type="textarea"
                    :rows="2"
                    placeholder='"next_action" 或 {"type":"ref","scope":"page","id":"x","pageId":"p"}'
                    @change="setNodeActionJsonField(index, 'next', $event)"
                  />
                </el-form-item>

                <div class="flow-grid">
                  <el-form-item label="延迟(ms)" size="small">
                    <el-input-number
                      :model-value="toNumber(asRecord(action).delay)"
                      :min="0"
                      :step="50"
                      controls-position="right"
                      @change="setNodeActionTopLevelField(index, 'delay', $event)"
                    />
                  </el-form-item>
                  <el-form-item label="防抖(ms)" size="small">
                    <el-input-number
                      :model-value="toNumber(asRecord(action).debounce)"
                      :min="0"
                      :step="50"
                      controls-position="right"
                      @change="setNodeActionTopLevelField(index, 'debounce', $event)"
                    />
                  </el-form-item>
                  <el-form-item label="节流(ms)" size="small">
                    <el-input-number
                      :model-value="toNumber(asRecord(action).throttle)"
                      :min="0"
                      :step="50"
                      controls-position="right"
                      @change="setNodeActionTopLevelField(index, 'throttle', $event)"
                    />
                  </el-form-item>
                </div>

                <el-form-item label="执行条件表达式" size="small">
                  <el-input
                    :model-value="getConditionExpression(action)"
                    placeholder="例如: state.count > 0"
                    @update:model-value="setNodeActionConditionExpression(index, $event)"
                  />
                </el-form-item>

                <el-form-item label="确认提示文本(为空则不确认)" size="small">
                  <el-input
                    :model-value="getConfirmMessage(action)"
                    @update:model-value="setNodeActionConfirmMessage(index, $event)"
                  />
                </el-form-item>

                <el-form-item label="调试日志(log)" size="small">
                  <el-switch
                    :model-value="Boolean(asRecord(action).log)"
                    @change="setNodeActionLog(index, $event)"
                  />
                </el-form-item>

                <el-form-item label="额外字段(JSON: targetId/duration等)" size="small">
                  <el-input
                    :model-value="formatJson(getExtraFields(action))"
                    type="textarea"
                    :rows="3"
                    @change="setNodeActionExtraFields(index, $event)"
                  />
                </el-form-item>
              </div>
            </div>
          </div>

          <div v-for="section in eventSections" :key="section.key" class="event-section">
            <div class="section-header">
              <span>{{ section.label }}</span>
              <el-button
                type="primary"
                size="small"
                :icon="Plus"
                @click="addSectionAction(section.key)"
                circle
              />
            </div>

            <el-empty v-if="section.actions.length === 0" description="暂无动作" :image-size="40" />

            <div v-else class="action-list">
              <div
                v-for="(action, index) in section.actions"
                :key="`${section.key}-${index}`"
                class="action-item"
              >
                <div class="action-header">
                  <el-select
                    :model-value="getActionMode(action)"
                    size="small"
                    class="mode-select"
                    @change="changeActionMode(section.key, index, $event as ActionMode)"
                  >
                    <el-option label="动作配置" value="action" />
                    <el-option label="引用 ID" value="ref-string" />
                    <el-option label="作用域引用" value="ref-scoped" />
                  </el-select>
                  <el-button
                    type="danger"
                    size="small"
                    :icon="Delete"
                    circle
                    @click="removeSectionAction(section.key, index)"
                  />
                </div>

                <template v-if="getActionMode(action) === 'action' && isInlineAction(action)">
                  <el-form-item label="动作 ID" size="small">
                    <el-input
                      :model-value="action.id"
                      @update:model-value="setActionId(section.key, index, $event)"
                    />
                  </el-form-item>

                  <el-form-item label="动作类型" size="small">
                    <el-select
                      :model-value="action.type"
                      @change="setActionType(section.key, index, $event as string)"
                    >
                      <el-option
                        v-for="option in actionTypeOptions"
                        :key="option.value"
                        :label="option.label"
                        :value="option.value"
                      />
                    </el-select>
                  </el-form-item>

                  <template v-if="action.type === 'showDialog'">
                    <el-form-item label="目标弹窗页" size="small">
                      <el-select
                        :model-value="getDialogPayloadField(action, 'dialogId')"
                        filterable
                        clearable
                        placeholder="选择一个弹窗页"
                        @change="setDialogPayloadField(section.key, index, 'dialogId', $event)"
                      >
                        <el-option
                          v-for="page in dialogPageOptions"
                          :key="`dialog-${page.id}`"
                          :label="`${page.name} (${page.id})`"
                          :value="page.id"
                        />
                      </el-select>
                    </el-form-item>

                    <el-form-item label="弹窗标题" size="small">
                      <el-input
                        :model-value="getDialogPayloadField(action, 'title')"
                        placeholder="可选，支持纯文本标题"
                        @update:model-value="
                          setDialogPayloadField(section.key, index, 'title', $event)
                        "
                      />
                    </el-form-item>

                    <div class="flow-grid">
                      <el-form-item label="显示取消按钮" size="small">
                        <el-switch
                          :model-value="getDialogBooleanPayloadField(action, 'showCancel', true)"
                          @change="
                            setDialogBooleanPayloadField(section.key, index, 'showCancel', $event)
                          "
                        />
                      </el-form-item>

                      <el-form-item label="确认按钮文本" size="small">
                        <el-input
                          :model-value="getDialogPayloadField(action, 'confirmText')"
                          placeholder="确认"
                          @update:model-value="
                            setDialogPayloadField(section.key, index, 'confirmText', $event)
                          "
                        />
                      </el-form-item>

                      <el-form-item label="取消按钮文本" size="small">
                        <el-input
                          :model-value="getDialogPayloadField(action, 'cancelText')"
                          placeholder="取消"
                          @update:model-value="
                            setDialogPayloadField(section.key, index, 'cancelText', $event)
                          "
                        />
                      </el-form-item>
                    </div>

                    <div v-if="getDialogStateFields(action).length" class="dialog-state-card">
                      <div class="dialog-state-card__header">目标弹窗状态映射</div>
                      <div class="dialog-state-card__hint">
                        配置后会写入目标弹窗页的页面状态。支持固定值、JSON，或
                        <code v-pre>{{ state.xxx }}</code>
                        模板表达式。
                      </div>

                      <div class="dialog-state-grid">
                        <el-form-item
                          v-for="field in getDialogStateFields(action)"
                          :key="`dialog-state-${action.id}-${field.key}`"
                          size="small"
                        >
                          <template #label>
                            <span class="dialog-state-label">
                              <span>{{ field.key }}</span>
                              <span class="dialog-state-type">{{ field.type }}</span>
                            </span>
                          </template>
                          <el-input
                            :model-value="getDialogStateFieldValue(action, field)"
                            :placeholder="getDialogStateFieldPlaceholder(field)"
                            @update:model-value="
                              setDialogStateField(section.key, index, field, $event)
                            "
                          />
                        </el-form-item>
                      </div>
                    </div>

                    <el-form-item
                      :label="
                        getDialogStateFields(action).length
                          ? '额外传入数据(JSON)'
                          : '传入数据(JSON)'
                      "
                      size="small"
                    >
                      <el-input
                        :model-value="formatJson(getDialogPayloadJsonField(action, 'data'))"
                        type="textarea"
                        :rows="3"
                        placeholder='{"recordId":"{{state.dialogData.id}}"}'
                        @change="setDialogPayloadJsonField(section.key, index, 'data', $event)"
                      />
                    </el-form-item>
                  </template>

                  <template v-else-if="action.type === 'closeDialog'">
                    <el-form-item label="目标弹窗页" size="small">
                      <el-select
                        :model-value="getDialogPayloadField(action, 'dialogId')"
                        filterable
                        clearable
                        placeholder="留空则关闭当前弹窗"
                        @change="setDialogPayloadField(section.key, index, 'dialogId', $event)"
                      >
                        <el-option
                          v-for="page in dialogPageOptions"
                          :key="`close-dialog-${page.id}`"
                          :label="`${page.name} (${page.id})`"
                          :value="page.id"
                        />
                      </el-select>
                    </el-form-item>

                    <el-form-item label="返回数据(JSON)" size="small">
                      <el-input
                        :model-value="formatJson(getDialogPayloadJsonField(action, 'result'))"
                        type="textarea"
                        :rows="3"
                        placeholder='{"success":true}'
                        @change="setDialogPayloadJsonField(section.key, index, 'result', $event)"
                      />
                    </el-form-item>
                  </template>

                  <el-form-item label="payload(JSON)" size="small">
                    <el-input
                      :model-value="formatJson(asRecord(action).payload)"
                      type="textarea"
                      :rows="4"
                      @change="setJsonField(section.key, index, 'payload', $event)"
                    />
                  </el-form-item>

                  <el-form-item label="handlers(JSON)" size="small">
                    <el-input
                      :model-value="formatJson(asRecord(action).handlers)"
                      type="textarea"
                      :rows="3"
                      placeholder='{"success":"a1","fail":"a2"}'
                      @change="setJsonField(section.key, index, 'handlers', $event)"
                    />
                  </el-form-item>

                  <el-form-item label="next(JSON: string/ref)" size="small">
                    <el-input
                      :model-value="formatJson(asRecord(action).next)"
                      type="textarea"
                      :rows="2"
                      placeholder='"next_action" 或 {"type":"ref","scope":"page","id":"x","pageId":"p"}'
                      @change="setJsonField(section.key, index, 'next', $event)"
                    />
                  </el-form-item>

                  <div class="flow-grid">
                    <el-form-item label="延迟(ms)" size="small">
                      <el-input-number
                        :model-value="toNumber(asRecord(action).delay)"
                        :min="0"
                        :step="50"
                        controls-position="right"
                        @change="setTopLevelField(section.key, index, 'delay', $event)"
                      />
                    </el-form-item>
                    <el-form-item label="防抖(ms)" size="small">
                      <el-input-number
                        :model-value="toNumber(asRecord(action).debounce)"
                        :min="0"
                        :step="50"
                        controls-position="right"
                        @change="setTopLevelField(section.key, index, 'debounce', $event)"
                      />
                    </el-form-item>
                    <el-form-item label="节流(ms)" size="small">
                      <el-input-number
                        :model-value="toNumber(asRecord(action).throttle)"
                        :min="0"
                        :step="50"
                        controls-position="right"
                        @change="setTopLevelField(section.key, index, 'throttle', $event)"
                      />
                    </el-form-item>
                  </div>

                  <el-form-item label="执行条件表达式" size="small">
                    <el-input
                      :model-value="getConditionExpression(action)"
                      placeholder="例如: state.count > 0"
                      @update:model-value="setConditionExpression(section.key, index, $event)"
                    />
                  </el-form-item>

                  <el-form-item label="确认提示文本(为空则不确认)" size="small">
                    <el-input
                      :model-value="getConfirmMessage(action)"
                      @update:model-value="setConfirmMessage(section.key, index, $event)"
                    />
                  </el-form-item>

                  <el-form-item label="调试日志(log)" size="small">
                    <el-switch
                      :model-value="Boolean(asRecord(action).log)"
                      @change="setActionLog(section.key, index, $event)"
                    />
                  </el-form-item>

                  <el-form-item label="额外字段(JSON: targetId/duration等)" size="small">
                    <el-input
                      :model-value="formatJson(getExtraFields(action))"
                      type="textarea"
                      :rows="3"
                      @change="setExtraFields(section.key, index, $event)"
                    />
                  </el-form-item>
                </template>

                <template v-else-if="getActionMode(action) === 'ref-string'">
                  <el-form-item label="动作引用 ID" size="small">
                    <el-select
                      :model-value="typeof action === 'string' ? action : ''"
                      filterable
                      allow-create
                      default-first-option
                      clearable
                      placeholder="输入或选择动作 ID"
                      @change="setStringRef(section.key, index, $event)"
                    >
                      <el-option
                        v-for="option in allActionRefOptions"
                        :key="`all-${option}`"
                        :label="option"
                        :value="option"
                      />
                    </el-select>
                  </el-form-item>
                </template>

                <template
                  v-else-if="getActionMode(action) === 'ref-scoped' && isScopedRefAction(action)"
                >
                  <el-form-item label="作用域" size="small">
                    <el-select
                      :model-value="action.scope || 'global'"
                      @change="setScopedScope(section.key, index, $event as RefScope)"
                    >
                      <el-option label="全局(global)" value="global" />
                      <el-option label="页面(page)" value="page" />
                      <el-option label="节点(node)" value="node" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="动作 ID" size="small">
                    <el-select
                      :model-value="action.id"
                      filterable
                      allow-create
                      default-first-option
                      clearable
                      placeholder="输入或选择动作 ID"
                      @change="setScopedField(section.key, index, 'id', $event)"
                    >
                      <el-option
                        v-for="option in getScopedActionRefOptions(action.scope || 'global')"
                        :key="`scoped-${action.scope || 'global'}-${option}`"
                        :label="option"
                        :value="option"
                      />
                    </el-select>
                  </el-form-item>
                  <el-form-item v-if="action.scope === 'page'" label="页面 ID" size="small">
                    <el-select
                      :model-value="getScopedFieldValue(action, 'pageId')"
                      filterable
                      allow-create
                      default-first-option
                      clearable
                      placeholder="输入或选择页面 ID"
                      @change="setScopedField(section.key, index, 'pageId', $event)"
                    >
                      <el-option
                        v-for="pageId in pageIdOptions"
                        :key="`page-id-${pageId}`"
                        :label="pageId"
                        :value="pageId"
                      />
                    </el-select>
                  </el-form-item>
                  <el-form-item v-if="action.scope === 'node'" label="节点 ID" size="small">
                    <el-select
                      :model-value="getScopedFieldValue(action, 'nodeId')"
                      filterable
                      allow-create
                      default-first-option
                      clearable
                      placeholder="输入或选择节点 ID"
                      @change="setScopedField(section.key, index, 'nodeId', $event)"
                    >
                      <el-option
                        v-for="nodeId in nodeIdOptions"
                        :key="`node-id-${nodeId}`"
                        :label="nodeId"
                        :value="nodeId"
                      />
                    </el-select>
                  </el-form-item>
                </template>
              </div>
            </div>
          </div>
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { nanoid } from 'nanoid'
import { ElMessage } from 'element-plus'
import { Plus, Delete, Select } from '@element-plus/icons-vue'
import type { DialogPage, NodeSchema } from '@vela/core'
import type { ActionSchema, AnyActionSchema, ScopedActionRef } from '@vela/core/types/action'
import type { NodeEventAction } from '@vela/core/types/schema'
import { storeToRefs } from 'pinia'
import { useProjectStore } from '@/stores/project'
import { useComponent } from '@/stores/component'
import { ACTION_TYPE_OPTIONS } from '@/constants/action-types'
import { useEventConfiguration, type SupportedEventName } from '../composables/useEvents'

type ActionMode = 'action' | 'ref-string' | 'ref-scoped'
type RefScope = 'global' | 'page' | 'node'
type JsonFieldKey = 'payload' | 'handlers' | 'next'
type DialogStateField = NonNullable<DialogPage['state']>[number]

interface Props {
  node?: NodeSchema | null
}

const props = defineProps<Props>()

const projectStore = useProjectStore()
const componentStore = useComponent()
const { currentPage, project } = storeToRefs(projectStore)

const { clickActions, hoverActions, doubleClickActions, addAction, removeAction, updateAction } =
  useEventConfiguration()

const eventSections = computed(() => [
  { key: 'click' as SupportedEventName, label: '点击事件', actions: clickActions.value },
  { key: 'hover' as SupportedEventName, label: '悬停事件', actions: hoverActions.value },
  {
    key: 'doubleClick' as SupportedEventName,
    label: '双击事件',
    actions: doubleClickActions.value,
  },
])

const actionTypeOptions = ACTION_TYPE_OPTIONS

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function asRecord(value: unknown): Record<string, unknown> {
  return (value as Record<string, unknown>) || {}
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
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

function collectNodeIds(node: NodeSchema | null | undefined, output: string[]) {
  if (!node) return
  if (typeof node.id === 'string' && node.id) {
    output.push(node.id)
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      collectNodeIds(child, output)
    }
  }
}

const pageIdOptions = computed(() => {
  return Array.from(new Set((project.value.pages || []).map((item) => item.id).filter(Boolean)))
})

const dialogPageOptions = computed(() => {
  return (project.value.pages || []).filter((item): item is DialogPage => item.type === 'dialog')
})

const nodeIdOptions = computed(() => {
  const ids: string[] = []
  collectNodeIds(currentPage.value?.children, ids)
  return Array.from(new Set(ids))
})

const nodeActions = computed(() => normalizeActions(props.node?.actions))

function extractActionIds(actions: unknown): string[] {
  return normalizeActions(actions)
    .map((action) => action.id.trim())
    .filter(Boolean)
}

const nodeActionRefOptions = computed(() =>
  extractActionIds(nodeActions.value as AnyActionSchema[]),
)

const pageActionRefOptions = computed(() => extractActionIds(currentPage.value?.actions))

const globalActionRefOptions = computed(() => extractActionIds(project.value.logic?.actions))

const allActionRefOptions = computed(() => {
  return Array.from(
    new Set([
      ...nodeActionRefOptions.value,
      ...pageActionRefOptions.value,
      ...globalActionRefOptions.value,
    ]),
  )
})

function getScopedActionRefOptions(scope: RefScope): string[] {
  if (scope === 'node') return nodeActionRefOptions.value
  if (scope === 'page') return pageActionRefOptions.value
  return globalActionRefOptions.value
}

function isScopedRefAction(action: NodeEventAction): action is ScopedActionRef {
  return typeof action === 'object' && action !== null && action.type === 'ref'
}

function isInlineAction(action: NodeEventAction): action is ActionSchema<string> {
  return typeof action === 'object' && action !== null && action.type !== 'ref'
}

function getActionMode(action: NodeEventAction): ActionMode {
  if (typeof action === 'string') return 'ref-string'
  if (isScopedRefAction(action)) return 'ref-scoped'
  return 'action'
}

function sectionActions(eventName: SupportedEventName): NodeEventAction[] {
  const section = eventSections.value.find((item) => item.key === eventName)
  return section?.actions ?? []
}

function inlineDefaultAction(seed?: string): ActionSchema<string> {
  return {
    id: seed || nanoid(),
    type: 'showToast',
    payload: { message: '提示消息', type: 'info' },
  }
}

function addSectionAction(eventName: SupportedEventName) {
  addAction(eventName, inlineDefaultAction())
}

function removeSectionAction(eventName: SupportedEventName, index: number) {
  removeAction(eventName, index)
}

function changeActionMode(eventName: SupportedEventName, index: number, mode: ActionMode) {
  const current = sectionActions(eventName)[index]
  const id =
    typeof current === 'string'
      ? current
      : isScopedRefAction(current)
        ? current.id
        : current?.id || nanoid()

  if (mode === 'action') {
    updateAction(eventName, index, inlineDefaultAction(id))
    return
  }
  if (mode === 'ref-string') {
    updateAction(eventName, index, id)
    return
  }
  updateAction(eventName, index, { type: 'ref', scope: 'global', id })
}

function updateInline(
  eventName: SupportedEventName,
  index: number,
  updater: (action: ActionSchema<string>) => void,
) {
  const current = sectionActions(eventName)[index]
  if (!isInlineAction(current)) return
  const next = clone(current)
  updater(next)
  if (!next.id) next.id = nanoid()
  if (!next.type) next.type = 'showToast'
  updateAction(eventName, index, next)
}

function setActionId(eventName: SupportedEventName, index: number, value: unknown) {
  updateInline(eventName, index, (action) => {
    action.id = toString(value) || nanoid()
  })
}

function setActionType(eventName: SupportedEventName, index: number, value: string) {
  updateInline(eventName, index, (action) => {
    action.type = value
    if (value === 'showDialog') {
      action.payload = {
        dialogId: getDefaultDialogPageId(),
        showCancel: true,
      }
      return
    }
    if (value === 'closeDialog') {
      action.payload = {}
      return
    }
  })
}

function getDefaultDialogPageId(): string {
  return dialogPageOptions.value[0]?.id || ''
}

function getPayloadRecord(action: ActionSchema<string>): Record<string, unknown> {
  const payload = asRecord(action).payload
  return isRecord(payload) ? payload : {}
}

function getDialogPayloadField(
  action: ActionSchema<string>,
  key: 'dialogId' | 'title' | 'confirmText' | 'cancelText',
): string {
  return toString(getPayloadRecord(action)[key])
}

function getDialogBooleanPayloadField(
  action: ActionSchema<string>,
  key: 'showCancel',
  fallback: boolean,
): boolean {
  const value = getPayloadRecord(action)[key]
  return typeof value === 'boolean' ? value : fallback
}

function getDialogPayloadJsonField(action: ActionSchema<string>, key: 'data' | 'result'): unknown {
  return getPayloadRecord(action)[key]
}

function getDialogPageByAction(action: ActionSchema<string>): DialogPage | undefined {
  const dialogId = getDialogPayloadField(action, 'dialogId')
  if (!dialogId) {
    return undefined
  }
  return dialogPageOptions.value.find((page) => page.id === dialogId)
}

function getDialogStateFields(action: ActionSchema<string>): DialogStateField[] {
  return getDialogPageByAction(action)?.state || []
}

function getDialogDataRecord(action: ActionSchema<string>): Record<string, unknown> {
  const value = getDialogPayloadJsonField(action, 'data')
  return isRecord(value) ? value : {}
}

function formatDialogStateValue(value: unknown): string {
  if (value === undefined || value === null) {
    return ''
  }
  if (typeof value === 'string') {
    return value
  }
  return formatJson(value)
}

function getDialogStateFieldValue(action: ActionSchema<string>, field: DialogStateField): string {
  return formatDialogStateValue(getDialogDataRecord(action)[field.key])
}

function getDialogStateFieldPlaceholder(field: DialogStateField): string {
  if (field.type === 'object' || field.type === 'array') {
    return '支持 JSON 或 {{state.xxx}}'
  }
  if (field.type === 'number' || field.type === 'boolean') {
    return `支持字面量或 {{state.${field.key}}}`
  }
  return `例如 {{state.${field.key}}}`
}

function setPayloadFieldOnAction(action: ActionSchema<string>, key: string, value: unknown) {
  const record = asRecord(action)
  const payload = { ...getPayloadRecord(action) }
  const text = typeof value === 'string' ? value.trim() : value

  if (text === undefined || text === null || text === '') {
    delete payload[key]
  } else {
    payload[key] = text
  }

  if (Object.keys(payload).length === 0) {
    delete record.payload
    return
  }

  record.payload = payload
}

function setPayloadBooleanFieldOnAction(action: ActionSchema<string>, key: string, value: unknown) {
  const record = asRecord(action)
  const payload = { ...getPayloadRecord(action), [key]: Boolean(value) }
  record.payload = payload
}

function setPayloadJsonFieldOnAction(action: ActionSchema<string>, key: string, value: unknown) {
  const parsed = parseJson(value)
  if (!parsed.ok) return
  setPayloadFieldOnAction(action, key, parsed.value)
}

function parseDialogStateInput(field: DialogStateField, value: unknown): unknown {
  const text = toString(value).trim()
  if (!text) {
    return undefined
  }
  if (text.includes('{{')) {
    return text
  }

  if (field.type === 'number') {
    const numericValue = Number(text)
    return Number.isFinite(numericValue) ? numericValue : text
  }

  if (field.type === 'boolean') {
    if (text === 'true') return true
    if (text === 'false') return false
    return text
  }

  if (field.type === 'object' || field.type === 'array') {
    const parsed = parseJson(text)
    return parsed.ok ? parsed.value : undefined
  }

  return text
}

function setDialogStateFieldOnAction(
  action: ActionSchema<string>,
  field: DialogStateField,
  value: unknown,
) {
  const record = asRecord(action)
  const payload = { ...getPayloadRecord(action) }
  const nextValue = parseDialogStateInput(field, value)
  const data = { ...getDialogDataRecord(action) }

  if (nextValue === undefined || nextValue === '') {
    delete data[field.key]
  } else {
    data[field.key] = nextValue
  }

  if (Object.keys(data).length === 0) {
    delete payload.data
  } else {
    payload.data = data
  }

  if (Object.keys(payload).length === 0) {
    delete record.payload
    return
  }

  record.payload = payload
}

function setJsonField(
  eventName: SupportedEventName,
  index: number,
  key: JsonFieldKey,
  value: unknown,
) {
  const parsed = parseJson(value)
  if (!parsed.ok) return
  updateInline(eventName, index, (action) => {
    const record = asRecord(action)
    if (parsed.value === undefined) {
      delete record[key]
      return
    }
    record[key] = parsed.value
  })
}

function setDialogPayloadField(
  eventName: SupportedEventName,
  index: number,
  key: 'dialogId' | 'title' | 'confirmText' | 'cancelText',
  value: unknown,
) {
  updateInline(eventName, index, (action) => {
    setPayloadFieldOnAction(action, key, value)
  })
}

function setDialogBooleanPayloadField(
  eventName: SupportedEventName,
  index: number,
  key: 'showCancel',
  value: unknown,
) {
  updateInline(eventName, index, (action) => {
    setPayloadBooleanFieldOnAction(action, key, value)
  })
}

function setDialogPayloadJsonField(
  eventName: SupportedEventName,
  index: number,
  key: 'data' | 'result',
  value: unknown,
) {
  updateInline(eventName, index, (action) => {
    setPayloadJsonFieldOnAction(action, key, value)
  })
}

function setDialogStateField(
  eventName: SupportedEventName,
  index: number,
  field: DialogStateField,
  value: unknown,
) {
  updateInline(eventName, index, (action) => {
    setDialogStateFieldOnAction(action, field, value)
  })
}

function setTopLevelField(
  eventName: SupportedEventName,
  index: number,
  key: 'delay' | 'debounce' | 'throttle',
  value: unknown,
) {
  updateInline(eventName, index, (action) => {
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
  if (isRecord(condition) && typeof condition.value === 'string') {
    return condition.value
  }
  return ''
}

function setConditionExpression(eventName: SupportedEventName, index: number, value: unknown) {
  const text = toString(value).trim()
  updateInline(eventName, index, (action) => {
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
  if (!isRecord(confirm)) return ''
  return toString(confirm.message)
}

function setConfirmMessage(eventName: SupportedEventName, index: number, value: unknown) {
  const text = toString(value).trim()
  updateInline(eventName, index, (action) => {
    const record = asRecord(action)
    if (!text) {
      delete record.confirm
      return
    }
    record.confirm = { message: text }
  })
}

function setActionLog(eventName: SupportedEventName, index: number, value: unknown) {
  updateInline(eventName, index, (action) => {
    const record = asRecord(action)
    if (!value) {
      delete record.log
      return
    }
    record.log = Boolean(value)
  })
}

function getExtraFields(action: ActionSchema<string>): Record<string, unknown> {
  const record = asRecord(action)
  const extras: Record<string, unknown> = {}
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

  for (const [key, value] of Object.entries(record)) {
    if (!reserved.has(key)) {
      extras[key] = value
    }
  }
  return extras
}

function setExtraFields(eventName: SupportedEventName, index: number, value: unknown) {
  const parsed = parseJson(value)
  if (!parsed.ok) return
  updateInline(eventName, index, (action) => {
    const record = asRecord(action)
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

    for (const key of Object.keys(record)) {
      if (!reserved.has(key)) {
        delete record[key]
      }
    }

    if (!isRecord(parsed.value)) return
    for (const [key, fieldValue] of Object.entries(parsed.value)) {
      if (!reserved.has(key)) {
        record[key] = fieldValue
      }
    }
  })
}

function setStringRef(eventName: SupportedEventName, index: number, value: unknown) {
  updateAction(eventName, index, toString(value).trim())
}

function getScopedFieldValue(action: ScopedActionRef, key: 'pageId' | 'nodeId'): string {
  return toString(asRecord(action)[key])
}

function setScopedScope(eventName: SupportedEventName, index: number, scope: RefScope) {
  const current = sectionActions(eventName)[index]
  if (!isScopedRefAction(current)) return
  const next = clone(current)
  const record = asRecord(next)
  record.scope = scope
  if (scope !== 'page') delete record.pageId
  if (scope !== 'node') delete record.nodeId
  updateAction(eventName, index, next as unknown as ScopedActionRef)
}

function setScopedField(
  eventName: SupportedEventName,
  index: number,
  key: 'id' | 'pageId' | 'nodeId',
  value: unknown,
) {
  const current = sectionActions(eventName)[index]
  if (!isScopedRefAction(current)) return
  const next = clone(current)
  const record = asRecord(next)
  const text = toString(value).trim()
  if (!text) {
    delete record[key]
  } else {
    record[key] = text
  }
  updateAction(eventName, index, next as unknown as ScopedActionRef)
}

function commitNodeActions(updater: (actions: ActionSchema<string>[]) => void) {
  if (!props.node) return
  const targetNode = componentStore.findNodeById(props.node.id)
  if (!targetNode) return

  const actions = clone(nodeActions.value)
  updater(actions)
  const cleanActions = normalizeActions(actions)

  if (cleanActions.length === 0) {
    delete (targetNode as { actions?: unknown }).actions
  } else {
    targetNode.actions = cleanActions as AnyActionSchema[]
  }

  componentStore.syncToProjectStore()
}

function addNodeAction() {
  commitNodeActions((actions) => {
    actions.push(inlineDefaultAction())
  })
}

function removeNodeAction(index: number) {
  commitNodeActions((actions) => {
    if (index < 0 || index >= actions.length) return
    actions.splice(index, 1)
  })
}

function updateNodeActionAt(index: number, updater: (action: ActionSchema<string>) => void) {
  commitNodeActions((actions) => {
    if (index < 0 || index >= actions.length) return
    updater(actions[index])
    if (!actions[index].id) actions[index].id = nanoid()
    if (!actions[index].type) actions[index].type = 'showToast'
  })
}

function setNodeActionId(index: number, value: unknown) {
  updateNodeActionAt(index, (action) => {
    action.id = toString(value) || nanoid()
  })
}

function setNodeActionType(index: number, value: string) {
  updateNodeActionAt(index, (action) => {
    action.type = value
    if (value === 'showDialog') {
      action.payload = {
        dialogId: getDefaultDialogPageId(),
        showCancel: true,
      }
      return
    }
    if (value === 'closeDialog') {
      action.payload = {}
      return
    }
  })
}

function setNodeDialogPayloadField(
  index: number,
  key: 'dialogId' | 'title' | 'confirmText' | 'cancelText',
  value: unknown,
) {
  updateNodeActionAt(index, (action) => {
    setPayloadFieldOnAction(action, key, value)
  })
}

function setNodeDialogBooleanPayloadField(index: number, key: 'showCancel', value: unknown) {
  updateNodeActionAt(index, (action) => {
    setPayloadBooleanFieldOnAction(action, key, value)
  })
}

function setNodeDialogPayloadJsonField(index: number, key: 'data' | 'result', value: unknown) {
  updateNodeActionAt(index, (action) => {
    setPayloadJsonFieldOnAction(action, key, value)
  })
}

function setNodeDialogStateField(index: number, field: DialogStateField, value: unknown) {
  updateNodeActionAt(index, (action) => {
    setDialogStateFieldOnAction(action, field, value)
  })
}

function setNodeActionJsonField(index: number, key: JsonFieldKey, value: unknown) {
  const parsed = parseJson(value)
  if (!parsed.ok) return
  updateNodeActionAt(index, (action) => {
    const record = asRecord(action)
    if (parsed.value === undefined) {
      delete record[key]
      return
    }
    record[key] = parsed.value
  })
}

function setNodeActionTopLevelField(
  index: number,
  key: 'delay' | 'debounce' | 'throttle',
  value: unknown,
) {
  updateNodeActionAt(index, (action) => {
    const record = asRecord(action)
    const nextValue = toNumber(value)
    if (nextValue === undefined || nextValue <= 0) {
      delete record[key]
      return
    }
    record[key] = nextValue
  })
}

function setNodeActionConditionExpression(index: number, value: unknown) {
  const text = toString(value).trim()
  updateNodeActionAt(index, (action) => {
    const record = asRecord(action)
    if (!text) {
      delete record.condition
      return
    }
    record.condition = { type: 'expression', value: text }
  })
}

function setNodeActionConfirmMessage(index: number, value: unknown) {
  const text = toString(value).trim()
  updateNodeActionAt(index, (action) => {
    const record = asRecord(action)
    if (!text) {
      delete record.confirm
      return
    }
    record.confirm = { message: text }
  })
}

function setNodeActionLog(index: number, value: unknown) {
  updateNodeActionAt(index, (action) => {
    const record = asRecord(action)
    if (!value) {
      delete record.log
      return
    }
    record.log = Boolean(value)
  })
}

function setNodeActionExtraFields(index: number, value: unknown) {
  const parsed = parseJson(value)
  if (!parsed.ok) return
  updateNodeActionAt(index, (action) => {
    const record = asRecord(action)
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

    for (const key of Object.keys(record)) {
      if (!reserved.has(key)) {
        delete record[key]
      }
    }

    if (!isRecord(parsed.value)) return
    for (const [key, fieldValue] of Object.entries(parsed.value)) {
      if (!reserved.has(key)) {
        record[key] = fieldValue
      }
    }
  })
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
  min-height: 0;
}

.event-scrollbar {
  height: 100%;
}

.event-list {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  padding: 10px 12px;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-light);
  font-size: 13px;
  font-weight: 600;
}

.action-list {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.action-item {
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  padding: 10px;
}

.action-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.mode-select {
  flex: 1;
}

.flow-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.dialog-state-card {
  margin-bottom: 10px;
  padding: 10px;
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
  background: var(--el-fill-color-light);
}

.dialog-state-card__header {
  margin-bottom: 4px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.dialog-state-card__hint {
  margin-bottom: 10px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.dialog-state-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;
}

.dialog-state-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.dialog-state-type {
  padding: 0 6px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.06);
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 18px;
}

.action-item :deep(.el-form-item) {
  margin-bottom: 10px;
}

.action-item :deep(.el-select),
.action-item :deep(.el-input-number) {
  width: 100%;
}
</style>
