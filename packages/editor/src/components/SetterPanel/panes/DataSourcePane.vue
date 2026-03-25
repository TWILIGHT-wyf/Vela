<template>
  <div class="data-source-pane" data-testid="data-source-pane">
    <el-empty v-if="!node" description="请选择一个组件" :image-size="80">
      <template #image>
        <el-icon :size="64"><Select /></el-icon>
      </template>
    </el-empty>

    <div v-else class="pane-content">
      <div class="pane-header">
        <div>
          <div class="pane-title">数据源配置</div>
          <div class="pane-subtitle">
            为 {{ node.component || node.componentName || '当前组件' }} 配置远程数据与字段映射
          </div>
        </div>
        <el-switch
          :model-value="enabled"
          inline-prompt
          active-text="启用"
          inactive-text="关闭"
          @change="setField('enabled', $event)"
        />
      </div>

      <el-form label-position="top" size="default" class="data-source-form">
        <el-collapse v-model="activeGroups" class="data-source-collapse">
          <el-collapse-item title="请求配置" name="request">
            <div class="grid-two">
              <el-form-item label="请求地址">
                <el-input
                  :model-value="getStringField('url')"
                  placeholder="/api/mock/list"
                  @update:model-value="setField('url', $event)"
                />
              </el-form-item>

              <el-form-item label="请求方法">
                <el-select
                  :model-value="getStringField('method', 'GET')"
                  @update:model-value="setField('method', $event)"
                >
                  <el-option label="GET" value="GET" />
                  <el-option label="POST" value="POST" />
                  <el-option label="PUT" value="PUT" />
                  <el-option label="DELETE" value="DELETE" />
                </el-select>
              </el-form-item>
            </div>

            <div class="grid-two">
              <el-form-item label="轮询间隔(秒)">
                <el-input-number
                  :model-value="getNumberField('interval')"
                  :min="0"
                  :step="1"
                  controls-position="right"
                  @change="setNumberField('interval', $event)"
                />
              </el-form-item>

              <el-form-item label="主数据路径">
                <el-input
                  :model-value="getStringField('dataPath')"
                  placeholder="data / result.list"
                  @update:model-value="setField('dataPath', $event)"
                />
              </el-form-item>
            </div>

            <el-form-item label="请求头(JSON)">
              <el-input
                :model-value="requestHeadersText"
                type="textarea"
                :rows="3"
                placeholder='{"Authorization":"Bearer xxx"}'
                @change="setJsonField('headers', $event)"
              />
            </el-form-item>

            <el-form-item label="请求体(JSON 字符串)">
              <el-input
                :model-value="getStringField('body')"
                type="textarea"
                :rows="3"
                placeholder='{"page":1,"pageSize":20}'
                @update:model-value="setField('body', $event)"
              />
            </el-form-item>
          </el-collapse-item>

          <el-collapse-item title="字段映射" name="mapping">
            <div class="grid-two">
              <el-form-item label="标题路径">
                <el-input
                  :model-value="getStringField('titlePath')"
                  placeholder="data.title"
                  @update:model-value="setField('titlePath', $event)"
                />
              </el-form-item>

              <el-form-item label="数值路径">
                <el-input
                  :model-value="getStringField('valuePath')"
                  placeholder="data.value"
                  @update:model-value="setField('valuePath', $event)"
                />
              </el-form-item>
            </div>

            <div class="grid-two">
              <el-form-item label="变化值路径">
                <el-input
                  :model-value="getStringField('changePath')"
                  placeholder="data.change"
                  @update:model-value="setField('changePath', $event)"
                />
              </el-form-item>

              <el-form-item label="状态路径">
                <el-input
                  :model-value="getStringField('statusPath')"
                  placeholder="data.status"
                  @update:model-value="setField('statusPath', $event)"
                />
              </el-form-item>
            </div>

            <div class="grid-two">
              <el-form-item label="X 轴路径">
                <el-input
                  :model-value="getStringField('xAxisPath')"
                  placeholder="result.xAxis"
                  @update:model-value="setField('xAxisPath', $event)"
                />
              </el-form-item>

              <el-form-item label="系列名路径">
                <el-input
                  :model-value="getStringField('seriesNamesPath')"
                  placeholder="result.seriesNames"
                  @update:model-value="setField('seriesNamesPath', $event)"
                />
              </el-form-item>
            </div>

            <div class="grid-two">
              <el-form-item label="系列数据路径">
                <el-input
                  :model-value="getStringField('seriesDataPath')"
                  placeholder="result.series"
                  @update:model-value="setField('seriesDataPath', $event)"
                />
              </el-form-item>

              <el-form-item label="标签路径">
                <el-input
                  :model-value="getStringField('labelsPath')"
                  placeholder="data.labels"
                  @update:model-value="setField('labelsPath', $event)"
                />
              </el-form-item>
            </div>

            <div class="grid-two">
              <el-form-item label="URL 字段">
                <el-input
                  :model-value="getStringField('urlField')"
                  placeholder="data.url"
                  @update:model-value="setField('urlField', $event)"
                />
              </el-form-item>

              <el-form-item label="内容字段">
                <el-input
                  :model-value="getStringField('contentField')"
                  placeholder="data.content"
                  @update:model-value="setField('contentField', $event)"
                />
              </el-form-item>
            </div>

            <div class="grid-two">
              <el-form-item label="封面字段">
                <el-input
                  :model-value="getStringField('posterField')"
                  placeholder="data.poster"
                  @update:model-value="setField('posterField', $event)"
                />
              </el-form-item>

              <el-form-item label="节点路径">
                <el-input
                  :model-value="getStringField('nodesPath')"
                  placeholder="data.nodes"
                  @update:model-value="setField('nodesPath', $event)"
                />
              </el-form-item>
            </div>

            <el-form-item label="连线路径">
              <el-input
                :model-value="getStringField('linksPath')"
                placeholder="data.links"
                @update:model-value="setField('linksPath', $event)"
              />
            </el-form-item>
          </el-collapse-item>

          <el-collapse-item title="高级扩展" name="advanced">
            <el-alert
              type="info"
              :closable="false"
              show-icon
              title="这里用于保存当前面板未显式覆盖的 dataSource 字段，便于保留协议扩展能力。"
            />

            <el-form-item label="额外字段(JSON)">
              <el-input
                :model-value="extraFieldsText"
                type="textarea"
                :rows="6"
                placeholder='{"customParam":"value"}'
                @change="setExtraFields($event)"
              />
            </el-form-item>

            <div class="actions-row">
              <el-button @click="resetDataSource">清空数据源</el-button>
            </div>
          </el-collapse-item>
        </el-collapse>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Select } from '@element-plus/icons-vue'
import type { NodeSchema } from '@vela/core'
import { useComponent } from '@/stores/component'

interface Props {
  node?: NodeSchema | null
}

const props = defineProps<Props>()
const componentStore = useComponent()
const activeGroups = ref(['request', 'mapping'])

const RESERVED_FIELDS = [
  'enabled',
  'url',
  'method',
  'headers',
  'body',
  'interval',
  'dataPath',
  'urlField',
  'posterField',
  'contentField',
  'valuePath',
  'statusPath',
  'titlePath',
  'changePath',
  'xAxisPath',
  'seriesNamesPath',
  'seriesDataPath',
  'labelsPath',
  'nodesPath',
  'linksPath',
] as const

type ReservedField = (typeof RESERVED_FIELDS)[number]

const dataSourceRecord = computed<Record<string, unknown>>(() => {
  if (!props.node?.dataSource || typeof props.node.dataSource !== 'object') {
    return {}
  }
  return props.node.dataSource as Record<string, unknown>
})

const enabled = computed(() => Boolean(dataSourceRecord.value.enabled))

const requestHeadersText = computed(() => formatJson(dataSourceRecord.value.headers))

const extraFieldsText = computed(() => {
  const extras: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(dataSourceRecord.value)) {
    if (!RESERVED_FIELDS.includes(key as ReservedField)) {
      extras[key] = value
    }
  }
  return formatJson(extras)
})

function cloneRecord(value: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value))
}

function parseJson(input: unknown): { ok: true; value: unknown } | { ok: false } {
  const text = typeof input === 'string' ? input.trim() : ''
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

function commitDataSource(nextSource: Record<string, unknown>) {
  if (!props.node) return

  const previous = cloneRecord(dataSourceRecord.value)
  const patch: Record<string, unknown> = {}
  const keys = new Set([...Object.keys(previous), ...Object.keys(nextSource)])

  keys.forEach((key) => {
    const prevValue = previous[key]
    const nextValue = nextSource[key]
    if (JSON.stringify(prevValue) !== JSON.stringify(nextValue)) {
      patch[key] = nextValue
    }
    if (!(key in nextSource)) {
      patch[key] = undefined
    }
  })

  if (Object.keys(patch).length === 0) return
  componentStore.updateDataSource(props.node.id, patch)
}

function setField(field: ReservedField, value: unknown) {
  const nextSource = cloneRecord(dataSourceRecord.value)
  const normalized =
    typeof value === 'string' ? value.trim() : value

  if (
    normalized === '' ||
    normalized === null ||
    normalized === undefined ||
    (field === 'enabled' && normalized === false)
  ) {
    delete nextSource[field]
  } else {
    nextSource[field] = normalized
  }

  if (field === 'enabled' && normalized === true && !nextSource.method) {
    nextSource.method = 'GET'
  }

  commitDataSource(nextSource)
}

function setNumberField(field: 'interval', value: unknown) {
  const nextValue =
    typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined
  setField(field, nextValue)
}

function setJsonField(field: 'headers', value: unknown) {
  const parsed = parseJson(value)
  if (!parsed.ok) return
  setField(field, parsed.value)
}

function setExtraFields(value: unknown) {
  const parsed = parseJson(value)
  if (!parsed.ok) return

  const nextSource = cloneRecord(dataSourceRecord.value)
  for (const key of Object.keys(nextSource)) {
    if (!RESERVED_FIELDS.includes(key as ReservedField)) {
      delete nextSource[key]
    }
  }

  if (parsed.value && typeof parsed.value === 'object') {
    for (const [key, fieldValue] of Object.entries(parsed.value as Record<string, unknown>)) {
      if (!RESERVED_FIELDS.includes(key as ReservedField)) {
        nextSource[key] = fieldValue
      }
    }
  }

  commitDataSource(nextSource)
}

function resetDataSource() {
  commitDataSource({})
}

function getStringField(field: ReservedField, fallback = ''): string {
  const value = dataSourceRecord.value[field]
  if (typeof value === 'string') return value
  if (value === undefined || value === null) return fallback
  return String(value)
}

function getNumberField(field: 'interval'): number | undefined {
  const value = dataSourceRecord.value[field]
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}
</script>

<style scoped>
.data-source-pane {
  height: 100%;
}

.pane-content {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  box-sizing: border-box;
}

.pane-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.pane-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 6px;
}

.pane-subtitle {
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.data-source-form {
  width: 100%;
}

.data-source-collapse {
  border: none;
}

.data-source-collapse :deep(.el-collapse-item__header) {
  font-weight: 500;
  padding-left: 0;
  background: transparent;
}

.data-source-collapse :deep(.el-collapse-item__content) {
  padding-left: 0;
}

.grid-two {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.actions-row {
  display: flex;
  justify-content: flex-end;
}

.data-source-form :deep(.el-form-item) {
  margin-bottom: 16px;
}

.data-source-form :deep(.el-form-item__content) {
  width: 100%;
}

.data-source-form :deep(.el-input-number) {
  width: 100%;
}

@media (max-width: 1200px) {
  .grid-two {
    grid-template-columns: 1fr;
  }

  .pane-header {
    flex-direction: column;
  }
}
</style>
