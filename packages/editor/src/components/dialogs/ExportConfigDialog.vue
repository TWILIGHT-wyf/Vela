<template>
  <el-dialog
    v-model="dialogVisible"
    class="export-config-dialog"
    width="520px"
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
        <div class="header-tags">
          <el-tag size="small" effect="dark" :type="form.framework === 'vue3' ? 'success' : 'primary'">
            {{ form.framework === 'vue3' ? 'Vue 3' : 'React' }}
          </el-tag>
          <el-tag size="small" effect="dark" type="info">
            {{ form.language === 'ts' ? 'TS' : 'JS' }}
          </el-tag>
        </div>
      </div>
    </template>

    <el-form label-position="top" class="export-form">
      <el-form-item label="目标框架">
        <el-radio-group v-model="form.framework" class="framework-group">
          <el-radio-button value="vue3">
            <div class="framework-option">
              <span class="framework-icon vue-icon">V</span>
              <span class="framework-name">Vue 3</span>
              <span class="framework-desc">Vite + Pinia + Element Plus</span>
            </div>
          </el-radio-button>
          <el-radio-button value="react">
            <div class="framework-option">
              <span class="framework-icon react-icon">R</span>
              <span class="framework-name">React</span>
              <span class="framework-desc">Vite + Zustand + Ant Design</span>
            </div>
          </el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="语言偏好">
        <el-radio-group v-model="form.language">
          <el-radio-button value="ts">TypeScript</el-radio-button>
          <el-radio-button value="js">JavaScript</el-radio-button>
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
        :title="frameworkTip"
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
import type { ProjectSchema } from '@vela/core'

interface ExportFormOptions {
  framework: 'vue3' | 'react'
  language: 'ts' | 'js'
  lint: boolean
}

const STORAGE_KEY = 'vela-export-preferences'

const props = defineProps<{
  modelValue: boolean
  project: ProjectSchema | null
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const form = reactive<ExportFormOptions>({
  language: 'ts',
  lint: true,
  framework: 'vue3',
})

const isExporting = ref(false)

const headerDescription = computed(() => {
  if (!props.project) {
    return '未检测到项目，请返回编辑器重试'
  }
  const pageCount = props.project.pages?.length || 0
  return `${props.project.name || '未命名项目'} · ${pageCount} 个页面`
})

const frameworkTip = computed(() => {
  if (form.framework === 'vue3') {
    return '导出内容包含 Vite + Vue 3 工程、路由、Pinia 与 Element Plus'
  }
  return '导出内容包含 Vite + React 工程、路由、Zustand 与 Ant Design'
})

if (typeof window !== 'undefined') {
  const persisted = window.localStorage.getItem(STORAGE_KEY)
  if (persisted) {
    try {
      const parsed = JSON.parse(persisted)
      if (parsed.language === 'js' || parsed.language === 'ts') {
        form.language = parsed.language
      }
      if (parsed.framework === 'vue3' || parsed.framework === 'react') {
        form.framework = parsed.framework
      }
      form.lint = typeof parsed.lint === 'boolean' ? parsed.lint : form.lint
    } catch (error) {
      console.warn('[ExportConfigDialog] 解析偏好失败', error)
    }
  }

  watch(
    () => ({ language: form.language, lint: form.lint, framework: form.framework }),
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
    const { generateFromProject } = await import('@vela/generator')
    const result = generateFromProject(props.project, {
      framework: form.framework,
      continueOnError: true,
      vue: {
        language: form.language,
        lint: form.lint,
      },
      react: {
        typescript: form.language === 'ts',
        cssModules: true,
        router: 'react-router',
        stateManagement: 'zustand',
      },
    })

    const files = [...result.files]
    if (result.diagnostics.length > 0) {
      const diagnostics = result.diagnostics
        .map((item) => {
          const path = item.path ? ` [${item.path}]` : ''
          return `[${item.level.toUpperCase()}][${item.code}]${path} ${item.message}`
        })
        .join('\n')

      files.push({
        path: 'vela.diagnostics.txt',
        content: diagnostics,
      })
    }

    await downloadAsZip(props.project.name || `${form.framework}-project`, files)

    ElMessage.success('源码正在下载，请稍候...')
    dialogVisible.value = false
  } catch (error) {
    console.error('导出失败', error)
    ElMessage.error('导出失败，请重试')
  } finally {
    isExporting.value = false
  }
}

/**
 * 将文件列表打包为 ZIP 并下载
 */
async function downloadAsZip(projectName: string, files: { path: string; content: string }[]) {
  // 动态导入 JSZip
  const JSZip = (await import('jszip')).default
  const { saveAs } = await import('file-saver')

  const zip = new JSZip()
  const root = zip.folder(projectName)

  if (!root) {
    throw new Error('初始化 ZIP 结构失败')
  }

  for (const file of files) {
    root.file(file.path, file.content)
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  saveAs(blob, `${projectName}.zip`)
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

.header-tags {
  display: flex;
  gap: 8px;
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

/* 框架选择组 */
.framework-group {
  display: flex;
  gap: 12px;
  width: 100%;
}

.framework-group :deep(.el-radio-button) {
  flex: 1;
}

.framework-group :deep(.el-radio-button__inner) {
  width: 100%;
  padding: 12px 16px;
  border-radius: 8px !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  background: rgba(255, 255, 255, 0.03);
  height: auto;
}

.framework-group :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: rgba(64, 158, 255, 0.15);
  border-color: var(--el-color-primary) !important;
}

.framework-option {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.framework-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 4px;
}

.vue-icon {
  background: linear-gradient(135deg, #42b883 0%, #35495e 100%);
  color: #fff;
}

.react-icon {
  background: linear-gradient(135deg, #61dafb 0%, #20232a 100%);
  color: #fff;
}

.framework-name {
  font-size: 14px;
  font-weight: 600;
  color: #f0f4ff;
}

.framework-desc {
  font-size: 11px;
  color: #8a92b2;
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
