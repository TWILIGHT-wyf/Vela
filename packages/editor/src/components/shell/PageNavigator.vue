<template>
  <div class="page-navigator" ref="managerRef">
    <el-button
      class="page-trigger-btn"
      :class="{ 'is-active': isPageMenuOpen }"
      text
      @click="togglePageMenu"
    >
      <el-icon class="icon-left"><Files /></el-icon>
      <div class="current-page-info">
        <span class="page-name">{{ activePage?.name || '选择页面' }}</span>
      </div>
      <el-icon class="icon-right" :class="{ 'rotate-180': isPageMenuOpen }">
        <ArrowDown />
      </el-icon>
    </el-button>

    <!-- 下拉面板 -->
    <transition name="el-zoom-in-top">
      <div v-if="isPageMenuOpen" class="mega-dropdown">
        <!-- 搜索栏 -->
        <div class="dropdown-header">
          <el-input
            v-model="searchQuery"
            placeholder="搜索页面或路由..."
            prefix-icon="Search"
            size="small"
            clearable
          />
        </div>

        <!-- 页面树 -->
        <div class="dropdown-body">
          <el-scrollbar max-height="300px">
            <div class="tree-container">
              <PageTreeNode
                v-for="node in filteredTree"
                :key="node.id"
                :node="node"
                :active-id="activePageId"
                @select="selectPage"
                @delete="handleDeletePage"
                @edit="handleEditPage"
                @copy-route="handleCopyRoute"
              />
            </div>
          </el-scrollbar>
        </div>

        <!-- 底部操作栏 -->
        <div class="dropdown-footer">
          <el-button
            size="small"
            icon="DocumentAdd"
            type="primary"
            @click="handleAddPage"
            style="width: 100%"
          >
            新建页面
          </el-button>
        </div>
      </div>
    </transition>

    <!-- 新建页面对话框 -->
    <el-dialog
      v-model="showAddPageDialog"
      title="新建页面"
      width="420px"
      align-center
      class="add-page-dialog"
      :close-on-click-modal="false"
    >
      <el-form :model="newPageForm" label-position="top" class="add-page-form">
        <el-form-item label="页面名称" required>
          <el-input
            v-model="newPageForm.name"
            placeholder="例如：关于我们、联系方式"
            maxlength="30"
            show-word-limit
            size="large"
          >
            <template #prefix>
              <el-icon><DocumentAdd /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="路由路径 (可选)">
          <el-input
            v-model="newPageForm.route"
            placeholder="如：/about、/contact"
            maxlength="50"
            size="large"
          >
            <template #prefix>
              <el-icon><Link /></el-icon>
            </template>
          </el-input>
          <div class="form-tip">留空则使用页面名称自动生成路由</div>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showAddPageDialog = false" size="large">取消</el-button>
          <el-button type="primary" @click="submitAddPage" size="large" icon="Plus">
            创建页面
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useProjectStore } from '@/stores/project'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageTreeNode from './PageTreeNode.vue'
import { Files, ArrowDown, DocumentAdd, Link } from '@element-plus/icons-vue'
import type { PageSchema } from '@vela/core'

// 定义页面树节点类型
interface PageTreeNode {
  id: string
  name: string
  type: 'page'
  path: string
  expanded: boolean
  isHome: boolean
}

const projectStore = useProjectStore()

// 状态管理
const isPageMenuOpen = ref(false)
const managerRef = ref<HTMLElement | null>(null)
const searchQuery = ref('')
const showAddPageDialog = ref(false)
const newPageForm = ref({ name: '', route: '' })

// 从 Store 获取真实页面列表
const pagesFromStore = computed(() => projectStore.project?.pages || [])
const activePageId = computed(() => projectStore.activePageId || '')

const activePage = computed(() => {
  return pagesFromStore.value.find((p: PageSchema) => p.id === activePageId.value)
})

// 将页面列表转换为树节点格式
const pageTree = computed<PageTreeNode[]>(() => {
  return pagesFromStore.value.map((page: PageSchema, index: number) => ({
    id: page.id,
    name: page.name,
    type: 'page' as const,
    path: page.path || `/${page.name.toLowerCase().replace(/\s+/g, '-')}`,
    expanded: false,
    isHome: index === 0,
  }))
})

const filteredTree = computed(() => {
  if (!searchQuery.value) return pageTree.value
  return pageTree.value.filter((node) =>
    node.name.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

// 交互方法
function togglePageMenu() {
  isPageMenuOpen.value = !isPageMenuOpen.value
}

function selectPage(pageId: string) {
  projectStore.switchPage(pageId)
  isPageMenuOpen.value = false
}

async function handleAddPage() {
  showAddPageDialog.value = true
  newPageForm.value = { name: '', route: '' }
}

async function submitAddPage() {
  const name = newPageForm.value.name?.trim()

  if (!name) {
    ElMessage.warning('页面名称不能为空')
    return
  }

  projectStore.addPage(name)
  ElMessage.success('页面创建成功')
  showAddPageDialog.value = false
  isPageMenuOpen.value = false
}

async function handleDeletePage(pageId: string) {
  const page = pagesFromStore.value.find((p: PageSchema) => p.id === pageId)
  if (!page) return

  try {
    await ElMessageBox.confirm(`确定删除页面 "${page.name}" 吗？`, '警告', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })

    projectStore.deletePage(pageId)
    ElMessage.success('页面已删除')
  } catch {
    // 用户取消
  }
}

async function handleEditPage(data: { id: string; name: string; route?: string }) {
  try {
    projectStore.renamePage(data.id, data.name)
    ElMessage.success('页面信息已更新')
  } catch (error) {
    console.error('编辑页面失败:', error)
    ElMessage.error('编辑页面失败，请重试')
  }
}

async function handleCopyRoute(route: string) {
  try {
    await navigator.clipboard.writeText(route)
    ElMessage.success(`路由 "${route}" 已复制到剪贴板`)
  } catch (error) {
    console.error('复制失败:', error)
    // 降级方案
    try {
      const textArea = document.createElement('textarea')
      textArea.value = route
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      ElMessage.success(`路由 "${route}" 已复制到剪贴板`)
    } catch (fallbackError) {
      console.error('降级复制也失败:', fallbackError)
      ElMessage.error('复制失败，请手动复制')
    }
  }
}

// 点击外部关闭下拉菜单
function handleClickOutside(event: MouseEvent) {
  if (managerRef.value && !managerRef.value.contains(event.target as Node)) {
    isPageMenuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})
</script>

<style scoped>
.page-navigator {
  position: relative;
}

.page-trigger-btn {
  font-weight: 500;
  color: var(--el-text-color-regular);
  padding: 8px 14px;
  height: 36px;
  border-radius: 8px;
  transition: all 0.2s;
  background: transparent;
}

.page-trigger-btn:hover,
.page-trigger-btn.is-active {
  background-color: rgba(66, 133, 244, 0.08);
  color: var(--el-color-primary);
}

.current-page-info {
  display: flex;
  align-items: center;
}

.page-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.icon-left {
  margin-right: 6px;
}

.icon-right {
  margin-left: 6px;
  font-size: 12px;
  transition: transform 0.3s;
}

.rotate-180 {
  transform: rotate(180deg);
}

/* 垂直下拉 Mega Dropdown */
.mega-dropdown {
  position: absolute;
  top: 44px;
  left: 0;
  width: 320px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 2000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dropdown-header {
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: linear-gradient(to bottom, var(--el-fill-color-extra-light), transparent);
}

.dropdown-header :deep(.el-input__wrapper) {
  border-radius: 8px;
  background-color: var(--el-bg-color);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.dropdown-body {
  flex: 1;
  padding: 8px 0;
  min-height: 100px;
}

.tree-container {
  padding: 0 8px;
}

.dropdown-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: linear-gradient(to top, var(--el-fill-color-extra-light), transparent);
}

.dropdown-footer .el-button {
  border-radius: 8px;
  font-weight: 500;
}

/* 新建页面对话框样式 */
:deep(.add-page-dialog .el-dialog) {
  border-radius: 16px;
  overflow: hidden;
}

:deep(.add-page-dialog .el-dialog__header) {
  padding: 20px 24px;
  margin: 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: linear-gradient(to bottom, var(--el-fill-color-extra-light), transparent);
}

:deep(.add-page-dialog .el-dialog__title) {
  font-weight: 600;
  font-size: 16px;
  color: var(--el-text-color-primary);
}

:deep(.add-page-dialog .el-dialog__body) {
  padding: 24px;
}

:deep(.add-page-dialog .el-dialog__footer) {
  padding: 16px 24px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-extra-light);
}

.add-page-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: var(--el-text-color-primary);
  padding-bottom: 8px;
}

.add-page-form :deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.add-page-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.add-page-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.15);
}

.form-tip {
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.dialog-footer .el-button {
  border-radius: 8px;
  font-weight: 500;
  min-width: 90px;
}
</style>
