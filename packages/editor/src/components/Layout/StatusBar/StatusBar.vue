<template>
  <div class="vela-status-bar">
    <div class="status-left">
      <!-- 运行模式指示 -->
      <span class="status-item" :class="{ 'status-warning': isSimulationMode }">
        <el-icon class="status-icon">
          <VideoPlay v-if="isSimulationMode" />
          <CircleCheck v-else />
        </el-icon>
        {{ isSimulationMode ? '模拟运行中' : '编辑模式' }}
      </span>
      <el-divider direction="vertical" />

      <!-- 画布模式 -->
      <span class="status-item">
        <el-icon class="status-icon"><Grid /></el-icon>
        {{ canvasMode === 'free' ? '自由布局' : '流式布局' }}
      </span>
      <el-divider direction="vertical" />

      <!-- 选中组件信息 -->
      <span class="status-item breadcrumb">
        <el-icon class="status-icon"><Aim /></el-icon>
        {{ selectedInfo }}
      </span>
    </div>

    <div class="status-right">
      <!-- 组件数量 -->
      <span class="status-item">
        <el-icon class="status-icon"><Files /></el-icon>
        {{ componentCount }} 个组件
      </span>
      <el-divider direction="vertical" />

      <!-- 缩放控制 -->
      <div class="zoom-control">
        <el-button text size="small" @click="zoomOut" :disabled="zoom <= 20">
          <el-icon><Minus /></el-icon>
        </el-button>
        <span class="zoom-value" @click="resetZoom">{{ zoom }}%</span>
        <el-button text size="small" @click="zoomIn" :disabled="zoom >= 400">
          <el-icon><Plus /></el-icon>
        </el-button>
      </div>
      <el-divider direction="vertical" />

      <!-- 画布尺寸 -->
      <span class="status-item">
        <el-icon class="status-icon"><FullScreen /></el-icon>
        {{ canvasWidth }} × {{ canvasHeight }}
      </span>
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
    return node ? `${node.componentName} (${node.id.slice(0, 8)}...)` : '未选中'
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
  padding: 0 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  user-select: none;
}

.status-left,
.status-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.status-item.status-warning {
  color: var(--el-color-warning);
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
}

.el-divider--vertical {
  height: 12px;
  margin: 0 4px;
}

/* 缩放控制 */
.zoom-control {
  display: flex;
  align-items: center;
  gap: 2px;
}

.zoom-control .el-button {
  padding: 2px;
  height: 18px;
  width: 18px;
}

.zoom-value {
  min-width: 40px;
  text-align: center;
  cursor: pointer;
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  color: var(--el-text-color-primary);
  padding: 2px 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.zoom-value:hover {
  background-color: var(--el-fill-color-light);
}
</style>
