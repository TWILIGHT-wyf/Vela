<template>
  <div class="preview-page">
    <header class="preview-header">
      <el-button type="text" size="small" @click="handleBack" class="back-btn">
        ← 返回编辑器
      </el-button>

      <div class="preview-info">
        <span class="preview-label">预览模式</span>
        <span class="page-name">{{ currentPage?.name }}</span>
      </div>

      <div class="preview-actions">
        <el-button size="small" @click="handleRefresh">
          <span class="btn-icon">🔄</span>
          刷新
        </el-button>
      </div>
    </header>

    <main class="preview-content">
      <div class="preview-viewport">
        <RuntimeRenderer v-if="rootNode" :root-node="rootNode" mode="preview" />

        <div v-else class="empty-state">
          <div class="empty-icon">📄</div>
          <p>当前页面没有内容</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { RuntimeRenderer } from '@vela/renderer'
import { useComponent } from '@/stores/component'
import { useProjectStore } from '@/stores/project'
import { storeToRefs } from 'pinia'
import { ElButton } from 'element-plus'

const router = useRouter()
const compStore = useComponent()
const projectStore = useProjectStore()

const { rootNode } = storeToRefs(compStore)
const { currentPage } = storeToRefs(projectStore)

const handleBack = () => {
  router.push('/editor-v2')
}

const handleRefresh = () => {
  window.location.reload()
}
</script>

<style scoped>
.preview-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.preview-header {
  height: 56px;
  background: white;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.back-btn {
  font-size: 14px;
  color: #1890ff;
}

.preview-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.preview-label {
  font-size: 12px;
  color: #8c8c8c;
  padding: 2px 8px;
  background: #f0f0f0;
  border-radius: 2px;
}

.page-name {
  font-size: 14px;
  font-weight: 600;
  color: #262626;
}

.preview-actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  margin-right: 4px;
}

.preview-content {
  flex: 1;
  overflow: auto;
  padding: 0;
}

.preview-viewport {
  min-height: 100%;
  background: white;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #bfbfbf;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state p {
  font-size: 14px;
  margin: 0;
}
</style>
