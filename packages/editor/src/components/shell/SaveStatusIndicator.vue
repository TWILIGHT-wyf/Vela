<template>
  <div class="save-status-indicator">
    <!-- 状态标签 -->
    <el-tag
      :type="statusConfig.tagType"
      :effect="statusConfig.effect"
      size="small"
      class="status-tag"
    >
      <el-icon
        v-if="statusConfig.icon"
        class="status-icon"
        :class="{ 'is-loading': saveStatus === 'saving' }"
      >
        <component :is="statusConfig.icon" />
      </el-icon>
      <span class="status-text">{{ statusConfig.text }}</span>
    </el-tag>

    <!-- 最后保存时间 -->
    <span v-if="saveStatus === 'saved' && formattedTime" class="last-saved-time">
      {{ formattedTime }}
    </span>

    <!-- 立即保存按钮 -->
    <el-tooltip v-if="saveStatus === 'unsaved'" content="立即保存" placement="bottom">
      <el-button
        type="primary"
        :icon="Upload"
        size="small"
        circle
        class="save-button"
        @click="handleSaveNow"
      />
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useProjectStore } from '@/stores/project'
import { Check, Loading, EditPen, Upload } from '@element-plus/icons-vue'

// 从 store 中获取状态
const projectStore = useProjectStore()
const { saveStatus, lastSavedTime } = storeToRefs(projectStore)

// 状态配置
interface StatusConfig {
  text: string
  tagType: 'success' | 'warning' | 'info' | 'danger'
  effect: 'dark' | 'light' | 'plain'
  icon: typeof Check | typeof Loading | typeof EditPen
}

const statusConfig = computed<StatusConfig>(() => {
  switch (saveStatus.value) {
    case 'saved':
      return {
        text: '所有更改已保存',
        tagType: 'success' as const,
        effect: 'light' as const,
        icon: Check,
      }
    case 'saving':
      return {
        text: '正在保存...',
        tagType: 'warning' as const,
        effect: 'light' as const,
        icon: Loading,
      }
    case 'unsaved':
    default:
      return {
        text: '有未保存的更改',
        tagType: 'info' as const,
        effect: 'plain' as const,
        icon: EditPen,
      }
  }
})

// 格式化时间为 HH:mm:ss
const formattedTime = computed(() => {
  if (!lastSavedTime.value) return ''

  const date = new Date(lastSavedTime.value)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')

  return `${hours}:${minutes}:${seconds}`
})

// 立即保存
function handleSaveNow() {
  projectStore.saveProject()
}
</script>

<style scoped>
.save-status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.status-icon {
  font-size: 12px;
}

.status-icon.is-loading {
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

.status-text {
  font-size: 12px;
}

.last-saved-time {
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.save-button {
  margin-left: 4px;
}
</style>
