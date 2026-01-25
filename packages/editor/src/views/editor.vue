<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useUIStore } from '@/stores/ui'
import { useProjectStore } from '@/stores/project'
import { useComponent } from '@/stores/component'
import { useCanvasStore } from '@/stores/canvas'
import { useHistoryStore } from '@/stores/history'
import { useSizeStore } from '@/stores/size'

// Components
import Header from '@/components/Layout/Header/Header.vue'
import MaterialPanel from '@/components/MaterialPanel/MaterialPanel.vue'
import SetterPanel from '@/components/SetterPanel/SetterPanel.vue'
import DraggablePanel from '@/components/common/DraggablePanel.vue'
import AIAssistDialog from '@/components/AIAssist/AIAssistDialog.vue'
import { RuntimeRenderer } from '@vela/renderer'

// Canvas Components (New Architecture)
import CanvasViewport from '@/components/Canvas/CanvasViewport.vue'
import CanvasStage from '@/components/Canvas/CanvasStage.vue'
import ComponentRenderer from '@/components/Canvas/ComponentRenderer.vue'
import SelectionLayer from '@/components/Canvas/selection/SelectionLayer.vue'

// Services & Icons
import * as projectService from '@/services/projects'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Menu,
  Setting,
  VideoPlay,
  VideoPause,
  MagicStick,
  Loading,
  Back,
  Right,
  Delete,
} from '@element-plus/icons-vue'

// --- Stores ---
const uiStore = useUIStore()
const projectStore = useProjectStore()
const compStore = useComponent()
const canvasStore = useCanvasStore()
const sizeStore = useSizeStore()
const historyStore = useHistoryStore()
const router = useRouter()

const { rootNode } = storeToRefs(compStore)
const { isSimulationMode } = storeToRefs(uiStore)
const { toggleSimulationMode } = uiStore
const { canUndo, canRedo } = storeToRefs(historyStore)
const { undo, redo, clear: resetHistory } = historyStore

// --- Panel States ---
const showMaterials = ref(true)
const showSettings = ref(true)
const showLayers = ref(false)
const aiVisible = ref(false)

// --- Initial Positions ---
const initialSetterX = ref(window.innerWidth - 340)

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
const togglePanel = (panel: 'materials' | 'settings' | 'layers') => {
  if (panel === 'materials') showMaterials.value = !showMaterials.value
  if (panel === 'settings') showSettings.value = !showSettings.value
  if (panel === 'layers') showLayers.value = !showLayers.value
}

const handleOpenAIAssist = () => {
  aiVisible.value = true
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
      compStore.loadTree(currentPage.children)
      resetHistory()
    }
    ElMessage.success('画布已清空')
  } catch {
    // Cancelled
  }
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
        <CanvasViewport v-if="!isSimulationMode" ref="viewportRef">
          <CanvasStage
            :width="sizeStore.width"
            :height="sizeStore.height"
            :background-color="sizeStore.canvasConfig.backgroundColor"
            :show-grid="sizeStore.canvasConfig.showGrid"
            :grid-size="sizeStore.canvasConfig.gridSize"
            :grid-color="sizeStore.canvasConfig.gridColor"
            @click-empty="compStore.clearSelection"
          >
            <ComponentRenderer v-if="rootNode?.children" :nodes="rootNode.children" />
          </CanvasStage>

          <template #overlay>
            <SelectionLayer />
          </template>
        </CanvasViewport>

        <RuntimeRenderer
          v-else
          :components="rootNode ? [rootNode] : []"
          :pages="[]"
          :is-project-mode="false"
          mode="simulation"
        />
      </div>

      <!-- 2. Layer 50: Floating Header Island -->
      <div class="header-island glass-panel">
        <Header @open-ai-assist="handleOpenAIAssist" />
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
              class="dock-item"
              :class="{ active: showMaterials }"
              @click="togglePanel('materials')"
            >
              <el-icon><Menu /></el-icon>
            </button>
          </el-tooltip>

          <el-tooltip content="属性配置" placement="top" :offset="12">
            <button
              class="dock-item"
              :class="{ active: showSettings }"
              @click="togglePanel('settings')"
            >
              <el-icon><Setting /></el-icon>
            </button>
          </el-tooltip>

          <div class="dock-divider"></div>

          <!-- Group 2: Tools -->
          <el-tooltip content="撤销 (Ctrl+Z)" placement="top" :offset="12">
            <button
              class="dock-item"
              @click="undo"
              :disabled="!canUndo"
              :class="{ disabled: !canUndo }"
            >
              <el-icon><Back /></el-icon>
            </button>
          </el-tooltip>

          <el-tooltip content="重做 (Ctrl+Y)" placement="top" :offset="12">
            <button
              class="dock-item"
              @click="redo"
              :disabled="!canRedo"
              :class="{ disabled: !canRedo }"
            >
              <el-icon><Right /></el-icon>
            </button>
          </el-tooltip>

          <el-tooltip content="清空画布" placement="top" :offset="12">
            <button class="dock-item danger-hover" @click="handleReset">
              <el-icon><Delete /></el-icon>
            </button>
          </el-tooltip>

          <div class="dock-divider"></div>

          <!-- Group 3: Smart Actions -->
          <el-tooltip content="AI 助手" placement="top" :offset="12">
            <button class="dock-item ai-dock-btn" @click="handleOpenAIAssist">
              <el-icon><MagicStick /></el-icon>
            </button>
          </el-tooltip>

          <div class="dock-divider"></div>

          <el-tooltip
            :content="isSimulationMode ? '停止运行' : '模拟运行'"
            placement="top"
            :offset="12"
          >
            <button
              class="dock-item run-btn"
              :class="{ 'is-running': isSimulationMode }"
              @click="toggleSimulationMode"
            >
              <el-icon v-if="!isSimulationMode"><VideoPlay /></el-icon>
              <el-icon v-else><VideoPause /></el-icon>
            </button>
          </el-tooltip>
        </div>
      </div>

      <!-- 5. Dialogs -->
      <AIAssistDialog v-model:visible="aiVisible" />
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
  width: 48px;
  height: 48px;
  border-radius: 12px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.dock-item:hover {
  background: rgba(255, 255, 255, 0.5);
  transform: translateY(-8px) scale(1.1);
  color: var(--color-primary);
}

.dock-item.active {
  background: rgba(255, 255, 255, 0.3);
  color: var(--color-primary);
}

.dock-item.disabled {
  opacity: 0.3;
  cursor: not-allowed;
  pointer-events: none;
}

.dock-item.danger-hover:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.dock-item.active::after {
  content: '';
  position: absolute;
  bottom: -6px;
  width: 4px;
  height: 4px;
  background: var(--color-primary);
  border-radius: 50%;
}

.dock-divider {
  width: 1px;
  height: 32px;
  background: rgba(0, 0, 0, 0.1);
}

.ai-dock-btn {
  color: #8b5cf6;
}

.ai-dock-btn:hover {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2));
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
