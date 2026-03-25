<template>
  <div class="material-panel-content component-bar-root">
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
    <el-tabs v-model="activeTab" class="modern-tabs vela-panel-tabs" stretch>
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
        <div class="template-list" v-if="filteredTemplates.length > 0">
          <div class="template-card" v-for="tpl in filteredTemplates" :key="tpl.id">
            <div
              class="template-preview"
              :style="{
                background: `linear-gradient(135deg, ${tpl.preview[0]}, ${tpl.preview[1]})`,
              }"
            >
              <span class="template-category">{{ getTemplateCategoryLabel(tpl.category) }}</span>
            </div>
            <div class="template-content">
              <div class="template-name">{{ tpl.name }}</div>
              <div class="template-desc">{{ tpl.description }}</div>
            </div>
            <el-button
              type="primary"
              size="small"
              class="template-action"
              @click="applyTemplate(tpl.id)"
              >应用模板</el-button
            >
          </div>
        </div>
        <el-empty v-else description="没有匹配的模板" :image-size="72" />
      </el-tab-pane>

      <el-tab-pane label="自定义" name="custom">
        <div class="custom-placeholder">
          <el-button class="upload-btn" :icon="Upload" dashed> 自定义组件扩展规划 </el-button>
          <el-empty description="当前版本仅规划 manifest + 远程 ESM 注册，不承诺源码直传编译" :image-size="80">
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
import { Search, Upload, Box } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { generateId } from '@vela/core'
import type { PropValue } from '@vela/core/types/expression'
import { cloneDeep } from 'lodash-es'
import {
  getMaterialsByCategory,
  extractDefaultProps,
  extractDefaultStyles,
  getCategoryConfig,
  getComponentIcon,
  resolveCanonicalMaterialName,
} from '@vela/materials'
import { useComponent } from '@/stores/component'
import { useProjectStore } from '@/stores/project'
import { useHistoryStore } from '@/stores/history'
import {
  templates as pageTemplates,
  getTemplateById,
  instantiateTemplate,
  type PageTemplate,
} from '@/templates'

type PanelCategoryConfig = {
  order: number
  defaultWidth: number
  defaultHeight: number
}

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
  categoryConfig: PanelCategoryConfig
}

function resolveMaterialLabel(meta: MaterialMeta): string {
  const title = meta.title
  if (typeof title === 'string') return title
  if (title && typeof title === 'object') {
    return title['zh-CN'] || title['zh'] || title['en'] || meta.name
  }
  return meta.name
}

// --- 状态管理 ---
const activeTab = ref('components')
const activeNames = ref<string[]>([])
const searchQuery = ref('')
const componentStore = useComponent()
const projectStore = useProjectStore()
const historyStore = useHistoryStore()

const CURATED_MATERIAL_WHITELIST = new Set([
  'Text',
  'Button',
  'TextInput',
  'TextareaInput',
  'Select',
  'Switch',
  'CheckboxGroup',
  'RadioGroup',
  'DatePicker',
  'dateRange',
  'SearchBox',
  'NumberInput',
  'Table',
  'List',
  'Stat',
  'Image',
  'Container',
  'Grid',
  'Flex',
  'Panel',
  'Tabs',
  'Modal',
])

const CURATED_TEMPLATE_WHITELIST = new Set([
  'query-workbench',
  'approval-center',
  'secure-login',
  'project-board',
])

// --- 从物料包生成组件分类 ---
const categories = computed<Category[]>(() => {
  const materialsByCategory = getMaterialsByCategory()
  const result: Category[] = []

  Object.entries(materialsByCategory).forEach(([categoryName, materials]) => {
    const config = getCategoryConfig(categoryName) as PanelCategoryConfig
    const visibleMaterials = materials.filter((meta) =>
      CURATED_MATERIAL_WHITELIST.has(resolveCanonicalMaterialName(meta.name)),
    )

    if (visibleMaterials.length === 0) {
      return
    }

    const items = visibleMaterials.map((meta) => ({
      name: meta.name,
      label: resolveMaterialLabel(meta),
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

const TEMPLATE_CATEGORY_LABELS: Record<PageTemplate['category'], string> = {
  dashboard: '概览页面',
  analysis: '分析页面',
  form: '表单页面',
  management: '管理页面',
}

const filteredTemplates = computed(() => {
  const availableTemplates = pageTemplates.filter((tpl) => CURATED_TEMPLATE_WHITELIST.has(tpl.id))
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return availableTemplates

  return availableTemplates.filter((tpl) =>
    `${tpl.name} ${tpl.description} ${TEMPLATE_CATEGORY_LABELS[tpl.category]}`
      .toLowerCase()
      .includes(query),
  )
})

function getTemplateCategoryLabel(category: PageTemplate['category']): string {
  return TEMPLATE_CATEGORY_LABELS[category] || '页面模板'
}

async function applyTemplate(templateId: string): Promise<void> {
  const selectedTemplate = getTemplateById(templateId)
  if (!selectedTemplate) {
    ElMessage.error('模板不存在')
    return
  }

  const rootNode = componentStore.rootNode
  if (!rootNode) {
    ElMessage.error('当前页面未初始化，无法应用模板')
    return
  }

  try {
    if ((rootNode.children?.length || 0) > 0) {
      await ElMessageBox.confirm('应用模板将覆盖当前页面组件，是否继续？', '确认应用模板', {
        type: 'warning',
        confirmButtonText: '覆盖并应用',
        cancelButtonText: '取消',
      })
    }

    const templateInstance = instantiateTemplate(templateId)
    if (!templateInstance) {
      ElMessage.error('模板实例生成失败')
      return
    }

    const nextRoot = cloneDeep(rootNode)
    nextRoot.container = {
      mode: 'grid',
      columns: templateInstance.root.columns,
      rows: templateInstance.root.rows,
      gap: templateInstance.root.gap ?? 12,
    }
    nextRoot.style = {
      ...(nextRoot.style || {}),
      ...(templateInstance.root.style || {}),
    }
    nextRoot.children = templateInstance.nodes

    componentStore.setTree(nextRoot)
    componentStore.clearSelection()
    componentStore.syncToProjectStore()

    const currentPage = projectStore.currentPage
    if (currentPage && templateInstance.pageActions !== undefined) {
      currentPage.actions = cloneDeep(templateInstance.pageActions)
    }

    if (templateInstance.globalActions !== undefined) {
      if (!projectStore.project.logic) {
        projectStore.project.logic = {}
      }
      projectStore.project.logic.actions = cloneDeep(templateInstance.globalActions)
    }

    // 编辑器固定网格模式，不再写入布局模式字段
    historyStore.clear()

    ElMessage.success(`已应用模板: ${selectedTemplate.name}`)
  } catch (error) {
    if (error === 'cancel' || error === 'close') {
      return
    }
    console.error('[MaterialPanel] Failed to apply template:', error)
    ElMessage.error('模板应用失败')
  }
}

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
  const canonicalName = resolveCanonicalMaterialName(name)

  // 从 MaterialMeta 提取默认 props
  const defaultProps = extractDefaultProps(meta.props || {})
  const defaultStyles = extractDefaultStyles(meta.styles)

  const width = meta.defaultSize?.width || categoryConfig.defaultWidth || 120
  const height = meta.defaultSize?.height || categoryConfig.defaultHeight || 80
  const styleWithDefaults: Record<string, unknown> = {
    ...defaultStyles,
    width: defaultStyles.width ?? width,
    height: defaultStyles.height ?? height,
  }

  // 构建完整的 NodeSchema 结构
  const nodeSchema: Partial<NodeSchema> = {
    id: generateId(canonicalName),
    component: canonicalName,
    props: defaultProps as Record<string, PropValue>,
    style: styleWithDefaults as NodeSchema['style'],
    children: [],
  }

  console.log('[MaterialPanel] Drag start:', {
    component: canonicalName,
    originalComponent: name,
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
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border-light); /* Refined border */
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.3); /* Slight tint */
}

/* 现代化 Tabs */
.modern-tabs {
  /* 通用 tabs 规则抽离到 patterns.css 的 .vela-panel-tabs */
}

.modern-tabs :deep(.el-tabs__header) {
  border-bottom: none;
}

.modern-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background-color: var(--border-light);
}

.modern-tabs :deep(.el-tabs__item) {
  height: 48px; /* Taller click area */
}

.modern-tabs :deep(.el-tabs__item.is-active) {
  color: var(--color-primary);
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

/* 页面模板 */
.template-list {
  padding: 10px 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.template-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  overflow: hidden;
  background: var(--el-fill-color-blank);
  transition: all 0.2s ease;
}

.template-card:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.08);
}

.template-preview {
  height: 58px;
  position: relative;
}

.template-category {
  position: absolute;
  top: 8px;
  left: 8px;
  font-size: 11px;
  line-height: 1;
  padding: 4px 8px;
  border-radius: 999px;
  color: #fff;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(2px);
}

.template-content {
  padding: 10px 10px 6px;
}

.template-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.template-desc {
  font-size: 12px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
}

.template-action {
  margin: 0 10px 10px;
  width: calc(100% - 20px);
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
