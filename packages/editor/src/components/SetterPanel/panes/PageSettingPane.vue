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
import { ref, watch } from 'vue'
import { useProjectStore } from '@/stores/project'
import { useSizeStore, DEVICE_PRESETS } from '@/stores/size'
import { storeToRefs } from 'pinia'

const projectStore = useProjectStore()
const sizeStore = useSizeStore()

const { currentPage } = storeToRefs(projectStore)

const pageName = ref('')
const pagePath = ref('')

watch(
  currentPage,
  (page) => {
    if (!page) return
    pageName.value = page.name
    pagePath.value = page.type === 'page' ? page.path.replace(/^\//, '') : ''
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
