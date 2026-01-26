<template>
  <div class="relations-pane">
    <el-scrollbar class="panel-scrollbar">
      <div class="panel-content">
        <div class="section-card">
          <div class="card-header">
            <span class="title">组件结构树</span>
            <div class="header-actions">
              <el-button link size="small" @click="expandAll">
                {{ allExpanded ? '全部折叠' : '全部展开' }}
              </el-button>
            </div>
          </div>

          <div class="tree-container">
            <el-tree
              ref="treeRef"
              :data="treeData"
              node-key="id"
              :expand-on-click-node="false"
              highlight-current
              draggable
              :allow-drop="allowDrop"
              :allow-drag="allowDrag"
              @node-click="handleNodeClick"
              @node-drop="handleNodeDrop"
              class="modern-tree"
            >
              <template #default="{ data }: any">
                <div class="tree-node-content">
                  <div class="node-main">
                    <el-icon class="node-icon">
                      <component :is="getComponentIcon(data.type)" />
                    </el-icon>
                    <span class="node-label">{{ data.label }}</span>
                    <span v-if="data.children?.length" class="child-count">
                      {{ data.children.length }}
                    </span>
                  </div>
                </div>
              </template>
            </el-tree>
          </div>

          <div class="tree-hint">
            <el-icon><InfoFilled /></el-icon>
            <span>拖拽组件可建立父子关系</span>
          </div>
        </div>

        <div v-if="isContainer" class="section-card">
          <div class="card-header">
            <span class="title">容器布局</span>
          </div>

          <el-form label-position="top" size="small" class="modern-form">
            <el-form-item label="布局模式">
              <el-select v-model="layoutMode" class="modern-select">
                <el-option label="绝对定位 (Free)" value="block" />
                <el-option label="Flex 水平" value="flex" />
                <el-option label="Flex 垂直" value="flex" />
                <el-option label="网格布局 (Grid)" value="grid" />
              </el-select>
            </el-form-item>

            <div class="form-grid-2">
              <el-form-item label="组件间距 (px)">
                <el-input-number
                  v-model="layoutGap"
                  :min="0"
                  :max="100"
                  :controls="false"
                  class="modern-input"
                />
              </el-form-item>
              <el-form-item label="容器内边距 (px)">
                <el-input-number
                  v-model="layoutPadding"
                  :min="0"
                  :max="100"
                  :controls="false"
                  class="modern-input"
                />
              </el-form-item>
            </div>

            <el-form-item label="对齐方式">
              <el-radio-group v-model="layoutAlign" size="small" class="modern-radio">
                <el-radio-button label="start">起始</el-radio-button>
                <el-radio-button label="center">居中</el-radio-button>
                <el-radio-button label="end">末尾</el-radio-button>
                <el-radio-button label="stretch">拉伸</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Document, FolderOpened, InfoFilled } from '@element-plus/icons-vue'
import type { ElTree } from 'element-plus'
import {
  useComponentHierarchy,
  useTreeOperations,
  useLayoutConfig,
} from '../composables/useRelations'
import { useComponent } from '@/stores/component'

const componentStore = useComponent()

const { childrenComponents, selectComponentById } = useComponentHierarchy()

const { treeData, handleNodeClick, getAllNodeKeys, allowDrop, allowDrag, handleNodeDrop } =
  useTreeOperations()

const { isContainer, layoutMode, layoutGap, layoutColumns, layoutAlign, layoutPadding } =
  useLayoutConfig()

const treeRef = ref<InstanceType<typeof ElTree> | null>(null)
const allExpanded = ref(false)

function expandAll() {
  allExpanded.value = !allExpanded.value
  if (allExpanded.value) {
    const allKeys = getAllNodeKeys(treeData.value)
    allKeys.forEach((key) => {
      const node = treeRef.value?.getNode(key)
      if (node) node.expanded = true
    })
  } else {
    const allKeys = getAllNodeKeys(treeData.value)
    allKeys.forEach((key) => {
      const node = treeRef.value?.getNode(key)
      if (node) node.expanded = false
    })
  }
}

function getComponentIcon(type: string) {
  if (['Badge', 'Group'].includes(type)) {
    return FolderOpened
  }
  return Document
}
</script>

<style scoped>
.relations-pane {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-scrollbar {
  flex: 1;
}

.panel-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-card {
  background: white;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-light);
}

.card-header .title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.header-actions {
  display: flex;
  gap: 8px;
}

.tree-container {
  padding: 16px;
}

.modern-tree :deep(.el-tree-node__content) {
  height: 40px;
  padding: 0;
}

.tree-node-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.tree-node-content:hover {
  background-color: var(--el-fill-color-light);
}

.node-main {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.node-icon {
  font-size: 16px;
  color: var(--el-text-color-secondary);
}

.node-label {
  flex: 1;
  font-size: 14px;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.child-count {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  background: var(--el-border-color-light);
  padding: 2px 6px;
  border-radius: 10px;
}

.tree-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--el-color-primary-light-9);
  border-top: 1px solid var(--el-border-color-light);
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.modern-form {
  padding: 16px;
}

.modern-form :deep(.el-form-item__content) {
  width: 100%;
}

.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.modern-input {
  width: 100%;
}

.modern-select {
  width: 100%;
}

.modern-radio {
  width: 100%;
}

.modern-radio :deep(.el-radio-group) {
  width: 100%;
  display: flex;
}

.modern-radio :deep(.el-radio-button) {
  flex: 1;
}

.modern-radio :deep(.el-radio-button__inner) {
  width: 100%;
  padding: 8px 0;
  border-radius: 0;
}
</style>
