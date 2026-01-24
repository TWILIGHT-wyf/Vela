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
                <strong>流式布局:</strong> 组件使用文档流排列，类似网页布局
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
          :class="{ active: currentLayout === 'flow' }"
          @click="handleLayoutChange('flow')"
        >
          <div class="layout-icon">
            <el-icon :size="32"><List /></el-icon>
          </div>
          <div class="layout-label">流式布局</div>
          <div class="layout-desc">文档流</div>
        </div>
      </div>

      <el-alert
        v-if="currentLayout === 'flow'"
        title="流式布局提示"
        type="info"
        :closable="false"
        show-icon
        class="layout-alert"
      >
        组件将按添加顺序从上到下排列，不支持拖拽位置调整
      </el-alert>
    </div>

    <el-divider />

    <div class="section">
      <div class="section-title">画布设置</div>
      <el-form label-position="top" size="default">
        <el-form-item label="画布尺寸">
          <div class="size-inputs">
            <el-input-number
              v-model="canvasWidth"
              :min="320"
              :max="3840"
              :step="10"
              @change="handleCanvasSizeChange"
            />
            <span class="size-separator">x</span>
            <el-input-number
              v-model="canvasHeight"
              :min="320"
              :max="2160"
              :step="10"
              @change="handleCanvasSizeChange"
            />
          </div>
        </el-form-item>

        <el-form-item label="预设尺寸">
          <el-select v-model="selectedPreset" placeholder="选择预设" @change="handlePresetChange">
            <el-option label="桌面 (1920x1080)" value="1920x1080" />
            <el-option label="笔记本 (1366x768)" value="1366x768" />
            <el-option label="平板横屏 (1024x768)" value="1024x768" />
            <el-option label="平板竖屏 (768x1024)" value="768x1024" />
            <el-option label="手机 (375x812)" value="375x812" />
          </el-select>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { InfoFilled, Rank, List } from '@element-plus/icons-vue'
import { useProjectStore } from '@/stores/project'
import { useUIStore } from '@/stores/ui'
import { storeToRefs } from 'pinia'
import type { LayoutMode } from '@/utils/layoutConverter'

const projectStore = useProjectStore()
const uiStore = useUIStore()

const { currentPage, currentPageId: activePageId } = storeToRefs(projectStore)
const { canvasWidth: storeCanvasWidth, canvasHeight: storeCanvasHeight } = storeToRefs(uiStore)

// 本地状态
const pageName = ref('')
const pagePath = ref('')
const canvasWidth = ref(1920)
const canvasHeight = ref(1080)
const selectedPreset = ref('')

// 当前布局模式
const currentLayout = computed(() => currentPage.value?.config?.layout || 'free')

// 同步页面信息
watch(
  currentPage,
  (page) => {
    if (page) {
      pageName.value = page.name
      pagePath.value = page.path.replace(/^\//, '')
    }
  },
  { immediate: true },
)

// 同步画布尺寸
watch(
  [storeCanvasWidth, storeCanvasHeight],
  ([w, h]) => {
    canvasWidth.value = w
    canvasHeight.value = h
    // 尝试匹配预设
    selectedPreset.value = `${w}x${h}`
  },
  { immediate: true },
)

// 处理名称变更
function handleNameChange(value: string) {
  if (currentPage.value) {
    currentPage.value.name = value
    projectStore.saveStatus = 'unsaved'
  }
}

// 处理路径变更
function handlePathChange(value: string) {
  if (currentPage.value) {
    // 确保路径以 / 开头
    currentPage.value.path = value.startsWith('/') ? value : `/${value}`
    projectStore.saveStatus = 'unsaved'
  }
}

// 处理布局模式切换
async function handleLayoutChange(mode: LayoutMode) {
  if (mode === currentLayout.value) return

  try {
    await ElMessageBox.confirm(
      mode === 'flow'
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
    projectStore.updatePageConfig({ layout: mode })

    // 同步更新 UI store 的 canvasMode
    uiStore.setCanvasMode(mode)
    ElMessage.success(`已切换到${mode === 'free' ? '自由' : '流式'}布局`)
  } catch {
    // 用户取消
    console.log('[PageSettingPane] Layout change cancelled')
  }
}

// 处理画布尺寸变更
function handleCanvasSizeChange() {
  uiStore.setCanvasSize(canvasWidth.value, canvasHeight.value)
}

// 处理预设选择
function handlePresetChange(preset: string) {
  const [w, h] = preset.split('x').map(Number)
  if (w && h) {
    canvasWidth.value = w
    canvasHeight.value = h
    uiStore.setCanvasSize(w, h)
  }
}
</script>

<style scoped>
.page-setting-pane {
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

/* 布局选项卡片 */
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

/* 尺寸输入 */
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
  width: 100px;
}

/* Element Plus 表单微调 */
:deep(.el-form-item) {
  margin-bottom: 16px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

:deep(.el-divider) {
  margin: 20px 0;
}
</style>
