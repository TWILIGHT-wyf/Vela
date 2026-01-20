<template>
  <el-dialog
    v-model="dialogVisible"
    class="export-config-dialog"
    width="480px"
    append-to-body
    align-center
    :close-on-click-modal="false"
  >
    <template #header>
      <div class="dialog-header">
        <div class="header-text">
          <p class="title">导出项目源码</p>
          <p class="subtitle">{{ headerDescription }}</p>
        </div>
        <el-tag size="small" effect="dark" type="info">{{
          form.language === 'ts' ? 'TS' : 'JS'
        }}</el-tag>
      </div>
    </template>

    <el-form label-position="top" class="export-form">
      <el-form-item label="语言偏好">
        <el-radio-group v-model="form.language">
          <el-radio-button label="ts">TypeScript</el-radio-button>
          <el-radio-button label="js">JavaScript</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item>
        <el-checkbox v-model="form.lint">包含 ESLint / Prettier 基础配置</el-checkbox>
      </el-form-item>

      <el-alert
        type="info"
        :closable="false"
        show-icon
        class="tip"
        title="导出内容包含 Vite + Vue 3 工程、路由、Pinia 与 Element Plus"
      />
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button text @click="handleCancel" :disabled="isExporting">稍后再说</el-button>
        <el-button type="primary" @click="handleConfirm" :loading="isExporting">
          确认导出
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  exportProjectToZip,
  type ExportOptions,
  type Project,
} from '@vela/generator/projectGenerator'

const STORAGE_KEY = 'vela-export-preferences'

const props = defineProps<{
  modelValue: boolean
  project: Project | null
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const form = reactive<ExportOptions>({
  language: 'ts',
  lint: true,
})

const isExporting = ref(false)

const headerDescription = computed(() => {
  if (!props.project) {
    return '未检测到项目，请返回编辑器重试'
  }
  const pageCount = props.project.pages?.length || 0
  return `${props.project.name || '未命名项目'} · ${pageCount} 个页面`
})

if (typeof window !== 'undefined') {
  const persisted = window.localStorage.getItem(STORAGE_KEY)
  if (persisted) {
    try {
      const parsed = JSON.parse(persisted)
      if (parsed.language === 'js' || parsed.language === 'ts') {
        form.language = parsed.language
      }
      form.lint = typeof parsed.lint === 'boolean' ? parsed.lint : form.lint
    } catch (error) {
      console.warn('[ExportConfigDialog] 解析偏好失败', error)
    }
  }

  watch(
    () => ({ language: form.language, lint: form.lint }),
    (preferences) => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    },
    { deep: false },
  )
}

function handleCancel() {
  if (!isExporting.value) {
    dialogVisible.value = false
  }
}

async function handleConfirm() {
  if (!props.project) {
    ElMessage.warning('没有可导出的项目，请返回编辑器确认。')
    return
  }

  isExporting.value = true
  try {
    await exportProjectToZip(props.project, { ...form })
    ElMessage.success('源码正在下载，请稍候...')
    dialogVisible.value = false
  } catch (error) {
    console.error('导出失败', error)
    ElMessage.error('导出失败，请重试')
  } finally {
    isExporting.value = false
  }
}
</script>

<style scoped>
.export-config-dialog :deep(.el-dialog__body) {
  padding-top: 8px;
  background: #0f111a;
}

.export-config-dialog :deep(.el-dialog__header) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: #0b0d16;
}

.export-config-dialog :deep(.el-dialog__footer) {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: #0b0d16;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #f0f4ff;
}

.header-text .title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.header-text .subtitle {
  margin: 4px 0 0;
  font-size: 12px;
  color: #8a92b2;
}

.export-form {
  padding: 8px 10px 4px;
  color: #e7ebff;
}

.export-form :deep(.el-form-item__label) {
  color: #b8c0d3;
}

.tip {
  margin-top: 12px;
  border-radius: 10px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
