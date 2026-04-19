<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useUIStore } from '@/stores/ui'
import { useProjectStore } from '@/stores/project'
import { useComponent } from '@/stores/component'
import { useHistoryStore } from '@/stores/history'
import { useRuntimePlugins } from '@/composables/useRuntimePlugins'

// Components
import AppHeader from '@/components/shell/AppHeader.vue'
import MaterialPanel from '@/components/MaterialPanel/MaterialPanel.vue'
import SetterPanel from '@/components/SetterPanel/SetterPanel.vue'
import LogicPanel from '@/components/LogicPanel/LogicPanel.vue'
import DraggablePanel from '@/components/common/DraggablePanel.vue'
import { RuntimeRenderer } from '@vela/renderer'

// Canvas Components (New Architecture)
import CanvasBoard from '@/components/Canvas/CanvasBoard.vue'

// Services & Icons
import * as projectService from '@/services/projects'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Menu,
  Setting,
  Grid,
  VideoPlay,
  VideoPause,
  Loading,
  Back,
  Right,
  Delete,
} from '@element-plus/icons-vue'

// --- Stores ---
const uiStore = useUIStore()
const projectStore = useProjectStore()
const componentStore = useComponent()
const historyStore = useHistoryStore()
const router = useRouter()

const { rootNode } = storeToRefs(componentStore)
const { isSimulationMode } = storeToRefs(uiStore)
const { toggleSimulationMode } = uiStore
const { canUndo, canRedo } = storeToRefs(historyStore)
const { undo, redo, clear: resetHistory } = historyStore
const runtimePlugins = useRuntimePlugins()
const runtimePages = computed(() =>
  projectStore.project.pages
    .filter((page) => page.type === 'page')
    .map((page) => ({
      id: page.id,
      name: page.name,
      route: page.path,
      path: page.path,
      actions: page.actions || [],
    })),
)
const runtimeProjectMode = computed(() => runtimePages.value.length > 1)

// --- Panel States ---
const showMaterials = ref(true)
const showSettings = ref(true)
const showLogic = ref(false)
const showHeader = ref(true)

// --- Initial Positions ---
const initialLogicX = ref(Math.max(20, window.innerWidth - 780))
const initialSetterX = ref(Math.max(20, window.innerWidth - 340))

// --- Loading State ---
const isLoading = ref(true)

// --- Initialization ---
onMounted(async () => {
  const projectId = router.currentRoute.value.params.id as string

  if (!projectId) {
    if (projectStore.project.pages.length === 0) projectStore.initProject()
    isLoading.value = false
    return
  }

  try {
    const project = await projectService.getProject(projectId)
    if (project?.schema) {
      projectStore.initProject(project.schema)
      ElMessage.success('Vela Studio Ready')
    } else {
      throw new Error('Invalid Project Data')
    }
  } catch (error) {
    console.warn('Load failed:', error)
    ElMessage.error('Failed to load project')
  } finally {
    isLoading.value = false
  }
})

// --- Handlers ---
const togglePanel = (panel: 'materials' | 'logic' | 'settings') => {
  if (panel === 'materials') showMaterials.value = !showMaterials.value
  if (panel === 'logic') showLogic.value = !showLogic.value
  if (panel === 'settings') showSettings.value = !showSettings.value
}

const toggleHeader = () => {
  showHeader.value = !showHeader.value
}

// Reset Logic
async function handleReset() {
  try {
    await ElMessageBox.confirm('确定清空当前页面的所有组件吗？此操作不可恢复', '警告', {
      type: 'warning',
      confirmButtonText: '清空',
      cancelButtonText: '取消',
    })

    const currentPage = projectStore.currentPage
    if (currentPage && currentPage.children) {
      currentPage.children.children = []
      componentStore.loadTree(currentPage.children)
      resetHistory()
    }
    ElMessage.success('画布已清空')
  } catch {
    // Cancelled
  }
}

function handleRuntimeNavigate(pageId: string) {
  projectStore.switchPage(pageId)
}
</script>

<template>
  <div class="immersive-editor">
    <!-- 0. Loading Screen -->
    <div v-if="isLoading" class="loading-screen">
      <el-icon class="loading-icon" :size="48"><Loading /></el-icon>
      <p>Loading Vela Studio...</p>
    </div>

    <template v-else>
      <!-- 1. Layer 0: Infinite Canvas -->
      <div class="canvas-layer">
        <CanvasBoard v-if="!isSimulationMode" />

        <RuntimeRenderer
          v-else
          :root-node="rootNode || undefined"
          :pages="runtimePages"
          :is-project-mode="runtimeProjectMode"
          mode="simulation"
          :plugins="runtimePlugins"
          @navigate-page="handleRuntimeNavigate"
        />
      </div>

      <!-- 2. Layer 50: Floating Header Island -->
      <div v-show="showHeader" class="header-island glass-panel">
        <AppHeader />
      </div>

      <!-- 3. Layer 10: Floating Panels -->
      <DraggablePanel
        v-model:visible="showMaterials"
        title="组件库"
        :initialX="20"
        :initialY="80"
        width="280px"
        height="calc(100vh - 180px)"
      >
        <MaterialPanel />
      </DraggablePanel>

      <DraggablePanel
        v-model:visible="showLogic"
        title="逻辑面板"
        :initialX="initialLogicX"
        :initialY="80"
        width="460px"
        height="calc(100vh - 180px)"
      >
        <LogicPanel />
      </DraggablePanel>

      <DraggablePanel
        v-model:visible="showSettings"
        title="属性配置"
        :initialX="initialSetterX"
        :initialY="80"
        width="320px"
        height="calc(100vh - 180px)"
      >
        <SetterPanel />
      </DraggablePanel>

      <!-- 4. Layer 100: macOS Dock -->
      <div class="dock-container">
        <div class="mac-dock glass-panel">
          <!-- Group 1: Panels -->
          <el-tooltip content="组件库" placement="top" :offset="12">
            <button
              class="dock-item vela-dock-item"
              data-testid="toggle-material-panel"
              :class="{ active: showMaterials }"
              @click="togglePanel('materials')"
            >
              <el-icon><Menu /></el-icon>
            </button>
          </el-tooltip>

          <el-tooltip content="属性配置" placement="top" :offset="12">
            <button
              class="dock-item vela-dock-item"
              data-testid="toggle-setter-panel"
              :class="{ active: showSettings }"
              @click="togglePanel('settings')"
            >
              <el-icon><Setting /></el-icon>
            </button>
          </el-tooltip>

          <el-tooltip content="逻辑面板" placement="top" :offset="12">
            <button
              class="dock-item vela-dock-item"
              data-testid="toggle-logic-panel"
              :class="{ active: showLogic }"
              @click="togglePanel('logic')"
            >
              <el-icon><Grid /></el-icon>
            </button>
          </el-tooltip>

          <el-tooltip
            :content="showHeader ? '隐藏顶部栏' : '显示顶部栏'"
            placement="top"
            :offset="12"
          >
            <button
              class="dock-item vela-dock-item"
              data-testid="toggle-header"
              :class="{ active: showHeader }"
              @click="toggleHeader"
            >
              <span class="dock-mini-label">H</span>
            </button>
          </el-tooltip>

          <div class="dock-divider vela-dock-divider"></div>

          <div class="dock-divider"></div>

          <!-- Group 3: Tools -->
          <el-tooltip content="撤销 (Ctrl+Z)" placement="top" :offset="12">
            <button
              class="dock-item vela-dock-item"
              data-testid="dock-undo"
              @click="undo"
              :disabled="!canUndo"
              :class="{ disabled: !canUndo }"
            >
              <el-icon><Back /></el-icon>
            </button>
          </el-tooltip>

          <el-tooltip content="重做 (Ctrl+Y)" placement="top" :offset="12">
            <button
              class="dock-item vela-dock-item"
              data-testid="dock-redo"
              @click="redo"
              :disabled="!canRedo"
              :class="{ disabled: !canRedo }"
            >
              <el-icon><Right /></el-icon>
            </button>
          </el-tooltip>

          <el-tooltip content="清空画布" placement="top" :offset="12">
            <button
              class="dock-item vela-dock-item danger-hover"
              data-testid="dock-reset"
              @click="handleReset"
            >
              <el-icon><Delete /></el-icon>
            </button>
          </el-tooltip>

          <div class="dock-divider vela-dock-divider"></div>
          <div class="dock-divider vela-dock-divider"></div>

          <el-tooltip
            :content="isSimulationMode ? '停止运行' : '模拟运行'"
            placement="top"
            :offset="12"
          >
            <button
              class="dock-item vela-dock-item run-btn"
              data-testid="dock-simulation-toggle"
              :class="{ 'is-running': isSimulationMode }"
              @click="toggleSimulationMode"
            >
              <el-icon v-if="!isSimulationMode"><VideoPlay /></el-icon>
              <el-icon v-else><VideoPause /></el-icon>
            </button>
          </el-tooltip>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.immersive-editor {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: var(--bg-app);
}

/* Layer 0: Canvas */
.canvas-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

/* Layer 50: Header */
.header-island {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 1200px;
  height: 56px;
  z-index: 50;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  padding: 0 8px;
  transition: all 0.3s;
}

/* Layer 100: Dock */
.dock-container {
  position: absolute;
  bottom: 24px;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  z-index: 100;
  pointer-events: none; /* Let clicks pass through outside the dock */
}

.mac-dock {
  pointer-events: auto;
  height: 64px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-radius: 24px;
  transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.dock-item {
  /* 通用 dock item 样式抽离到 patterns.css 的 .vela-dock-item */
}

.dock-item.danger-hover:hover {
  color: #ef4444;
  background: var(--surface-danger-soft);
}

.dock-mini-label {
  font-size: 16px;
  font-weight: 700;
  line-height: 1;
}

.run-btn:hover {
  color: #10b981;
}

.run-btn.is-running {
  background: #fef2f2;
  color: #ef4444;
}

/* Loading */
.loading-screen {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: var(--text-secondary);
}

.loading-icon {
  animation: rotate 1.5s linear infinite;
  color: var(--color-primary);
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
