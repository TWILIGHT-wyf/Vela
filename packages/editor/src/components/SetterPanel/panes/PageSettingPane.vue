<template>
  <div class="page-setting-pane">
    <div class="section">
      <div class="section-title">页面信息</div>
      <el-form label-position="top" size="default">
        <el-form-item label="页面名称">
          <el-input v-model="pageName" placeholder="输入页面名称" />
        </el-form-item>

        <el-form-item label="页面标题">
          <el-input v-model="pageTitle" placeholder="浏览器标题 / 面包屑名称" />
        </el-form-item>

        <el-form-item v-if="isRoutePage" label="页面路径">
          <el-input v-model="pagePath" placeholder="输入页面路径">
            <template #prepend>/</template>
          </el-input>
        </el-form-item>

        <el-form-item label="页面描述">
          <el-input
            v-model="pageDescription"
            type="textarea"
            :rows="3"
            placeholder="补充页面职责，方便在文档和演示中说明"
          />
        </el-form-item>

        <template v-if="isDialogPage">
          <el-form-item label="弹窗宽度">
            <el-input v-model="dialogWidth" placeholder="例如 640px / 60vw" />
          </el-form-item>

          <el-form-item label="弹窗高度">
            <el-input v-model="dialogHeight" placeholder="例如 auto / 70vh" />
          </el-form-item>

          <el-form-item label="显示关闭按钮">
            <div class="switch-row">
              <el-switch v-model="dialogClosable" />
              <span class="switch-hint">控制右上角关闭按钮是否可见</span>
            </div>
          </el-form-item>

          <el-form-item label="显示遮罩">
            <div class="switch-row">
              <el-switch v-model="dialogMask" />
              <span class="switch-hint">关闭后可用于抽屉式或嵌入式对话框</span>
            </div>
          </el-form-item>

          <el-form-item label="点击遮罩关闭">
            <div class="switch-row">
              <el-switch v-model="dialogMaskClosable" :disabled="!dialogMask" />
              <span class="switch-hint">
                {{ dialogMask ? '允许点击遮罩关闭弹窗' : '遮罩关闭时该配置自动禁用' }}
              </span>
            </div>
          </el-form-item>
        </template>
      </el-form>
    </div>

    <el-divider />

    <div class="section">
      <div class="section-title">运行时配置</div>
      <el-form label-position="top" size="default">
        <el-form-item label="页面缓存">
          <div class="switch-row">
            <el-switch v-model="keepAliveEnabled" />
            <span class="switch-hint">启用后可在运行时保留页面状态</span>
          </div>
        </el-form-item>
      </el-form>
    </div>

    <el-divider />

    <div class="section">
      <div class="section-title with-action">
        <span>页面状态</span>
        <el-button size="small" link @click="addStateVariable">新增状态</el-button>
      </div>

      <div v-if="stateItems.length === 0" class="empty-block">
        <span>暂无页面级状态，可用于表单筛选、弹窗开关、详情数据缓存。</span>
      </div>

      <div v-else class="config-list">
        <div v-for="(item, index) in stateItems" :key="`state-${index}`" class="config-card">
          <div class="card-toolbar">
            <span class="card-title">{{ item.key || `state_${index + 1}` }}</span>
            <el-button size="small" link type="danger" @click="removeStateVariable(index)">
              删除
            </el-button>
          </div>

          <div class="form-grid-2">
            <el-form-item label="Key">
              <el-input v-model="item.key" placeholder="例如 filters / dialogVisible" />
            </el-form-item>

            <el-form-item label="类型">
              <el-select v-model="item.type">
                <el-option
                  v-for="option in VARIABLE_TYPE_OPTIONS"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </div>

          <el-form-item label="默认值">
            <template v-if="item.type === 'number'">
              <el-input-number v-model="item.defaultNumberValue" controls-position="right" />
            </template>
            <template v-else-if="item.type === 'boolean'">
              <div class="switch-row">
                <el-switch v-model="item.defaultBooleanValue" />
                <span class="switch-hint">{{ item.defaultBooleanValue ? 'true' : 'false' }}</span>
              </div>
            </template>
            <template v-else>
              <el-input
                v-model="item.defaultTextValue"
                :placeholder="
                  item.type === 'object' || item.type === 'array'
                    ? '输入 JSON 字符串'
                    : '输入默认值'
                "
              />
            </template>
          </el-form-item>

          <el-form-item label="说明">
            <el-input v-model="item.description" placeholder="说明这个状态在页面中的作用" />
          </el-form-item>
        </div>
      </div>
    </div>

    <el-divider />

    <div class="section">
      <div class="section-title with-action">
        <span>页面 API</span>
        <el-button size="small" link @click="addApiDefinition">新增 API</el-button>
      </div>

      <div v-if="apiItems.length === 0" class="empty-block">
        <span>暂无页面级 API，可用于查询表单、详情请求和自动加载数据。</span>
      </div>

      <div v-else class="config-list">
        <div v-for="(item, index) in apiItems" :key="item.id" class="config-card">
          <div class="card-toolbar">
            <span class="card-title">{{ item.name || `api_${index + 1}` }}</span>
            <el-button size="small" link type="danger" @click="removeApiDefinition(index)">
              删除
            </el-button>
          </div>

          <div class="form-grid-2">
            <el-form-item label="名称">
              <el-input v-model="item.name" placeholder="例如 fetchUsers" />
            </el-form-item>

            <el-form-item label="方法">
              <el-select v-model="item.method">
                <el-option
                  v-for="method in HTTP_METHOD_OPTIONS"
                  :key="method"
                  :label="method"
                  :value="method"
                />
              </el-select>
            </el-form-item>
          </div>

          <el-form-item label="URL">
            <el-input v-model="item.url" placeholder="/api/mock/users" />
          </el-form-item>

          <div class="form-grid-2">
            <el-form-item label="状态绑定">
              <el-input v-model="item.dataPath" placeholder="例如 users / detail" />
            </el-form-item>

            <el-form-item label="自动加载">
              <div class="switch-row">
                <el-switch v-model="item.autoLoad" />
                <span class="switch-hint">{{ item.autoLoad ? '页面进入自动请求' : '手动触发' }}</span>
              </div>
            </el-form-item>
          </div>

          <el-form-item label="说明">
            <el-input v-model="item.description" placeholder="说明这个接口服务的页面场景" />
          </el-form-item>
        </div>
      </div>
    </div>

    <el-divider />

    <div class="section">
      <div class="section-title">画布尺寸</div>
      <el-form label-position="top" size="default">
        <el-form-item label="自定义宽高">
          <div class="size-inputs">
            <el-input-number
              v-model="sizeStore.width"
              :min="320"
              :max="3840"
              :step="10"
              controls-position="right"
              @change="(val: number | undefined) => sizeStore.setSize(val || 1920, sizeStore.height)"
            />
            <span class="size-separator">x</span>
            <el-input-number
              v-model="sizeStore.height"
              :min="320"
              :max="3840"
              :step="10"
              controls-position="right"
              @change="(val: number | undefined) => sizeStore.setSize(sizeStore.width, val || 1080)"
            />
          </div>
        </el-form-item>

        <el-form-item label="设备预设">
          <el-select
            v-model="sizeStore.currentPresetKey"
            placeholder="选择预设尺寸"
            @change="handlePresetChange"
          >
            <el-option
              v-for="preset in DEVICE_PRESETS"
              :key="preset.key"
              :label="`${preset.name} (${preset.width}x${preset.height})`"
              :value="preset.key"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { nanoid } from 'nanoid'
import { storeToRefs } from 'pinia'
import { useProjectStore } from '@/stores/project'
import { useSizeStore, DEVICE_PRESETS } from '@/stores/size'
import type {
  ApiSchema,
  HttpMethod,
  VariableBaseType,
  VariableSchema,
} from '@vela/core/types/data'

interface EditableVariableItem {
  key: string
  type: VariableBaseType
  description: string
  defaultTextValue: string
  defaultNumberValue: number
  defaultBooleanValue: boolean
}

interface EditableApiItem {
  id: string
  name: string
  method: HttpMethod
  url: string
  autoLoad: boolean
  dataPath: string
  description: string
}

const VARIABLE_TYPE_OPTIONS: Array<{ label: string; value: VariableBaseType }> = [
  { label: '字符串', value: 'string' },
  { label: '数字', value: 'number' },
  { label: '布尔值', value: 'boolean' },
  { label: '对象', value: 'object' },
  { label: '数组', value: 'array' },
  { label: '任意值', value: 'any' },
]

const HTTP_METHOD_OPTIONS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']

const projectStore = useProjectStore()
const sizeStore = useSizeStore()

const { currentPage } = storeToRefs(projectStore)

const isRoutePage = computed(() => currentPage.value?.type === 'page')
const isDialogPage = computed(() => currentPage.value?.type === 'dialog')

const pageName = computed({
  get: () => currentPage.value?.name || '',
  set: (value: string) => {
    projectStore.updateCurrentPageMeta({ name: value })
  },
})

const pageTitle = computed({
  get: () => currentPage.value?.title || '',
  set: (value: string) => {
    projectStore.updateCurrentPageMeta({ title: value })
  },
})

const pageDescription = computed({
  get: () => currentPage.value?.description || '',
  set: (value: string) => {
    projectStore.updateCurrentPageMeta({ description: value })
  },
})

const pagePath = computed({
  get: () => (currentPage.value?.type === 'page' ? currentPage.value.path.replace(/^\//, '') : ''),
  set: (value: string) => {
    const normalized = value.trim() || '/'
    projectStore.updateCurrentPagePath(normalized)
  },
})

const keepAliveEnabled = computed({
  get: () => Boolean(currentPage.value?.config?.runtime?.keepAlive),
  set: (value: boolean) => {
    projectStore.updateCurrentPageRuntime({ keepAlive: value })
  },
})

const dialogWidth = computed({
  get: () => (currentPage.value?.type === 'dialog' ? String(currentPage.value.dialogConfig?.width ?? '500px') : ''),
  set: (value: string) => {
    projectStore.updateCurrentDialogConfig({ width: value.trim() || '500px' })
  },
})

const dialogHeight = computed({
  get: () => (currentPage.value?.type === 'dialog' ? String(currentPage.value.dialogConfig?.height ?? '') : ''),
  set: (value: string) => {
    projectStore.updateCurrentDialogConfig({ height: value.trim() || undefined })
  },
})

const dialogClosable = computed({
  get: () => (currentPage.value?.type === 'dialog' ? currentPage.value.dialogConfig?.closable !== false : true),
  set: (value: boolean) => {
    projectStore.updateCurrentDialogConfig({ closable: value })
  },
})

const dialogMask = computed({
  get: () => (currentPage.value?.type === 'dialog' ? currentPage.value.dialogConfig?.mask !== false : true),
  set: (value: boolean) => {
    projectStore.updateCurrentDialogConfig({
      mask: value,
      maskClosable: value ? dialogMaskClosable.value : false,
    })
  },
})

const dialogMaskClosable = computed({
  get: () =>
    currentPage.value?.type === 'dialog'
      ? currentPage.value.dialogConfig?.maskClosable !== false
      : true,
  set: (value: boolean) => {
    projectStore.updateCurrentDialogConfig({ maskClosable: value })
  },
})

const stateItems = ref<EditableVariableItem[]>([])
const apiItems = ref<EditableApiItem[]>([])
const syncingFormState = ref(false)

function readTextDefaultValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

function toEditableVariableItem(variable: VariableSchema): EditableVariableItem {
  return {
    key: variable.key,
    type: variable.type,
    description: variable.description || '',
    defaultTextValue: readTextDefaultValue(variable.defaultValue),
    defaultNumberValue: typeof variable.defaultValue === 'number' ? variable.defaultValue : 0,
    defaultBooleanValue: Boolean(variable.defaultValue),
  }
}

function parseStructuredDefault(raw: string, fallback: unknown) {
  const trimmed = raw.trim()
  if (!trimmed) return fallback
  try {
    return JSON.parse(trimmed)
  } catch {
    return fallback
  }
}

function toVariableSchema(item: EditableVariableItem, index: number): VariableSchema {
  const key = item.key.trim() || `state_${index + 1}`
  const description = item.description.trim() || undefined

  switch (item.type) {
    case 'number':
      return {
        key,
        type: 'number',
        source: 'manual',
        description,
        defaultValue: item.defaultNumberValue,
      }
    case 'boolean':
      return {
        key,
        type: 'boolean',
        source: 'manual',
        description,
        defaultValue: item.defaultBooleanValue,
      }
    case 'object':
      return {
        key,
        type: 'object',
        source: 'manual',
        description,
        defaultValue: parseStructuredDefault(item.defaultTextValue, {}),
      }
    case 'array':
      return {
        key,
        type: 'array',
        source: 'manual',
        description,
        defaultValue: parseStructuredDefault(item.defaultTextValue, []),
      }
    case 'any':
      return {
        key,
        type: 'any',
        source: 'manual',
        description,
        defaultValue: item.defaultTextValue,
      }
    default:
      return {
        key,
        type: 'string',
        source: 'manual',
        description,
        defaultValue: item.defaultTextValue,
      }
  }
}

function toEditableApiItem(api: ApiSchema): EditableApiItem {
  return {
    id: api.id,
    name: api.name,
    method: api.method,
    url: typeof api.url === 'string' ? api.url : '',
    autoLoad: Boolean(api.autoLoad),
    dataPath: api.stateBinding?.dataPath || '',
    description: api.description || '',
  }
}

function toApiSchema(item: EditableApiItem, index: number): ApiSchema {
  return {
    id: item.id || nanoid(8),
    name: item.name.trim() || `api_${index + 1}`,
    method: item.method,
    url: item.url.trim() || '/api/mock',
    description: item.description.trim() || undefined,
    autoLoad: item.autoLoad,
    stateBinding: item.dataPath.trim()
      ? {
          dataPath: item.dataPath.trim(),
        }
      : undefined,
  }
}

watch(
  currentPage,
  (page) => {
    syncingFormState.value = true
    stateItems.value = (page?.state || []).map(toEditableVariableItem)
    apiItems.value = (page?.apis || []).map(toEditableApiItem)
    syncingFormState.value = false
  },
  { immediate: true, deep: true },
)

watch(
  stateItems,
  (items) => {
    if (syncingFormState.value) return
    projectStore.updateCurrentPageState(items.map(toVariableSchema))
  },
  { deep: true },
)

watch(
  apiItems,
  (items) => {
    if (syncingFormState.value) return
    projectStore.updateCurrentPageApis(items.map(toApiSchema))
  },
  { deep: true },
)

function addStateVariable() {
  stateItems.value.push({
    key: `state_${stateItems.value.length + 1}`,
    type: 'string',
    description: '',
    defaultTextValue: '',
    defaultNumberValue: 0,
    defaultBooleanValue: false,
  })
}

function removeStateVariable(index: number) {
  stateItems.value.splice(index, 1)
}

function addApiDefinition() {
  apiItems.value.push({
    id: nanoid(8),
    name: `api_${apiItems.value.length + 1}`,
    method: 'GET',
    url: '/api/mock',
    autoLoad: false,
    dataPath: '',
    description: '',
  })
}

function removeApiDefinition(index: number) {
  apiItems.value.splice(index, 1)
}

function handlePresetChange(key: string) {
  sizeStore.setPreset(key)
}
</script>

<style scoped>
.page-setting-pane {
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  box-sizing: border-box;
  padding: 16px;
}

.section {
  margin-bottom: 8px;
}

.section-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--el-text-color-primary);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.section-title.with-action {
  justify-content: space-between;
}

.config-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.config-card {
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
  padding: 12px;
  background: var(--el-fill-color-blank);
}

.card-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.card-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.form-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.empty-block {
  padding: 12px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.switch-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.switch-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.size-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.size-separator {
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

.size-inputs :deep(.el-input-number) {
  width: 130px;
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

:deep(.el-form-item__content) {
  width: 100%;
}

:deep(.el-divider) {
  margin: 20px 0;
}
</style>
