<template>
  <header class="vela-header">
    <div class="left-section">
      <!-- 品牌区 -->
      <el-tooltip content="返回项目列表" placement="bottom">
        <div class="brand" @click="goHome">
          <el-icon class="brand-icon" :size="20"><MapLocation /></el-icon>
          <span class="brand-text">Vela Engine</span>
        </div>
      </el-tooltip>

      <el-divider direction="vertical" class="header-divider" />

      <!-- 页面导航器 -->
      <PageNavigator />

      <el-divider direction="vertical" class="header-divider" />

      <!-- 历史记录控制 -->
      <div class="history-controls">
        <el-tooltip content="撤销 (Ctrl+Z)" placement="bottom">
          <el-button text circle @click="undo" :disabled="!canUndo">
            <el-icon><Back /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="重做 (Ctrl+Y)" placement="bottom">
          <el-button text circle @click="redo" :disabled="!canRedo">
            <el-icon><Right /></el-icon>
          </el-button>
        </el-tooltip>
      </div>

      <el-divider direction="vertical" class="header-divider" />

      <!-- 画布模式切换 -->
      <div class="canvas-mode-toggle">
        <el-segmented
          :model-value="canvasMode"
          @update:model-value="handleCanvasModeChange"
          :options="canvasModeOptions"
          size="small"
        />
      </div>
    </div>

    <div class="right-section">
      <!-- 保存状态指示器 -->
      <SaveStatusIndicator />

      <el-divider direction="vertical" class="header-divider" />

      <!-- 操作按钮组 -->
      <div class="action-group">
        <el-tooltip content="保存项目到服务器" placement="bottom">
          <el-button text circle @click="saveProject" :loading="saving">
            <el-icon><Finished /></el-icon>
          </el-button>
        </el-tooltip>

        <el-tooltip content="导出源码" placement="bottom">
          <el-button circle type="primary" plain class="export-btn" @click="openExportDialog">
            <el-icon><Download /></el-icon>
          </el-button>
        </el-tooltip>

        <el-tooltip content="导出 JSON 文件" placement="bottom">
          <el-button text circle @click="exportJSON">
            <el-icon><Document /></el-icon>
          </el-button>
        </el-tooltip>

        <el-tooltip content="清空当前页面" placement="bottom">
          <el-button text circle type="danger" @click="handleReset">
            <el-icon><Delete /></el-icon>
          </el-button>
        </el-tooltip>
      </div>

      <el-divider direction="vertical" class="header-divider" />

      <!-- 模拟运行开关 -->
      <el-tooltip :content="isSimulationMode ? '退出模拟运行' : '进入模拟运行'" placement="bottom">
        <el-button
          :type="isSimulationMode ? 'warning' : 'default'"
          :class="{ 'simulation-active': isSimulationMode }"
          @click="toggleSimulationMode"
        >
          <el-icon class="icon-left"
            ><VideoPlay v-if="!isSimulationMode" /><VideoPause v-else
          /></el-icon>
          {{ isSimulationMode ? '停止运行' : '模拟运行' }}
        </el-button>
      </el-tooltip>

      <!-- 预览下拉菜单 -->
      <el-dropdown
        split-button
        type="default"
        @click="openPreview('page')"
        @command="handlePreviewCommand"
      >
        <el-icon class="icon-left"><View /></el-icon>
        预览
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="page" icon="Document">预览当前页面</el-dropdown-item>
            <el-dropdown-item command="project" icon="Files">预览整个项目</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <!-- AI 助手 -->
      <el-button type="primary" round @click="openAIAssist" class="ai-btn">
        <el-icon class="icon-left"><MagicStick /></el-icon>
        AI 助手
        <el-badge v-if="pendingCount > 0" :value="pendingCount" is-dot class="ai-badge" />
      </el-button>

      <el-divider direction="vertical" class="header-divider" />

      <!-- 主题切换 -->
      <el-switch
        v-model="isDark"
        inline-prompt
        :active-icon="Moon"
        :inactive-icon="Sunny"
        style="margin-left: 4px"
      />
    </div>

    <!-- 导出配置对话框 -->
    <ExportConfigDialog v-model="exportDialogVisible" :project="projectStore.project || null" />
  </header>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useComponent } from '@/stores/component'
import { useProjectStore } from '@/stores/project'
import { useHistoryStore } from '@/stores/history'
import { useUIStore } from '@/stores/ui'
import { useSuggestion } from '@/stores/suggestion'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageNavigator from './PageNavigator.vue'
import SaveStatusIndicator from './SaveStatusIndicator.vue'
import ExportConfigDialog from '@/components/dialogs/ExportConfigDialog.vue'
import {
  Back,
  Right,
  View,
  MagicStick,
  Finished,
  Download,
  Document,
  Delete,
  Moon,
  Sunny,
  MapLocation,
  VideoPlay,
  VideoPause,
} from '@element-plus/icons-vue'

const router = useRouter()
const compStore = useComponent()
const projectStore = useProjectStore()
const historyStore = useHistoryStore()
const uiStore = useUIStore()
const suggestionStore = useSuggestion()

const { canUndo, canRedo } = storeToRefs(historyStore)
const { undo, redo, clear: resetHistory } = historyStore
const { canvasMode, isSimulationMode } = storeToRefs(uiStore)
const { toggleSimulationMode } = uiStore
const { activePageId } = storeToRefs(projectStore)

const pendingCount = computed(() => suggestionStore.pendingSuggestions.length)

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

// 状态
const saving = ref(false)
const exportDialogVisible = ref(false)
const isDark = ref(false)

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

// 清空画布
async function handleReset() {
  try {
    await ElMessageBox.confirm('确定清空当前页面的所有组件吗？此操作不可恢复', '警告', {
      type: 'warning',
      confirmButtonText: '清空',
      cancelButtonText: '取消',
    })

    // 清空当前页面的组件
    const currentPage = projectStore.currentPage
    if (currentPage && currentPage.children) {
      currentPage.children.children = []
      compStore.loadTree(currentPage.children)
      resetHistory()
    }

    ElMessage.success('画布已清空')
  } catch {
    // 用户取消
  }
}

// 预览
function openPreview(mode: 'page' | 'project' = 'page') {
  router.push('/preview')
}

function handlePreviewCommand(command: string) {
  openPreview(command as 'page' | 'project')
}

// AI 助手
const emit = defineEmits(['open-ai-assist'])
function openAIAssist() {
  emit('open-ai-assist')
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
  height: 48px;
  border-bottom: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  box-sizing: border-box;
}

.left-section,
.right-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 品牌样式 */
.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 18px;
  color: var(--el-text-color-primary);
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 8px;
  transition: all 0.2s;
  letter-spacing: -0.5px;
}

.brand:hover {
  background-color: rgba(66, 133, 244, 0.08);
  color: var(--el-color-primary);
}

.brand-icon {
  font-size: 20px;
  color: var(--el-color-primary);
}

.brand-text {
  font-weight: 700;
}

/* 分隔线 */
.header-divider {
  height: 16px;
  margin: 0 4px;
}

/* 历史记录控制 */
.history-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 操作按钮组 */
.action-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.export-btn {
  box-shadow: 0 0 8px rgba(66, 133, 244, 0.25);
}

/* AI 按钮 */
.ai-btn {
  position: relative;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
  font-weight: 500;
}

.ai-btn:hover {
  opacity: 0.9;
}

.ai-badge {
  position: absolute;
  top: -2px;
  right: -2px;
}

.icon-left {
  margin-right: 4px;
}

/* 模拟运行按钮 */
.simulation-active {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(230, 162, 60, 0.4);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(230, 162, 60, 0);
  }
}
</style>
