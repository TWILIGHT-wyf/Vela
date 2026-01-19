<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useUIStore } from '@/stores/ui'
import { useProjectStore } from '@/stores/project'
import { useComponent } from '@/stores/component'
import EditorLayout from '@/components/Layout/EditorLayout.vue'
import Header from '@/components/Layout/Header/Header.vue'
import SidePanel from '@/components/Layout/Panel/SidePanel.vue'
import StatusBar from '@/components/Layout/StatusBar/StatusBar.vue'
import MaterialPanel from '@/components/MaterialPanel/MaterialPanel.vue'
import CanvasBoard from '@/components/Canvas/CanvasBoard.vue'
import SetterPanel from '@/components/SetterPanel/SetterPanel.vue'
import AIAssistDialog from '@/components/AIAssist/AIAssistDialog.vue'
import { provideComponentEvents } from '@/composables/useComponentEvents'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import * as projectService from '@/services/projects'
import { RuntimeRenderer } from '@vela/renderer'
import { nodeSchemaToComponent } from '@vela/core/types/components'

// 初始化事件系统（TODO: 重构event系统后恢复）
// provideComponentEvents()

// 路由相关
const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const compStore = useComponent()
const { rootNode } = storeToRefs(compStore)

// 加载状态
const isLoading = ref(true)

// UI Store
const uiStore = useUIStore()
const { isSimulationMode } = storeToRefs(uiStore)

// AI 助手状态
const aiVisible = ref(false)

// 加载项目数据
onMounted(async () => {
  const projectId = route.params.id as string

  // 如果没有项目ID（如 /editor-v2 路由），跳过加载直接进入编辑器
  if (!projectId) {
    console.log('开发模式：无项目ID，直接进入编辑器')
    isLoading.value = false
    return
  }

  isLoading.value = true

  try {
    // 从服务器加载项目数据
    await projectService.getProject(projectId)
    // 初始化项目数据（这里需要根据实际API调整）
    ElMessage.success('项目加载成功')
  } catch (error) {
    console.warn('从服务器加载失败:', error)
    ElMessage.error('项目加载失败')
    router.push('/')
  } finally {
    isLoading.value = false
  }
})

// 打开 AI 助手
function handleOpenAIAssist() {
  aiVisible.value = true
}
</script>

<template>
  <router-view v-if="$route.path === '/runtime'" v-slot="{ Component }">
    <component :is="Component" v-if="Component" />
  </router-view>

  <!-- 加载状态 -->
  <div v-else-if="isLoading" class="loading-container">
    <el-icon class="loading-icon" :size="48"><Loading /></el-icon>
    <p class="loading-text">正在加载项目...</p>
  </div>

  <EditorLayout v-else>
    <template #header>
      <Header @open-ai-assist="handleOpenAIAssist" />
    </template>

    <template #left>
      <SidePanel title="组件库">
        <MaterialPanel />
      </SidePanel>
    </template>

    <template #center>
      <div class="canvas-wrapper">
        <!-- 画布区域 -->
        <CanvasBoard v-if="!isSimulationMode" />

        <!-- 模拟运行模式 -->
        <RuntimeRenderer
          v-else
          :components="rootNode ? [rootNode] : []"
          :pages="[]"
          :is-project-mode="false"
          mode="simulation"
        />
      </div>
    </template>

    <template #right>
      <SidePanel title="属性设置">
        <SetterPanel />
      </SidePanel>
    </template>

    <template #footer>
      <StatusBar />
    </template>
  </EditorLayout>

  <AIAssistDialog v-model:visible="aiVisible" />
</template>

<style scoped>
/* 加载状态样式 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: var(--el-fill-color-lighter);
  gap: 16px;
}

.loading-icon {
  color: var(--el-color-primary);
  animation: rotating 1.5s linear infinite;
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  margin: 0;
}

/* 画布包装器 */
.canvas-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>
