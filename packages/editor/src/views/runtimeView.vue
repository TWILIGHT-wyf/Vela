<template>
  <div class="runtime-view" :class="{ 'theme-dark': isDarkMode }">
    <ExportConfigDialog v-model="exportDialogVisible" :project="projectSnapshot" />

    <!-- 全屏加载遮罩 -->
    <transition name="fade">
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-content">
          <div class="loading-spinner">
            <div class="spinner-ring"></div>
            <el-icon class="spinner-icon" :size="32"><MapLocation /></el-icon>
          </div>
          <p class="loading-text">正在加载预览...</p>
          <p class="loading-hint">准备渲染组件</p>
        </div>
      </div>
    </transition>

    <template v-if="!isLoading">
      <!-- 重构后的 Header -->
      <header class="preview-header">
        <div class="header-left">
          <!-- 返回按钮 -->
          <el-tooltip content="返回编辑器" placement="bottom">
            <el-button class="back-btn" text @click="backToEditor">
              <el-icon><Back /></el-icon>
            </el-button>
          </el-tooltip>

          <div class="header-divider"></div>

          <!-- 项目信息 -->
          <div class="project-info">
            <el-icon class="project-icon"><Folder /></el-icon>
            <span class="project-name">{{ projectName }}</span>
            <span class="page-separator">/</span>
            <span class="page-name">{{ currentPageName || '未选择页面' }}</span>
            <el-tag
              :type="isProjectMode ? 'success' : 'info'"
              size="small"
              effect="dark"
              class="mode-tag"
            >
              {{ isProjectMode ? '项目预览' : '单页预览' }}
            </el-tag>
          </div>
        </div>

        <!-- 中间：页面导航 -->
        <div class="header-center">
          <el-select
            v-if="isProjectMode && allPages.length > 1"
            v-model="currentPageId"
            placeholder="选择页面"
            class="page-selector"
            @change="navigateToPage"
          >
            <template #prefix>
              <el-icon><Files /></el-icon>
            </template>
            <el-option v-for="page in allPages" :key="page.id" :label="page.name" :value="page.id">
              <div class="page-option">
                <span class="page-option-name">{{ page.name }}</span>
                <span v-if="page.route" class="page-option-route">{{ page.route }}</span>
              </div>
            </el-option>
          </el-select>
        </div>

        <!-- 右侧：功能按钮 -->
        <div class="header-right">
          <el-tooltip content="刷新预览" placement="bottom">
            <el-button class="action-btn" text @click="refreshPreview">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </el-tooltip>

          <el-tooltip content="查看 JSON" placement="bottom">
            <el-button
              class="action-btn"
              text
              :class="{ 'is-active': activePreviewTab === 'json' }"
              @click="activePreviewTab = 'json'"
            >
              <el-icon><Document /></el-icon>
            </el-button>
          </el-tooltip>

          <el-tooltip content="查看源码" placement="bottom">
            <el-button
              class="action-btn"
              text
              :class="{ 'is-active': activePreviewTab === 'code' }"
              @click="activePreviewTab = 'code'"
            >
              <el-icon><Edit /></el-icon>
            </el-button>
          </el-tooltip>

          <div class="header-divider"></div>

          <el-button type="primary" plain @click="openExportDialog" class="export-btn">
            <el-icon><Download /></el-icon>
            导出
          </el-button>

          <el-tooltip content="切换主题" placement="bottom">
            <el-switch
              v-model="isDarkMode"
              :active-icon="Moon"
              :inactive-icon="Sunny"
              class="theme-switch"
            />
          </el-tooltip>
        </div>
      </header>

      <!-- Tab 切换栏 -->
      <nav class="tab-nav">
        <button
          class="tab-item"
          :class="{ 'is-active': activePreviewTab === 'runtime' }"
          @click="activePreviewTab = 'runtime'"
        >
          <el-icon><View /></el-icon>
          运行画布
        </button>
        <button
          class="tab-item"
          :class="{ 'is-active': activePreviewTab === 'json' }"
          @click="activePreviewTab = 'json'"
        >
          <el-icon><Document /></el-icon>
          全站 JSON
        </button>
        <button
          class="tab-item"
          :class="{ 'is-active': activePreviewTab === 'code' }"
          @click="activePreviewTab = 'code'"
        >
          <el-icon><Edit /></el-icon>
          全站代码
        </button>
      </nav>

      <!-- 内容区域 -->
      <main class="preview-main">
        <!-- 运行画布 Tab -->
        <div v-show="activePreviewTab === 'runtime'" class="tab-content runtime-content">
          <div class="canvas-wrapper">
            <div class="preview-stage" ref="previewStage">
              <!-- 使用 RuntimeRenderer 替代原有的渲染逻辑 -->
              <RuntimeRenderer
                :components="previewComponents"
                :pages="allPages"
                :is-project-mode="isProjectMode"
                :plugins="[DataBindingPlugin, EventExecutorPlugin]"
                @navigate-page="navigateToPage"
              />
            </div>
          </div>
        </div>

        <!-- JSON Tab -->
        <div v-show="activePreviewTab === 'json'" class="tab-content json-content">
          <div class="panel-card">
            <div class="panel-header">
              <div class="panel-info">
                <el-icon class="panel-icon"><Document /></el-icon>
                <div>
                  <h3 class="panel-title">项目结构 JSON</h3>
                  <p class="panel-desc">同步所有页面与数据，便于全站调试</p>
                </div>
              </div>
              <div class="panel-actions">
                <el-button text @click="copyProjectJson" :disabled="!projectSnapshot">
                  <el-icon><CopyDocument /></el-icon>
                  复制
                </el-button>
                <el-button text @click="downloadProjectJson" :disabled="!projectSnapshot">
                  <el-icon><Download /></el-icon>
                  下载
                </el-button>
              </div>
            </div>
            <div class="code-preview-box">
              <pre><code class="hljs language-json" v-html="highlightedJson"></code></pre>
            </div>
          </div>
        </div>

        <!-- 代码 Tab -->
        <div v-show="activePreviewTab === 'code'" class="tab-content code-content">
          <div class="panel-card code-panel">
            <div class="panel-header">
              <div class="panel-info">
                <el-icon class="panel-icon"><Files /></el-icon>
                <div>
                  <h3 class="panel-title">生成目录结构</h3>
                  <p class="panel-desc">点击文件即可在右侧查看源码</p>
                </div>
              </div>
              <div class="panel-actions">
                <el-radio-group v-model="codePreviewOptions.language" size="small">
                  <el-radio-button value="ts">TypeScript</el-radio-button>
                  <el-radio-button value="js">JavaScript</el-radio-button>
                </el-radio-group>
                <el-checkbox v-model="codePreviewOptions.lint" size="small">
                  含 ESLint/Prettier
                </el-checkbox>
              </div>
            </div>

            <div class="code-layout">
              <!-- 文件树 -->
              <aside class="file-tree-panel">
                <div class="tree-header">
                  <el-icon><FolderOpened /></el-icon>
                  <span>项目文件</span>
                </div>
                <el-scrollbar class="tree-scroll">
                  <el-tree
                    :data="fileTreeData"
                    :props="fileTreeProps"
                    node-key="path"
                    highlight-current
                    default-expand-all
                    :expand-on-click-node="false"
                    :current-node-key="selectedFilePath"
                    @node-click="handleFileNodeClick"
                  >
                    <template #default="{ node, data }">
                      <span class="tree-node">
                        <el-icon v-if="!data.isLeaf" class="folder-icon"><Folder /></el-icon>
                        <el-icon v-else class="file-icon" :class="getFileIconClass(data.label)">
                          <Document />
                        </el-icon>
                        <span class="node-label">{{ node.label }}</span>
                      </span>
                    </template>
                  </el-tree>
                </el-scrollbar>
              </aside>

              <!-- 代码查看器 -->
              <section class="code-viewer-panel">
                <div class="code-viewer-header">
                  <div class="file-info">
                    <el-icon><Document /></el-icon>
                    <span class="file-path">{{
                      selectedFilePath || '选择一个文件以查看代码'
                    }}</span>
                  </div>
                  <div class="code-actions">
                    <el-button
                      text
                      size="small"
                      @click="copyCurrentFile"
                      :disabled="!selectedFileContent"
                    >
                      <el-icon><CopyDocument /></el-icon>
                      复制
                    </el-button>
                    <el-button
                      text
                      size="small"
                      @click="downloadCurrentFile"
                      :disabled="!selectedFileContent"
                    >
                      <el-icon><Download /></el-icon>
                      下载
                    </el-button>
                  </div>
                </div>
                <div v-if="selectedFileContent" class="code-preview-box">
                  <pre><code :class="'hljs language-' + getLanguageFromPath(selectedFilePath)" v-html="highlightedCode"></code></pre>
                </div>
                <div v-else class="code-empty">
                  <el-icon :size="48"><DocumentRemove /></el-icon>
                  <p>请选择左侧文件查看源码</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, onBeforeUnmount, shallowRef } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useProjectStore } from '@/stores/project'
import { ElMessage } from 'element-plus'
import { RuntimeRenderer, DataBindingPlugin, EventExecutorPlugin } from '@vela/renderer'
import * as projectService from '@/services/projects'
import ExportConfigDialog from '@/components/dialogs/ExportConfigDialog.vue'
import { useComponent } from '@/stores/component'
import { storeToRefs } from 'pinia'
import {
  generateProjectSourceFiles,
  type ExportOptions,
  type GeneratedSourceFile,
  type Project,
  type Page,
  type Component,
} from '@vela/generator/projectGenerator'
import {
  Document,
  CopyDocument,
  Files,
  Download,
  Back,
  Refresh,
  Edit,
  View,
  Folder,
  FolderOpened,
  DocumentRemove,
  Moon,
  Sunny,
  MapLocation,
} from '@element-plus/icons-vue'

// 引入 highlight.js
import hljs from 'highlight.js/lib/core'
import json from 'highlight.js/lib/languages/json'
import xml from 'highlight.js/lib/languages/xml'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import css from 'highlight.js/lib/languages/css'
import 'highlight.js/styles/atom-one-dark.css'

// 注册语言
hljs.registerLanguage('json', json)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('vue', xml)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('css', css)

const router = useRouter()
const route = useRoute()

const projectStore = useProjectStore()

// 运行态：部分自定义组件依赖 Pinia componentStore 取数。
// 预览页用 previewComponents 作为数据源时，需要同步到 store（并在离开时恢复），避免组件取不到数据。
const componentStore = useComponent()
const { componentStore: runtimeStoreComponents, selectedIds: runtimeSelectedIds } =
  storeToRefs(componentStore)
const storeSnapshot = shallowRef<{
  components: Component[]
  selectedIds: string[]
} | null>(null)

// 主题模式
const isDarkMode = ref(true)

// 预览页面使用独立的本地组件状态，不依赖 componentStore
// 这样可以避免编辑器和预览页面之间的状态污染
const previewComponents = ref<Component[]>([])
const previewStage = ref<HTMLDivElement | null>(null)
const isLoading = ref(true)
const projectName = ref('')
const currentPageName = ref('')
const currentPageId = ref('')
const allPages = ref<Page[]>([])
const projectSnapshot = ref<Project | null>(null)
const exportDialogVisible = ref(false)
const activePreviewTab = ref<'runtime' | 'json' | 'code'>('runtime')
const codePreviewOptions = reactive<ExportOptions>({ language: 'ts', lint: true })
const generatedFiles = ref<GeneratedSourceFile[]>([])
const selectedFilePath = ref('')
const fileTreeProps = Object.freeze({ children: 'children', label: 'label' })

// 从 URL 获取项目和页面信息
const projectId = computed(() => (route.query.projectId as string) || (route.params.id as string))
const initialPageId = computed(() => route.query.pageId as string)
const isProjectMode = computed(() => route.query.mode === 'project')
const fullProjectJson = computed(() =>
  projectSnapshot.value ? JSON.stringify(projectSnapshot.value, null, 2) : '// 尚未加载项目',
)

// 高亮后的 JSON
const highlightedJson = computed(() => {
  if (!projectSnapshot.value) return '// 尚未加载项目'
  try {
    const jsonStr = JSON.stringify(projectSnapshot.value, null, 2)
    return hljs.highlight(jsonStr, { language: 'json' }).value
  } catch {
    return fullProjectJson.value
  }
})

// 高亮后的代码
const highlightedCode = computed(() => {
  if (!selectedFileContent.value) return ''
  try {
    const lang = getLanguageFromPath(selectedFilePath.value)
    return hljs.highlight(selectedFileContent.value, { language: lang }).value
  } catch {
    return selectedFileContent.value
  }
})

const fileTreeData = computed<FileTreeNode[]>(() => sortTree(buildFileTree(generatedFiles.value)))
const selectedFileContent = computed(() => {
  return (
    generatedFiles.value.find((file: GeneratedSourceFile) => file.path === selectedFilePath.value)
      ?.content || ''
  )
})

// 根据文件路径获取语言
function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || ''
  const langMap: Record<string, string> = {
    vue: 'xml',
    html: 'xml',
    json: 'json',
    js: 'javascript',
    ts: 'typescript',
    css: 'css',
    scss: 'css',
  }
  return langMap[ext] || 'javascript'
}

// 获取文件图标类名
function getFileIconClass(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const classMap: Record<string, string> = {
    vue: 'file-vue',
    ts: 'file-ts',
    js: 'file-js',
    json: 'file-json',
    css: 'file-css',
    html: 'file-html',
  }
  return classMap[ext] || ''
}

// 加载指定页面的组件
async function loadPage(pageId: string) {
  const page = allPages.value.find((p: Page) => p.id === pageId)
  if (page) {
    currentPageId.value = page.id
    currentPageName.value = page.name
    // 深拷贝页面组件数据到本地状态，避免直接引用
    previewComponents.value = JSON.parse(JSON.stringify(page.components || []))

    // 同步到 Pinia store，供运行态组件读取（并让 DataBinding 更新能驱动这些组件）
    // Note: componentStore is a computed readonly property, we can't assign directly
    // Instead, use the store's action to set data or work with the preview components directly
    componentStore.clearSelection()

    // 数据联动引擎已由 RuntimeRenderer 管理，无需手动启动
  }
}

// 页面导航
function navigateToPage(pageId: string) {
  loadPage(pageId)

  // 更新 URL（不刷新页面）
  const query = { ...route.query, pageId }
  router.replace({ query })
}

// 加载预览数据
onMounted(async () => {
  // 进入预览前，快照编辑器 store 状态，离开时恢复
  storeSnapshot.value = {
    components: JSON.parse(JSON.stringify(runtimeStoreComponents.value || [])),
    selectedIds: [...(runtimeSelectedIds.value || [])],
  }

  if (!projectId.value) {
    ElMessage.error('缺少项目ID')
    router.push('/')
    return
  }

  isLoading.value = true

  try {
    // 优先使用本地store中的最新项目数据，避免服务器延迟导致的数据不一致
    // Note: projectStore doesn't have currentProject, use project directly
    const localProject = projectStore.project
    if (localProject && localProject.pages.length > 0) {
      // Convert ProjectSchema to generator's Project format
      syncProjectContext({
        name: localProject.name,
        description: localProject.description,
        pages: localProject.pages.map((page) => ({
          id: page.id,
          name: page.name,
          route: page.path,
          components: page.children ? flattenNodeToComponents(page.children) : [],
        })),
      })
    } else {
      const serverProject = await projectService.getProject(projectId.value)
      if (serverProject) {
        syncProjectContext({
          id: serverProject._id,
          name: serverProject.name,
          description: serverProject.description,
          pages: serverProject.schema.pages.map((page) => ({
            id: page.id,
            name: page.name,
            route: page.path,
            components: page.children ? flattenNodeToComponents(page.children) : [],
          })),
          createdAt: new Date(serverProject.createdAt).getTime(),
          updatedAt: new Date(serverProject.updatedAt).getTime(),
        })
      } else {
        throw new Error('Server returned null')
      }
    }
  } catch (error) {
    console.warn('加载项目失败:', error)
    ElMessage.error('加载项目失败')
    router.push('/')
    return
  }

  // 确定要加载的页面
  let targetPageId = initialPageId.value

  if (!targetPageId && allPages.value.length > 0) {
    // 如果没有指定页面，默认加载第一个页面
    targetPageId = allPages.value[0]?.id || ''
  }

  if (targetPageId) {
    await loadPage(targetPageId)
  } else {
    ElMessage.warning('项目中没有页面')
  }

  isLoading.value = false
})

/**
 * Helper function to flatten NodeSchema tree to Component array
 */
function flattenNodeToComponents(node: {
  id: string
  componentName: string
  props?: Record<string, unknown>
  style?: Record<string, unknown>
  children?: unknown[]
  events?: Record<string, unknown[]>
}): Component[] {
  const result: Component[] = []
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      const childNode = child as typeof node
      result.push({
        id: childNode.id,
        componentName: childNode.componentName,
        props: childNode.props,
        style: childNode.style,
        events: childNode.events,
        children: childNode.children ? flattenNodeToComponents(childNode) : undefined,
      })
    }
  }
  return result
}

onBeforeUnmount(() => {
  // 数据联动引擎的清理已由 RuntimeRenderer 自动处理
  if (storeSnapshot.value) {
    // Restore selection state
    componentStore.selectComponents(storeSnapshot.value.selectedIds)
  }
})

// 监听路由变化（用于项目模式下的页面切换）
watch(
  () => route.query.pageId,
  (newPageId) => {
    if (newPageId && typeof newPageId === 'string' && newPageId !== currentPageId.value) {
      loadPage(newPageId)
    }
  },
)

// 返回编辑器
function backToEditor() {
  // 离开前恢复 store，避免预览污染编辑器
  if (storeSnapshot.value) {
    componentStore.selectComponents(storeSnapshot.value.selectedIds)
  }
  if (projectId.value) {
    router.push(`/editor/${projectId.value}`)
  } else {
    router.push('/')
  }
}

function refreshPreview() {
  window.location.reload()
}

function copyProjectJson() {
  if (!projectSnapshot.value) return
  copyToClipboard(fullProjectJson.value, '全站 JSON 已复制')
}

function downloadProjectJson() {
  if (!projectSnapshot.value) return
  const blob = new Blob([fullProjectJson.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${projectName.value || 'project'}-full.json`
  a.click()
  URL.revokeObjectURL(url)
}

function handleFileNodeClick(node: FileTreeNode) {
  if (node.isLeaf) {
    selectedFilePath.value = node.path
  }
}

function copyCurrentFile() {
  if (!selectedFileContent.value) return
  copyToClipboard(selectedFileContent.value, '源码已复制')
}

function downloadCurrentFile() {
  if (!selectedFileContent.value || !selectedFilePath.value) return
  const blob = new Blob([selectedFileContent.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = selectedFilePath.value.split('/').pop() || 'file'
  a.click()
  URL.revokeObjectURL(url)
}

function openExportDialog() {
  if (!projectSnapshot.value) {
    ElMessage.warning('当前没有可导出的项目')
    return
  }
  exportDialogVisible.value = true
}

watch(
  () => [projectSnapshot.value, codePreviewOptions.language, codePreviewOptions.lint],
  () => {
    if (!projectSnapshot.value) {
      generatedFiles.value = []
      selectedFilePath.value = ''
      return
    }

    try {
      const files = generateProjectSourceFiles(projectSnapshot.value, {
        language: codePreviewOptions.language,
        lint: codePreviewOptions.lint,
      })
      generatedFiles.value = files
      if (!files.find((file) => file.path === selectedFilePath.value)) {
        selectedFilePath.value = files[0]?.path || ''
      }
    } catch (error) {
      console.error('生成项目源码失败:', error)
      ElMessage.error('生成源码失败，请稍后重试')
    }
  },
  { immediate: true },
)

function syncProjectContext(project: Project) {
  projectName.value = project.name
  allPages.value = project.pages || []
  projectSnapshot.value = cloneProject(project)
}

function cloneProject(project: Project): Project {
  return JSON.parse(JSON.stringify(project))
}

interface FileTreeNode {
  label: string
  path: string
  isLeaf?: boolean
  children?: FileTreeNode[]
}

function buildFileTree(files: GeneratedSourceFile[]): FileTreeNode[] {
  const root: FileTreeNode[] = []
  for (const file of files) {
    const segments = file.path.split('/')
    let currentLevel = root
    let currentPath = ''
    segments.forEach((segment: string, index: number) => {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment
      let node = currentLevel.find((item) => item.label === segment)
      if (!node) {
        node = {
          label: segment,
          path: currentPath,
          isLeaf: index === segments.length - 1,
          children: index === segments.length - 1 ? undefined : [],
        }
        currentLevel.push(node)
      }

      if (index === segments.length - 1) {
        node.isLeaf = true
      } else {
        node.children = node.children || []
        currentLevel = node.children
      }
    })
  }
  return root
}

function sortTree(nodes: FileTreeNode[]): FileTreeNode[] {
  return nodes
    .slice()
    .sort((a, b) => {
      if (!!a.isLeaf === !!b.isLeaf) {
        return a.label.localeCompare(b.label)
      }
      return a.isLeaf ? 1 : -1
    })
    .map((node) => ({
      ...node,
      children: node.children ? sortTree(node.children) : undefined,
    }))
}

async function copyToClipboard(payload: string, successMessage: string) {
  try {
    await navigator.clipboard.writeText(payload)
    ElMessage.success(successMessage)
  } catch (error) {
    try {
      const textarea = document.createElement('textarea')
      textarea.value = payload
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      ElMessage.success(successMessage)
    } catch (fallbackError) {
      console.warn('复制失败', error, fallbackError)
      ElMessage.error('复制失败，请手动复制')
    }
  }
}
</script>

<style scoped>
/* ==================== 基础变量 ==================== */
.runtime-view {
  --preview-bg: #f0f2f5;
  --header-bg: #ffffff;
  --card-bg: #ffffff;
  --border-color: #e4e7ed;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;
  --code-bg: #1e1e1e;
  --code-text: #d4d4d4;
  --accent-color: #409eff;

  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--preview-bg);
  color: var(--text-primary);
  overflow: hidden;
}

/* 暗色主题 */
.runtime-view.theme-dark {
  --preview-bg: #0f111a;
  --header-bg: #1a1d2e;
  --card-bg: #1a1d2e;
  --border-color: rgba(255, 255, 255, 0.08);
  --text-primary: #f5f5f5;
  --text-secondary: #a0aec0;
  --text-muted: #718096;
  --code-bg: #0d0f17;
  --code-text: #e2e8f0;
}

/* ==================== 加载动画 ==================== */
.loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f111a 0%, #1a1d2e 100%);
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.loading-spinner {
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner-ring {
  position: absolute;
  inset: 0;
  border: 3px solid transparent;
  border-top-color: var(--accent-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner-ring::before {
  content: '';
  position: absolute;
  inset: 6px;
  border: 3px solid transparent;
  border-top-color: #67c23a;
  border-radius: 50%;
  animation: spin 0.8s linear infinite reverse;
}

.spinner-icon {
  color: var(--accent-color);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 18px;
  font-weight: 600;
  color: #f5f5f5;
  margin: 0;
}

.loading-hint {
  font-size: 14px;
  color: #718096;
  margin: 0;
}

/* 淡入淡出 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ==================== Header ==================== */
.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 20px;
  background-color: var(--header-bg);
  border-bottom: 1px solid var(--border-color);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.header-left,
.header-center,
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-divider {
  width: 1px;
  height: 20px;
  background-color: var(--border-color);
}

/* 返回按钮 */
.back-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.back-btn:hover {
  background-color: rgba(64, 158, 255, 0.1);
  color: var(--accent-color);
}

/* 项目信息 */
.project-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.project-icon {
  color: var(--accent-color);
  font-size: 18px;
}

.project-name {
  font-weight: 600;
  font-size: 15px;
  color: var(--text-primary);
}

.page-separator {
  color: var(--text-muted);
}

.page-name {
  font-size: 14px;
  color: var(--text-secondary);
}

.mode-tag {
  margin-left: 8px;
}

/* 页面选择器 */
.page-selector {
  width: 200px;
}

.page-selector :deep(.el-select__wrapper) {
  border-radius: 8px;
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
}

.page-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.page-option-name {
  font-weight: 500;
}

.page-option-route {
  font-size: 12px;
  color: var(--text-muted);
  font-family: 'Fira Code', Consolas, monospace;
}

/* 操作按钮 */
.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.action-btn:hover {
  background-color: rgba(64, 158, 255, 0.1);
  color: var(--accent-color);
}

.action-btn.is-active {
  background-color: rgba(64, 158, 255, 0.15);
  color: var(--accent-color);
}

.export-btn {
  border-radius: 8px;
}

.theme-switch {
  margin-left: 4px;
}

/* ==================== Tab 导航 ==================== */
.tab-nav {
  display: flex;
  gap: 4px;
  padding: 12px 20px;
  background-color: var(--header-bg);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-item:hover {
  background-color: rgba(64, 158, 255, 0.08);
  color: var(--text-primary);
}

.tab-item.is-active {
  background-color: var(--accent-color);
  color: #ffffff;
}

/* ==================== 主内容区 ==================== */
.preview-main {
  flex: 1;
  overflow: hidden;
  padding: 20px;
}

.tab-content {
  height: 100%;
  overflow: hidden;
}

/* ==================== 运行画布 ==================== */
.runtime-content {
  display: flex;
  align-items: center;
  justify-content: center;
}

.canvas-wrapper {
  max-width: 100%;
  max-height: 100%;
  overflow: auto;
  padding: 24px;
}

.preview-stage {
  position: relative;
  width: 1920px;
  height: 1080px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.05),
    0 10px 20px rgba(0, 0, 0, 0.08),
    0 20px 40px rgba(0, 0, 0, 0.06);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
}

.empty-illustration {
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%);
  border-radius: 50%;
  color: #a0aec0;
}

.empty-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #4a5568;
}

.empty-desc {
  margin: 0;
  font-size: 14px;
  color: #718096;
}

/* ==================== 面板卡片 ==================== */
.panel-card {
  height: 100%;
  background-color: var(--card-bg);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: 12px;
}

.panel-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.panel-icon {
  font-size: 24px;
  color: var(--accent-color);
}

.panel-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.panel-desc {
  margin: 2px 0 0;
  font-size: 13px;
  color: var(--text-muted);
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ==================== 代码预览盒子 (核心修复) ==================== */
.code-preview-box {
  flex: 1;
  overflow: auto;
  background: var(--code-bg);
  margin: 0;
  min-height: 0;
}

.code-preview-box pre {
  margin: 0;
  padding: 16px;
}

.code-preview-box code {
  font-family: 'Fira Code', 'JetBrains Mono', Consolas, Monaco, monospace;
  font-size: 13px;
  line-height: 1.6;
  color: var(--code-text);
  white-space: pre;
  display: block;
}

/* hljs 主题覆盖 */
.code-preview-box .hljs {
  background: transparent;
  padding: 0;
}

/* ==================== JSON 内容 ==================== */
.json-content .panel-card {
  height: 100%;
}

.json-content .code-preview-box {
  border-radius: 0 0 12px 12px;
}

/* ==================== 代码内容 ==================== */
.code-content {
  display: flex;
}

.code-panel {
  flex: 1;
}

.code-layout {
  flex: 1;
  display: flex;
  gap: 16px;
  padding: 16px;
  min-height: 0;
  overflow: hidden;
}

/* 文件树 */
.file-tree-panel {
  width: 280px;
  flex-shrink: 0;
  background-color: var(--code-bg);
  border-radius: 10px;
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tree-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.tree-scroll {
  flex: 1;
  padding: 8px;
}

.file-tree-panel :deep(.el-tree) {
  background: transparent;
  color: var(--code-text);
  --el-tree-node-hover-bg-color: rgba(64, 158, 255, 0.1);
}

.file-tree-panel :deep(.el-tree-node__content) {
  height: 32px;
  border-radius: 6px;
}

.file-tree-panel :deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: rgba(64, 158, 255, 0.2);
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.folder-icon {
  color: #f0c36d;
}

.file-icon {
  color: #a0aec0;
}

.file-icon.file-vue {
  color: #42b883;
}

.file-icon.file-ts {
  color: #3178c6;
}

.file-icon.file-js {
  color: #f7df1e;
}

.file-icon.file-json {
  color: #f5a623;
}

.file-icon.file-css {
  color: #264de4;
}

/* 代码查看器 */
.code-viewer-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--code-bg);
  border-radius: 10px;
  border: 1px solid var(--border-color);
  overflow: hidden;
  min-width: 0;
}

.code-viewer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  min-width: 0;
}

.file-path {
  font-family: 'Fira Code', Consolas, monospace;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.code-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.code-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-muted);
}

.code-empty p {
  margin: 0;
  font-size: 14px;
}

/* ==================== 响应式 ==================== */
@media (max-width: 1024px) {
  .header-center {
    display: none;
  }

  .code-layout {
    flex-direction: column;
  }

  .file-tree-panel {
    width: 100%;
    max-height: 200px;
  }
}

@media (max-width: 768px) {
  .preview-header {
    flex-wrap: wrap;
    height: auto;
    padding: 12px 16px;
    gap: 12px;
  }

  .header-left,
  .header-right {
    width: 100%;
    justify-content: space-between;
  }

  .tab-nav {
    overflow-x: auto;
  }

  .preview-main {
    padding: 12px;
  }
}
</style>
