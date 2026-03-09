<template>
  <div class="page-setting-pane">
    <div class="section">
      <div class="section-title">页面信息</div>
      <el-form label-position="top" size="default">
        <el-form-item label="页面名称">
          <el-input v-model="pageName" placeholder="输入页面名称" @change="handleNameChange" />
        </el-form-item>

        <el-form-item label="页面路径">
          <el-input v-model="pagePath" placeholder="输入页面路径" @change="handlePathChange">
            <template #prepend>/</template>
          </el-input>
        </el-form-item>
      </el-form>
    </div>

    <el-divider />

    <div class="section">
      <div class="section-title">
        布局模式
        <el-tooltip placement="top">
          <template #content>
            <div style="max-width: 240px">
              <p><strong>自由布局:</strong> 组件使用绝对定位，可自由拖拽、调整大小和层级</p>
              <p style="margin-top: 8px">
                <strong>网格编排:</strong> 组件按网格单元落位，方向键移动占位，Shift 调整跨度
              </p>
            </div>
          </template>
          <el-icon class="info-icon"><InfoFilled /></el-icon>
        </el-tooltip>
      </div>

      <div class="layout-options">
        <div
          class="layout-option"
          :class="{ active: currentLayout === 'free' }"
          @click="handleLayoutChange('free')"
        >
          <div class="layout-icon">
            <el-icon :size="32"><Rank /></el-icon>
          </div>
          <div class="layout-label">自由布局</div>
          <div class="layout-desc">绝对定位</div>
        </div>

        <div
          class="layout-option"
          :class="{ active: currentLayout === 'grid' }"
          @click="handleLayoutChange('grid')"
        >
          <div class="layout-icon">
            <el-icon :size="32"><Grid /></el-icon>
          </div>
          <div class="layout-label">网格编排</div>
          <div class="layout-desc">可视化栅格</div>
        </div>
      </div>

      <el-alert
        v-if="currentLayout === 'grid'"
        title="网格编排提示"
        type="info"
        :closable="false"
        show-icon
        class="layout-alert"
      >
        组件将映射为网格占位，支持拖拽落格、方向键移动占位与 Shift 调整跨度
      </el-alert>
    </div>

    <el-divider />

    <div class="section">
      <div class="section-title">画布尺寸</div>
      <el-form label-position="top" size="default">
        <el-form-item label="自定义宽高">
          <div class="size-inputs">
            <el-input-number
              v-model="sizeStore.width"
              :min="320"
              :max="3840"
              :step="10"
              controls-position="right"
              @change="
                (val: number | undefined) => sizeStore.setSize(val || 1920, sizeStore.height)
              "
            />
            <span class="size-separator">x</span>
            <el-input-number
              v-model="sizeStore.height"
              :min="320"
              :max="3840"
              :step="10"
              controls-position="right"
              @change="(val: number | undefined) => sizeStore.setSize(sizeStore.width, val || 1080)"
            />
          </div>
        </el-form-item>

        <el-form-item label="设备预设">
          <el-select
            v-model="sizeStore.currentPresetKey"
            placeholder="选择预设尺寸"
            @change="handlePresetChange"
          >
            <el-option
              v-for="preset in DEVICE_PRESETS"
              :key="preset.key"
              :label="`${preset.name} (${preset.width}x${preset.height})`"
              :value="preset.key"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { InfoFilled, Rank, Grid } from '@element-plus/icons-vue'
import { useProjectStore } from '@/stores/project'
import { useComponent } from '@/stores/component'
import { useSizeStore, DEVICE_PRESETS } from '@/stores/size'
import { storeToRefs } from 'pinia'
import type { LayoutMode } from '@vela/core'
import { convertLayout } from '@/utils/layoutConverter'

const projectStore = useProjectStore()
const componentStore = useComponent()
const sizeStore = useSizeStore()

const { currentPage } = storeToRefs(projectStore)
const { rootNode } = storeToRefs(componentStore)

const pageName = ref('')
const pagePath = ref('')

const currentLayout = computed<LayoutMode>(() => {
  const rootMode = rootNode.value?.container?.mode as LayoutMode | undefined
  if (rootMode === 'free' || rootMode === 'grid') return rootMode

  const pageMode = currentPage.value?.config?.defaultLayoutMode as LayoutMode | undefined
  return pageMode === 'free' ? 'free' : 'grid'
})

watch(
  currentPage,
  (page) => {
    if (!page) return
    pageName.value = page.name
    pagePath.value = page.type === 'page' ? page.path.replace(/^\//, '') : ''
  },
  { immediate: true },
)

watch(
  [currentPage, rootNode],
  ([page, root]) => {
    if (!page || !root) return
    if (!root.container?.mode && page.config?.defaultLayoutMode) {
      const mode = page.config.defaultLayoutMode === 'free' ? 'free' : 'grid'
      componentStore.updateChildLayoutRaw(root.id, mode)
    }
  },
  { immediate: true },
)

function handleNameChange(value: string) {
  if (!currentPage.value) return
  currentPage.value.name = value
  projectStore.saveStatus = 'unsaved'
}

function handlePathChange(value: string) {
  if (!currentPage.value || currentPage.value.type !== 'page') return
  currentPage.value.path = value.startsWith('/') ? value : `/${value}`
  projectStore.saveStatus = 'unsaved'
}

async function handleLayoutChange(mode: LayoutMode) {
  const targetMode: LayoutMode = mode === 'free' ? 'free' : 'grid'
  if (targetMode === currentLayout.value) return

  try {
    const confirmMessages: Record<string, string> = {
      free: '切换到自由布局将为所有组件添加绝对定位，并设置初始坐标。此操作可能导致布局变化，是否继续？',
      grid: '切换到网格编排将把组件转换为网格占位布局。组件会保留相对位置并映射为栅格跨度，是否继续？',
    }
    await ElMessageBox.confirm(confirmMessages[targetMode], '切换布局模式', {
      confirmButtonText: '确认切换',
      cancelButtonText: '取消',
      type: 'warning',
    })

    if (rootNode.value) {
      const converted = convertLayout(rootNode.value, targetMode)
      componentStore.setTree(converted)
      componentStore.syncToProjectStore()
    }
    projectStore.updatePageConfig({ defaultLayoutMode: targetMode })
    const labelMap: Record<string, string> = { free: '自由', grid: '网格编排' }
    ElMessage.success(`已切换到${labelMap[targetMode] || targetMode}布局`)
  } catch {
    console.log('[PageSettingPane] Layout change cancelled')
  }
}

function handlePresetChange(key: string) {
  sizeStore.setPreset(key)
}
</script>

<style scoped>
.page-setting-pane {
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  box-sizing: border-box;
  padding: 16px;
}

.section {
  margin-bottom: 8px;
}

.section-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--el-text-color-primary);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.info-icon {
  color: var(--el-text-color-secondary);
  cursor: help;
}

.layout-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.layout-option {
  border: 2px solid var(--el-border-color);
  border-radius: 8px;
  padding: 16px 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--el-fill-color-blank);
}

.layout-option:hover {
  border-color: var(--el-color-primary-light-3);
  background: var(--el-fill-color-light);
}

.layout-option.active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.layout-icon {
  margin-bottom: 8px;
  color: var(--el-text-color-secondary);
}

.layout-option.active .layout-icon {
  color: var(--el-color-primary);
}

.layout-label {
  font-weight: 600;
  font-size: 13px;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.layout-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.layout-alert {
  margin-top: 8px;
}

.size-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.size-separator {
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

.size-inputs :deep(.el-input-number) {
  width: 130px;
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

:deep(.el-form-item__content) {
  width: 100%;
}

:deep(.el-divider) {
  margin: 20px 0;
}
</style>
