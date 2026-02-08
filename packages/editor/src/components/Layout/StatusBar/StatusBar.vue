<template>
  <div class="vela-status-bar">
    <div class="status-left">
      <!-- 运行模式指示 -->
      <div class="status-item" :class="{ 'status-warning': isSimulationMode }">
        <el-icon class="status-icon">
          <VideoPlay v-if="isSimulationMode" />
          <CircleCheck v-else />
        </el-icon>
        <span>{{ isSimulationMode ? '模拟运行中' : '编辑模式' }}</span>
      </div>
      
      <div class="divider-line"></div>

      <!-- 画布模式 -->
      <div class="status-item">
        <el-icon class="status-icon"><Grid /></el-icon>
        <span>{{ canvasMode === 'free' ? '自由布局' : '流式布局' }}</span>
      </div>
      
      <div class="divider-line"></div>

      <!-- 选中组件信息 -->
      <div class="status-item breadcrumb">
        <el-icon class="status-icon"><Aim /></el-icon>
        <span>{{ selectedInfo }}</span>
      </div>
    </div>

    <div class="status-right">
      <!-- 组件数量 -->
      <div class="status-item">
        <el-icon class="status-icon"><Files /></el-icon>
        <span>{{ componentCount }} 个组件</span>
      </div>
      
      <div class="divider-line"></div>

      <!-- 缩放控制 -->
      <div class="zoom-control">
        <el-button text circle size="small" @click="zoomOut" :disabled="zoom <= 20">
          <el-icon><Minus /></el-icon>
        </el-button>
        <span class="zoom-value" @click="resetZoom">{{ zoom }}%</span>
        <el-button text circle size="small" @click="zoomIn" :disabled="zoom >= 400">
          <el-icon><Plus /></el-icon>
        </el-button>
      </div>
      
      <div class="divider-line"></div>

      <!-- 画布尺寸 -->
      <div class="status-item">
        <el-icon class="status-icon"><FullScreen /></el-icon>
        <span>{{ canvasWidth }} × {{ canvasHeight }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useComponent } from '@/stores/component'
import { useUIStore } from '@/stores/ui'
import { storeToRefs } from 'pinia'
import {
  CircleCheck,
  VideoPlay,
  Grid,
  Aim,
  Files,
  Minus,
  Plus,
  FullScreen,
} from '@element-plus/icons-vue'

const compStore = useComponent()
const uiStore = useUIStore()
const {
  canvasScale: scale,
  canvasWidth,
  canvasHeight,
  canvasMode,
  isSimulationMode,
} = storeToRefs(uiStore)
const { setCanvasScale } = uiStore

// 选中组件信息
const selectedInfo = computed(() => {
  const count = compStore.selectedIds.length
  if (count === 0) return '未选中'
  if (count === 1) {
    const node = compStore.selectedNode
    return node ? `${node.component || node.componentName} (${node.id.slice(0, 8)}...)` : '未选中'
  }
  return `已选中 ${count} 个组件`
})

// 组件数量
const componentCount = computed(() => {
  if (!compStore.rootNode) return 0
  return compStore.flattenTree(compStore.rootNode).length - 1 // 减去根节点
})

// 缩放比例
const zoom = computed(() => Math.round((scale.value || 1) * 100))

// 缩放操作
function zoomIn() {
  setCanvasScale(scale.value + 0.1)
}

function zoomOut() {
  setCanvasScale(scale.value - 0.1)
}

function resetZoom() {
  setCanvasScale(1)
}
</script>

<style scoped>
.vela-status-bar {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  font-size: 12px;
  color: var(--text-tertiary);
  user-select: none;
  background: transparent;
}

.status-left,
.status-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  transition: color 0.2s;
}

.status-item:hover {
  color: var(--text-secondary);
}

.status-item.status-warning {
  color: #e37400; /* Google Dark Orange */
  font-weight: 500;
}

.status-icon {
  font-size: 14px;
}

.breadcrumb {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: 'Consolas', 'Monaco', monospace;
  opacity: 0.8;
}

/* 分隔符 */
.divider-line {
  width: 1px;
  height: 12px;
  background-color: var(--border-light);
  opacity: 0.5;
}

/* 缩放控制 */
.zoom-control {
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: rgba(0,0,0,0.03);
  padding: 2px;
  border-radius: 99px;
}

.zoom-value {
  min-width: 36px;
  text-align: center;
  cursor: pointer;
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  color: var(--text-primary);
  font-size: 12px;
}

.zoom-value:hover {
  color: var(--color-primary);
}
</style>
