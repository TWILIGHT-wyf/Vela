<template>
  <div class="preview-page">
    <header class="preview-header">
      <div class="header-left">
        <el-button text @click="handleBack" class="back-btn">
          <el-icon><Back /></el-icon>
          返回编辑器
        </el-button>
        <div class="header-divider"></div>
        <div class="preview-info">
          <span class="page-name">{{ currentPage?.name || '未命名页面' }}</span>
        </div>
      </div>

      <div class="header-center">
        <!-- Tab 切换 -->
        <div class="tab-group">
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'preview' }"
            @click="activeTab = 'preview'"
          >
            <el-icon><View /></el-icon>
            运行预览
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'json' }"
            @click="activeTab = 'json'"
          >
            <el-icon><Document /></el-icon>
            JSON
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'code' }"
            @click="activeTab = 'code'"
          >
            <el-icon><Edit /></el-icon>
            源代码
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'project' }"
            @click="activeTab = 'project'"
          >
            <el-icon><FolderOpened /></el-icon>
            项目代码
          </button>
        </div>
      </div>

      <div class="header-right">
        <el-button size="small" @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </header>

    <main class="preview-main">
      <!-- 运行预览 Tab -->
      <div v-show="activeTab === 'preview'" class="tab-content preview-tab">
        <div class="preview-viewport-wrapper">
          <div class="preview-viewport">
            <RuntimeRenderer v-if="rootNode" :root-node="rootNode" mode="preview" />
            <div v-else class="empty-state">
              <div class="empty-icon">📄</div>
              <p>当前页面没有内容</p>
            </div>
          </div>
        </div>
      </div>

      <!-- JSON Tab -->
      <div v-show="activeTab === 'json'" class="tab-content json-tab">
        <div class="panel-card">
          <div class="panel-header">
            <span class="panel-title">页面 JSON 数据</span>
            <div class="panel-actions">
              <el-button text size="small" @click="copyJson">
                <el-icon><CopyDocument /></el-icon>
                复制
              </el-button>
            </div>
          </div>
          <div class="code-preview-box">
            <pre><code class="hljs language-json" v-html="highlightedJson"></code></pre>
          </div>
        </div>
      </div>

      <!-- 源代码 Tab -->
      <div v-show="activeTab === 'code'" class="tab-content code-tab">
        <div class="panel-card">
          <div class="panel-header">
            <span class="panel-title">生成的 {{ codeOptions.framework === 'vue3' ? 'Vue' : 'React' }} 代码</span>
            <div class="panel-actions">
              <el-radio-group v-model="codeOptions.framework" size="small" class="framework-toggle">
                <el-radio-button value="vue3">
                  <span class="framework-icon vue-icon">V</span>
                  Vue3
                </el-radio-button>
                <el-radio-button value="react">
                  <span class="framework-icon react-icon">R</span>
                  React
                </el-radio-button>
              </el-radio-group>
              <el-radio-group v-model="codeOptions.language" size="small">
                <el-radio-button value="ts">TypeScript</el-radio-button>
                <el-radio-button value="js">JavaScript</el-radio-button>
              </el-radio-group>
              <el-button text size="small" @click="copyCode">
                <el-icon><CopyDocument /></el-icon>
                复制
              </el-button>
            </div>
          </div>
          <div class="code-preview-box">
            <div v-if="isGenerating" class="loading-state">
              <el-icon class="is-loading"><Loading /></el-icon>
              <span>生成中...</span>
            </div>
            <pre v-else><code class="hljs" :class="'language-' + getCodeLanguage()" v-html="highlightedCode"></code></pre>
          </div>
        </div>
      </div>

      <!-- 项目代码 Tab -->
      <div v-show="activeTab === 'project'" class="tab-content project-tab">
        <div class="panel-card code-panel">
          <div class="panel-header">
            <div class="panel-info">
              <el-icon class="panel-icon"><FolderOpened /></el-icon>
              <div>
                <h3 class="panel-title">生成目录结构</h3>
                <p class="panel-desc">点击文件即可在右侧查看源码</p>
              </div>
            </div>
            <div class="panel-actions">
              <el-radio-group v-model="projectOptions.framework" size="small" class="framework-toggle">
                <el-radio-button value="vue3">
                  <span class="framework-icon vue-icon">V</span>
                  Vue3
                </el-radio-button>
                <el-radio-button value="react">
                  <span class="framework-icon react-icon">R</span>
                  React
                </el-radio-button>
              </el-radio-group>
              <el-radio-group v-model="projectOptions.language" size="small">
                <el-radio-button value="ts">TypeScript</el-radio-button>
                <el-radio-button value="js">JavaScript</el-radio-button>
              </el-radio-group>
            </div>
          </div>

          <div class="code-layout">
            <!-- 文件树 -->
            <aside class="file-tree-panel">
              <div class="tree-header">
                <el-icon><Folder /></el-icon>
                <span>项目文件</span>
              </div>
              <el-scrollbar class="tree-scroll">
                <div v-if="isGeneratingProject" class="loading-state">
                  <el-icon class="is-loading"><Loading /></el-icon>
                  <span>生成项目文件...</span>
                </div>
                <el-tree
                  v-else
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
                  <span class="file-path">{{ selectedFilePath || '选择一个文件以查看代码' }}</span>
                </div>
                <div class="code-actions">
                  <el-button text size="small" @click="copyFileContent" :disabled="!selectedFileContent">
                    <el-icon><CopyDocument /></el-icon>
                    复制
                  </el-button>
                </div>
              </div>
              <div v-if="selectedFileContent" class="code-preview-box">
                <pre><code class="hljs" :class="'language-' + getLanguageFromPath(selectedFilePath)" v-html="highlightedFileContent"></code></pre>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { RuntimeRenderer } from '@vela/renderer'
import { useComponent } from '@/stores/component'
import { useProjectStore } from '@/stores/project'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import {
  Back,
  View,
  Document,
  Edit,
  Refresh,
  CopyDocument,
  Folder,
  FolderOpened,
  Loading,
  DocumentRemove,
} from '@element-plus/icons-vue'
import type { ProjectSchema } from '@vela/core'

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
const compStore = useComponent()
const projectStore = useProjectStore()

const { rootNode } = storeToRefs(compStore)
const { currentPage } = storeToRefs(projectStore)

const activeTab = ref<'preview' | 'json' | 'code' | 'project'>('preview')

// 单页代码选项
const codeOptions = reactive({
  framework: 'vue3' as 'vue3' | 'react',
  language: 'ts' as 'ts' | 'js',
})

// 项目代码选项
const projectOptions = reactive({
  framework: 'vue3' as 'vue3' | 'react',
  language: 'ts' as 'ts' | 'js',
})

// 生成的代码缓存
const generatedCode = ref('')
const isGenerating = ref(false)

// 项目文件
interface GeneratedFile {
  path: string
  content: string
}
const projectFiles = ref<GeneratedFile[]>([])
const selectedFilePath = ref('')
const isGeneratingProject = ref(false)

interface GeneratorDiagnostic {
  level: 'error' | 'warning' | 'info'
  code: string
  message: string
  path?: string
}

function buildGenerateOptions(
  framework: 'vue3' | 'react',
  language: 'ts' | 'js',
) {
  if (framework === 'vue3') {
    return {
      framework,
      continueOnError: true,
      vue: {
        language,
        lint: true,
      },
    } as const
  }

  return {
    framework,
    continueOnError: true,
    react: {
      typescript: language === 'ts',
      cssModules: true,
      router: 'react-router',
      stateManagement: 'zustand',
    },
  } as const
}

function formatDiagnostics(diagnostics: GeneratorDiagnostic[]): string {
  if (diagnostics.length === 0) return ''
  return diagnostics
    .map((item) => {
      const path = item.path ? ` [${item.path}]` : ''
      return `[${item.level.toUpperCase()}][${item.code}]${path} ${item.message}`
    })
    .join('\n')
}

function buildCodePreview(files: GeneratedFile[], diagnostics: GeneratorDiagnostic[]): string {
  const diagnosticsText = formatDiagnostics(diagnostics)
  const filesText = files
    .map((file) => `/* ===== ${file.path} ===== */\n${file.content}`)
    .join('\n\n')

  if (diagnosticsText && filesText) {
    return `/* ===== GENERATION DIAGNOSTICS ===== */\n${diagnosticsText}\n\n${filesText}`
  }
  if (diagnosticsText) {
    return `/* ===== GENERATION DIAGNOSTICS ===== */\n${diagnosticsText}`
  }
  return filesText
}

function withDiagnosticsFile(
  files: GeneratedFile[],
  diagnostics: GeneratorDiagnostic[],
): GeneratedFile[] {
  if (diagnostics.length === 0) {
    return files
  }

  return [
    ...files,
    {
      path: 'vela.diagnostics.txt',
      content: formatDiagnostics(diagnostics),
    },
  ]
}

// 文件树属性
const fileTreeProps = Object.freeze({ children: 'children', label: 'label' })

// 格式化的 JSON
const formattedJson = computed(() => {
  if (!rootNode.value) return '// 暂无数据'
  return JSON.stringify(rootNode.value, null, 2)
})

// 高亮后的 JSON
const highlightedJson = computed(() => {
  if (!rootNode.value) return '// 暂无数据'
  try {
    return hljs.highlight(formattedJson.value, { language: 'json' }).value
  } catch {
    return formattedJson.value
  }
})

// 高亮后的代码
const highlightedCode = computed(() => {
  if (!generatedCode.value) return ''
  try {
    const lang = getCodeLanguage()
    return hljs.highlight(generatedCode.value, { language: lang }).value
  } catch {
    return generatedCode.value
  }
})

// 选中文件的内容
const selectedFileContent = computed(() => {
  return projectFiles.value.find((file) => file.path === selectedFilePath.value)?.content || ''
})

// 高亮后的文件内容
const highlightedFileContent = computed(() => {
  if (!selectedFileContent.value) return ''
  try {
    const lang = getLanguageFromPath(selectedFilePath.value)
    return hljs.highlight(selectedFileContent.value, { language: lang }).value
  } catch {
    return selectedFileContent.value
  }
})

// 文件树数据
interface FileTreeNode {
  label: string
  path: string
  isLeaf?: boolean
  children?: FileTreeNode[]
}

const fileTreeData = computed<FileTreeNode[]>(() => sortTree(buildFileTree(projectFiles.value)))

// 获取代码语言
function getCodeLanguage(): string {
  if (codeOptions.framework === 'vue3') return 'xml'
  return codeOptions.language === 'ts' ? 'typescript' : 'javascript'
}

// 根据文件路径获取语言
function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || ''
  const langMap: Record<string, string> = {
    vue: 'xml',
    html: 'xml',
    json: 'json',
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
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
    tsx: 'file-tsx',
    js: 'file-js',
    jsx: 'file-jsx',
    json: 'file-json',
    css: 'file-css',
    html: 'file-html',
  }
  return classMap[ext] || ''
}

// 构建文件树
function buildFileTree(files: GeneratedFile[]): FileTreeNode[] {
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

// 排序文件树（文件夹在前，文件在后）
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

// 处理文件节点点击
function handleFileNodeClick(node: FileTreeNode) {
  if (node.isLeaf) {
    selectedFilePath.value = node.path
  }
}

// 监听 code tab 激活时生成代码
watch(
  () => [activeTab.value, codeOptions.framework, codeOptions.language, rootNode.value],
  async () => {
    if (activeTab.value !== 'code' || !rootNode.value) {
      return
    }

    isGenerating.value = true
    try {
      const { generateFromProject } = await import('@vela/generator')
      const result = generateFromProject(
        projectStore.project as ProjectSchema,
        buildGenerateOptions(codeOptions.framework, codeOptions.language),
      )

      generatedCode.value = buildCodePreview(
        result.files.map((file) => ({ path: file.path, content: file.content })),
        result.diagnostics,
      )
    } catch (error) {
      console.error('代码生成失败:', error)
      generatedCode.value = `// 代码生成失败: ${error}`
    } finally {
      isGenerating.value = false
    }
  },
  { immediate: true },
)

// 监听 project tab 激活时生成项目文件
watch(
  () => [activeTab.value, projectOptions.framework, projectOptions.language, rootNode.value],
  async () => {
    if (activeTab.value !== 'project') {
      return
    }

    isGeneratingProject.value = true
    // 保存当前选中的文件路径，用于切换后恢复
    const previousSelectedPath = selectedFilePath.value

    try {
      const { generateFromProject } = await import('@vela/generator')
      const result = generateFromProject(
        projectStore.project as ProjectSchema,
        buildGenerateOptions(projectOptions.framework, projectOptions.language),
      )

      projectFiles.value = withDiagnosticsFile(
        result.files.map((file) => ({ path: file.path, content: file.content })),
        result.diagnostics,
      )

      // 尝试恢复之前选中的文件，如果不存在则选中第一个文件
      const matchingFile = projectFiles.value.find((f) => f.path === previousSelectedPath)
      if (matchingFile) {
        selectedFilePath.value = matchingFile.path
      } else if (projectFiles.value.length > 0) {
        selectedFilePath.value = projectFiles.value[0].path
      } else {
        selectedFilePath.value = ''
      }
    } catch (error) {
      console.error('项目生成失败:', error)
      projectFiles.value = [
        {
          path: 'error.txt',
          content: `项目生成失败: ${error}`,
        },
      ]
      selectedFilePath.value = 'error.txt'
    } finally {
      isGeneratingProject.value = false
    }
  },
  { immediate: true },
)

const handleBack = () => {
  router.push('/editor')
}

const handleRefresh = () => {
  window.location.reload()
}

const copyJson = async () => {
  try {
    await navigator.clipboard.writeText(formattedJson.value)
    ElMessage.success('JSON 已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(generatedCode.value)
    ElMessage.success('代码已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}

const copyFileContent = async () => {
  if (!selectedFileContent.value) return
  try {
    await navigator.clipboard.writeText(selectedFileContent.value)
    ElMessage.success('文件内容已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}
</script>

<style scoped>
.preview-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #1a1d2e;
  color: #e5e9f0;
}

/* Header */
.preview-header {
  height: 56px;
  background: #252836;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
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
  background: rgba(255, 255, 255, 0.1);
}

.back-btn {
  color: #a0aec0;
}

.back-btn:hover {
  color: #409eff;
}

.page-name {
  font-size: 14px;
  font-weight: 600;
  color: #e5e9f0;
}

/* Tabs */
.tab-group {
  display: flex;
  gap: 4px;
  background: rgba(0, 0, 0, 0.2);
  padding: 4px;
  border-radius: 8px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: #a0aec0;
  font-size: 13px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #e5e9f0;
  background: rgba(255, 255, 255, 0.05);
}

.tab-btn.active {
  color: #fff;
  background: #409eff;
}

/* Main Content */
.preview-main {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.tab-content {
  height: 100%;
  overflow: hidden;
}

/* Preview Tab */
.preview-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  overflow: auto;
  background: #0f111a;
}

.preview-viewport-wrapper {
  max-width: 100%;
  max-height: 100%;
  overflow: auto;
}

.preview-viewport {
  position: relative;
  width: 1920px;
  height: 1080px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 14px;
  margin: 0;
}

/* Loading State */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px;
  color: #a0aec0;
}

.loading-state .el-icon {
  font-size: 20px;
}

/* JSON & Code Tabs */
.json-tab,
.code-tab {
  padding: 20px;
}

.panel-card {
  height: 100%;
  background: #252836;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
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
  color: #409eff;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #e5e9f0;
  margin: 0;
}

.panel-desc {
  margin: 2px 0 0;
  font-size: 13px;
  color: #718096;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.framework-toggle {
  margin-right: 8px;
}

.framework-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 700;
  margin-right: 4px;
}

.vue-icon {
  background: linear-gradient(135deg, #42b883 0%, #35495e 100%);
  color: #fff;
}

.react-icon {
  background: linear-gradient(135deg, #61dafb 0%, #20232a 100%);
  color: #fff;
}

/* 代码预览盒子 */
.code-preview-box {
  flex: 1;
  overflow: auto;
  background: #0d0f17;
  margin: 0;
  min-height: 0;
}

.code-preview-box pre {
  margin: 0;
  padding: 16px;
}

.code-preview-box code {
  font-family: 'Fira Code', 'JetBrains Mono', Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #e2e8f0;
  white-space: pre;
  display: block;
}

/* hljs 主题覆盖 */
.code-preview-box .hljs {
  background: transparent;
  padding: 0;
}

/* Project Tab */
.project-tab {
  padding: 20px;
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
  background: #0d0f17;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
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
  color: #a0aec0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.tree-scroll {
  flex: 1;
  padding: 8px;
}

.file-tree-panel :deep(.el-tree) {
  background: transparent;
  color: #e2e8f0;
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

.file-icon.file-tsx {
  color: #61dafb;
}

.file-icon.file-js {
  color: #f7df1e;
}

.file-icon.file-jsx {
  color: #61dafb;
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
  background: #0d0f17;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
  min-width: 0;
}

.code-viewer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #718096;
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
  color: #718096;
}

.code-empty p {
  margin: 0;
  font-size: 14px;
}
</style>
