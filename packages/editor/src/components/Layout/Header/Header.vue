<template>
  <div class="vela-header">
    <div class="left-section">
      <!-- 品牌区 -->
      <el-tooltip content="返回项目列表" placement="bottom">
        <div class="brand" @click="goHome">
          <div class="brand-logo">
            <el-icon :size="20"><MapLocation /></el-icon>
          </div>
          <span class="brand-text">Vela</span>
        </div>
      </el-tooltip>

      <div class="divider-dot"></div>

      <!-- 页面导航器 -->
      <PageNavigator />

      <div class="divider-line"></div>

      <!-- 画布模式切换 -->
      <div class="canvas-mode-toggle">
        <el-segmented
          :model-value="canvasMode"
          @update:model-value="handleCanvasModeChange"
          :options="canvasModeOptions"
          size="small"
          class="vela-segmented"
        />
      </div>
    </div>

    <div class="right-section">
      <!-- 保存状态指示器 -->
      <SaveStatusIndicator />

      <div class="divider-line"></div>

      <!-- 操作按钮组 -->
      <div class="action-group">
        <el-tooltip content="保存项目到服务器" placement="bottom">
          <el-button text circle class="icon-btn" @click="saveProject" :loading="saving">
            <el-icon><Finished /></el-icon>
          </el-button>
        </el-tooltip>

        <el-tooltip content="导出源码" placement="bottom">
          <el-button circle class="icon-btn primary-soft" @click="openExportDialog">
            <el-icon><Download /></el-icon>
          </el-button>
        </el-tooltip>

        <el-tooltip content="导出 JSON 文件" placement="bottom">
          <el-button text circle class="icon-btn" @click="exportJSON">
            <el-icon><Document /></el-icon>
          </el-button>
        </el-tooltip>
      </div>

      <div class="divider-line"></div>

      <!-- 预览下拉菜单 -->
      <el-dropdown
        split-button
        type="default"
        class="vela-dropdown"
        @click="openPreview('page')"
        @command="handlePreviewCommand"
      >
        <span class="dropdown-label">
          <el-icon class="icon-left"><View /></el-icon> 预览
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="page" icon="Document">预览当前页面</el-dropdown-item>
            <el-dropdown-item command="project" icon="Files">预览整个项目</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <div class="divider-line"></div>

      <!-- 主题切换 -->
      <el-switch
        v-model="isDark"
        inline-prompt
        :active-icon="Moon"
        :inactive-icon="Sunny"
        class="theme-switch"
      />
    </div>

    <!-- 导出配置对话框 -->
    <ExportConfigDialog v-model="exportDialogVisible" :project="projectStore.project || null" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useProjectStore } from '@/stores/project'
import { useUIStore } from '@/stores/ui'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageNavigator from './PageNavigator.vue'
import SaveStatusIndicator from './SaveStatusIndicator.vue'
import ExportConfigDialog from '@/components/dialogs/ExportConfigDialog.vue'
import {
  View,
  Finished,
  Download,
  Document,
  Moon,
  Sunny,
  MapLocation,
} from '@element-plus/icons-vue'

const router = useRouter()
const projectStore = useProjectStore()
const uiStore = useUIStore()

const { canvasMode } = storeToRefs(uiStore)
const { activePageId } = storeToRefs(projectStore)

// 状态
const saving = ref(false)
const exportDialogVisible = ref(false)
const isDark = ref(false)

// Canvas mode options
const canvasModeOptions = [
  { label: '自由布局', value: 'free' },
  { label: '流式布局', value: 'flow' },
]

// Handle canvas mode change with confirmation
async function handleCanvasModeChange(newMode: 'free' | 'flow') {
  if (newMode === canvasMode.value) return

  try {
    await ElMessageBox.confirm(
      newMode === 'flow'
        ? '切换到流式布局将移除所有组件的位置坐标，并按原Y坐标顺序重新排列。此操作可能导致布局变化，是否继续？'
        : '切换到自由布局将为所有组件添加绝对定位，并设置初始坐标。此操作可能导致布局变化，是否继续？',
      '切换布局模式',
      {
        confirmButtonText: '确认切换',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )

    // 用户确认，执行切换
    const success = projectStore.changePageLayout(activePageId.value, newMode)

    if (success) {
      // UI store 会通过 watcher 自动同步
      ElMessage.success(`已切换到${newMode === 'free' ? '自由' : '流式'}布局`)
    }
  } catch {
    // 用户取消，不做任何操作
    console.log('[Header] Layout change cancelled')
  }
}

// 返回首页
function goHome() {
  router.push('/')
}

// 保存项目
async function saveProject() {
  saving.value = true
  try {
    await projectStore.saveProject()
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    saving.value = false
  }
}

// 打开导出对话框
function openExportDialog() {
  if (!projectStore.project) {
    ElMessage.warning('请先创建或加载项目')
    return
  }
  exportDialogVisible.value = true
}

// 导出 JSON
function exportJSON() {
  if (!projectStore.project) {
    ElMessage.warning('没有可导出的项目')
    return
  }

  const json = JSON.stringify(projectStore.project, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${projectStore.project.name || 'project'}_${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('项目已导出为 JSON 文件')
}

// 预览
function openPreview(mode: 'page' | 'project' = 'page') {
  router.push('/preview')
}

function handlePreviewCommand(command: string) {
  openPreview(command as 'page' | 'project')
}

// 主题切换
watch(isDark, (val) => {
  localStorage.setItem('theme', val ? 'dark' : 'light')
  document.body.classList.toggle('theme-dark', val)
})

onMounted(() => {
  isDark.value = localStorage.getItem('theme') === 'dark'
  if (isDark.value) {
    document.body.classList.add('theme-dark')
  }
})
</script>

<style scoped>
.vela-header {
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* Background is now handled by Layout Shell */
  background: transparent;
  padding: 0; /* Layout handles padding */
  box-sizing: border-box;
}

.left-section,
.right-section {
  display: flex;
  align-items: center;
  gap: 12px; /* Increased gap for breathability */
}

/* 品牌样式 */
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 4px;
  border-radius: 99px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  user-select: none;
}

.brand:hover {
  background-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-1px);
}

.brand-logo {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(11, 87, 208, 0.2);
}

.brand-text {
  font-weight: 700;
  font-size: 18px;
  color: var(--text-primary);
  letter-spacing: -0.5px;
}

/* 分隔符 */
.divider-line {
  width: 1px;
  height: 20px;
  background-color: var(--border-light);
}

.divider-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: var(--text-tertiary);
  opacity: 0.3;
}

/* 按钮与图标 */
.icon-btn {
  width: 36px;
  height: 36px;
  font-size: 16px;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.icon-btn:hover {
  color: var(--color-primary);
  background-color: rgba(11, 87, 208, 0.08);
}

.icon-btn.primary-soft {
  color: var(--color-primary);
  background-color: rgba(11, 87, 208, 0.05);
}

.icon-btn.primary-soft:hover {
  background-color: rgba(11, 87, 208, 0.15);
}

/* 下拉菜单调整 */
.dropdown-label {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Segmented Control 覆盖 */
.vela-segmented {
  --el-segmented-item-selected-bg-color: #fff;
  --el-segmented-bg-color: rgba(0, 0, 0, 0.05);
  box-shadow: none !important;
  padding: 2px;
}

.icon-left {
  margin-right: 6px;
}
</style>
