<template>
  <div class="material-panel-content">
    <!-- 搜索框 -->
    <div class="search-wrapper">
      <el-input
        v-model="searchQuery"
        placeholder="搜索组件..."
        :prefix-icon="Search"
        clearable
        size="default"
      />
    </div>

    <!-- 标签页 -->
    <el-tabs v-model="activeTab" class="modern-tabs" stretch>
      <el-tab-pane label="基础组件" name="components">
        <div class="component-list">
          <el-collapse v-model="activeNames" class="clean-collapse">
            <el-collapse-item
              v-for="cat in filteredCategories"
              :key="cat.key"
              :title="cat.title"
              :name="cat.title"
            >
              <div class="grid-layout">
                <div
                  class="grid-item"
                  v-for="item in cat.items"
                  :key="item.name"
                  draggable="true"
                  @dragstart="onDrag($event, item)"
                >
                  <div class="item-icon">
                    <el-icon :size="20">
                      <component :is="item.icon || Box" />
                    </el-icon>
                  </div>
                  <span class="item-label">{{ item.label }}</span>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </el-tab-pane>

      <el-tab-pane label="页面模板" name="templates">
        <div class="templates-placeholder">
          <el-empty description="模板功能升级中，敬请期待...">
            <template #image>
              <el-icon :size="64"><DocumentCopy /></el-icon>
            </template>
          </el-empty>
        </div>
      </el-tab-pane>

      <el-tab-pane label="自定义" name="custom">
        <div class="custom-placeholder">
          <el-button class="upload-btn" :icon="Upload" dashed> 导入组件 </el-button>
          <el-empty description="支持导入 Vue/React 组件或 NPM 包" :image-size="80">
            <template #image>
              <el-icon :size="64"><Box /></el-icon>
            </template>
          </el-empty>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Component } from 'vue'
import type { MaterialMeta, NodeSchema } from '@vela/core'
import { DocumentCopy, Search, Upload, Box } from '@element-plus/icons-vue'
import { generateId } from '@vela/core'
import type { PropValue } from '@vela/core/types/expression'
import {
  getMaterialsByCategory,
  extractDefaultProps,
  getCategoryConfig,
  getComponentIcon,
  type CategoryConfig,
} from '@vela/materials'

// --- 类型定义 ---
type Category = {
  key: string
  title: string
  items: Item[]
}

type Item = {
  name: string
  label: string
  meta: MaterialMeta
  width?: number
  height?: number
  icon?: Component
  categoryConfig: CategoryConfig
}

// --- 状态管理 ---
const activeTab = ref('components')
const activeNames = ref<string[]>([])
const searchQuery = ref('')

// --- 从物料包生成组件分类 ---
const categories = computed<Category[]>(() => {
  const materialsByCategory = getMaterialsByCategory()
  const result: Category[] = []

  Object.entries(materialsByCategory).forEach(([categoryName, materials]) => {
    const config = getCategoryConfig(categoryName)

    const items = materials.map((meta) => ({
      name: meta.name,
      label: meta.title,
      meta,
      categoryConfig: config,
      icon: getComponentIcon(meta.name),
    }))

    result.push({
      key: categoryName.toLowerCase().replace(/\s+/g, '-'),
      title: categoryName,
      items,
    })
  })

  // 按配置的顺序排序
  return result.sort((a, b) => {
    const orderA = getCategoryConfig(a.title).order
    const orderB = getCategoryConfig(b.title).order
    return orderA - orderB
  })
})

// --- 搜索过滤 ---
const filteredCategories = computed(() => {
  if (!searchQuery.value.trim()) {
    return categories.value
  }

  const query = searchQuery.value.toLowerCase()
  const filtered: typeof categories.value = []

  for (const category of categories.value) {
    const matchedItems = category.items.filter(
      (item) => item.label.toLowerCase().includes(query) || item.name.toLowerCase().includes(query),
    )

    if (matchedItems.length > 0) {
      filtered.push({
        ...category,
        items: matchedItems,
      })
    }
  }

  return filtered
})

watch(
  categories,
  (list) => {
    if (activeNames.value.length === 0 && list.length > 0) {
      activeNames.value = list.slice(0, 3).map((cat) => cat.title)
    }
  },
  { immediate: true },
)

watch(filteredCategories, (list) => {
  if (!searchQuery.value.trim()) return
  if (list.length > 0) {
    activeNames.value = list.map((cat) => cat.title)
  }
})

// --- 拖拽处理 (适配 V1.5 架构) ---
const onDrag = (event: DragEvent, item: (typeof categories.value)[0]['items'][0]) => {
  const { name, meta, categoryConfig } = item

  // 从 MaterialMeta 提取默认 props
  const defaultProps = extractDefaultProps(meta.props || {})

  const width = categoryConfig.defaultWidth || 120
  const height = categoryConfig.defaultHeight || 80

  // 构建完整的 NodeSchema 结构
  const nodeSchema: Partial<NodeSchema> = {
    id: generateId(name),
    component: name,
    props: defaultProps as Record<string, PropValue>,
    style: {
      width,
      height,
    },
    width,
    height,
    children: [],
  }

  console.log('[MaterialPanel] Drag start:', {
    component: name,
    defaultProps,
    categoryConfig,
    nodeSchema,
  })

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData('application/x-vela', JSON.stringify(nodeSchema))
  }
}
</script>

<style scoped>
/* 根容器：充满父级 SidePanel */
.material-panel-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 搜索框区域 */
.search-wrapper {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-light); /* Refined border */
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.3); /* Slight tint */
}

/* 现代化 Tabs */
.modern-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modern-tabs :deep(.el-tabs__header) {
  margin: 0;
  padding: 0 10px;
  flex-shrink: 0;
}

.modern-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background-color: var(--border-light);
}

.modern-tabs :deep(.el-tabs__item) {
  height: 48px; /* Taller click area */
  font-weight: 500;
  color: var(--text-secondary);
  transition: color 0.2s;
}

.modern-tabs :deep(.el-tabs__item.is-active) {
  color: var(--el-color-primary);
  font-weight: 600;
}

.modern-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
}

.modern-tabs :deep(.el-tab-pane) {
  height: 100%;
  overflow-y: auto;
}

/* 现代化 Collapse */
.component-list {
  padding: 8px 0;
}

.clean-collapse {
  border: none;
}

.clean-collapse :deep(.el-collapse-item__header) {
  border-bottom: none;
  padding-left: 20px;
  background: transparent;
  font-weight: 500;
  color: var(--el-text-color-primary);
  height: 44px;
}

.clean-collapse :deep(.el-collapse-item__wrap) {
  border-bottom: none;
  background: transparent;
}

.clean-collapse :deep(.el-collapse-item__content) {
  padding: 0 16px 16px;
  background: transparent;
}

/* 网格布局 */
.grid-layout {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: var(--el-fill-color-light);
  border-radius: 12px;
  padding: 12px;
  cursor: grab;
  border: 1px solid transparent;
  transition: all 0.2s;
  min-height: 72px;
}

.grid-item:hover {
  background-color: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
  color: var(--el-color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
}

.grid-item:active {
  cursor: grabbing;
}

.item-icon {
  width: 36px;
  height: 36px;
  background: var(--el-bg-color);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
  color: var(--el-color-primary);
  transition: all 0.2s;
}

.grid-item:hover .item-icon {
  background: var(--el-color-primary);
  color: white;
}

.item-label {
  font-size: 12px;
  color: var(--el-text-color-regular);
  text-align: center;
  line-height: 1.4;
}

/* 模板占位符 */
.templates-placeholder {
  padding: 60px 20px;
  text-align: center;
}

/* 自定义组件占位符 */
.custom-placeholder {
  padding: 40px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.upload-btn {
  width: 100%;
  height: 80px;
  border-style: dashed;
  border-width: 2px;
  font-size: 14px;
  font-weight: 500;
}

.upload-btn:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}
</style>
