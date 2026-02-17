import { defineStore } from 'pinia'
import { ref, computed, watch, onUnmounted } from 'vue'
import { nanoid } from 'nanoid'
import type { ProjectSchema, PageSchema, NodeSchema, PageConfig } from '@vela/core'

const STORAGE_KEY = 'vela_project'
export type SaveStatus = 'saved' | 'saving' | 'unsaved'

function createGridContainer(container?: NodeSchema['container']): NodeSchema['container'] {
  if (container?.mode === 'grid') {
    return {
      ...container,
      mode: 'grid',
      columns: container.columns || '1fr',
      rows: container.rows || '1fr',
    }
  }
  return {
    mode: 'grid',
    columns: '1fr',
    rows: '1fr',
  }
}

function normalizeLayoutMode(mode: PageConfig['defaultLayoutMode']): 'free' | 'grid' {
  return mode === 'free' ? 'free' : 'grid'
}

export const useProjectStore = defineStore('project', () => {
  // State
  const project = ref<ProjectSchema>({
    id: `proj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    version: '2.0.0',
    name: 'Untitled Project',
    description: 'Created with Vela Editor',
    config: {
      target: 'pc',
    },
    pages: [],
  })

  // Getters
  const currentPageId = ref<string>('')
  const activePageId = computed(() => currentPageId.value)

  const currentPage = computed(() => {
    return project.value.pages.find((p) => p.id === currentPageId.value)
  })

  // Save Status
  const saveStatus = ref<SaveStatus>('saved')
  const lastSavedTime = ref<number | null>(null)

  // Actions
  function initProject(schema?: ProjectSchema) {
    if (schema) {
      project.value = schema
      normalizePageLayouts()
      if (project.value.pages.length > 0) {
        currentPageId.value = project.value.pages[0].id
      }
      return
    }

    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        project.value = JSON.parse(saved)
        normalizePageLayouts()
        if (project.value.pages.length > 0) {
          currentPageId.value = project.value.pages[0].id
        }
      } catch (e) {
        console.error('Failed to load project', e)
        createDefaultProject()
      }
    } else {
      createDefaultProject()
    }
  }

  /**
   * 规范化页面布局配置
   * 确保每个页面和根节点都有正确的布局模式
   */
  function normalizePageLayouts() {
    if (!Array.isArray(project.value.pages)) return
    for (const page of project.value.pages) {
      if (!page.config) page.config = { defaultLayoutMode: 'grid' }
      page.config.defaultLayoutMode = normalizeLayoutMode(page.config.defaultLayoutMode)
      if (page.children) {
        page.children.container =
          page.config.defaultLayoutMode === 'free'
            ? { mode: 'free' }
            : createGridContainer(page.children.container)
      }
    }
  }

  function createDefaultProject() {
    const pageId = nanoid()
    const defaultPage: PageSchema = {
      id: pageId,
      type: 'page',
      name: 'Home',
      path: '/',
      config: {
        defaultLayoutMode: 'grid',
      },
      state: [],
      apis: [],
      children: {
        id: 'root',
        component: 'Page',
        container: createGridContainer(),
        props: {},
        style: {
          width: '100%',
          height: '100%',
          position: 'relative',
          backgroundColor: '#ffffff',
        },
        children: [],
      },
    }

    project.value = {
      id: `proj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      version: '2.0.0',
      name: 'My Awesome Dashboard',
      config: {
        target: 'pc',
      },
      pages: [defaultPage],
    }
    currentPageId.value = pageId
  }

  function addPage(name: string) {
    const pageId = nanoid()
    const newPage: PageSchema = {
      id: pageId,
      type: 'page',
      name,
      path: `/${name.toLowerCase()}`,
      config: {
        defaultLayoutMode: 'grid',
      },
      state: [],
      apis: [],
      children: {
        id: `root_${pageId}`,
        component: 'Page',
        container: createGridContainer(),
        props: {},
        style: {
          width: '100%',
          height: '100%',
          position: 'relative',
        },
        children: [],
      },
    }
    project.value.pages.push(newPage)
    currentPageId.value = pageId
    saveStatus.value = 'unsaved'
  }

  function switchPage(pageId: string) {
    if (project.value.pages.some((page) => page.id === pageId)) {
      currentPageId.value = pageId
    }
  }

  function deletePage(pageId: string) {
    const index = project.value.pages.findIndex((page) => page.id === pageId)
    if (index === -1) return

    project.value.pages.splice(index, 1)

    if (project.value.pages.length === 0) {
      createDefaultProject()
      return
    }

    if (currentPageId.value === pageId) {
      const next = project.value.pages[Math.min(index, project.value.pages.length - 1)]
      currentPageId.value = next.id
    }

    saveStatus.value = 'unsaved'
  }

  function renamePage(pageId: string, name: string, route?: string) {
    const page = project.value.pages.find((item) => item.id === pageId)
    if (!page) return

    page.name = name
    if (page.type === 'page' && route && route.trim()) {
      page.path = route.startsWith('/') ? route : `/${route}`
    }

    saveStatus.value = 'unsaved'
  }

  async function saveProject() {
    saveStatus.value = 'saving'
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project.value))
      // 模拟保存延迟
      await new Promise((resolve) => setTimeout(resolve, 300))
      saveStatus.value = 'saved'
      lastSavedTime.value = Date.now()
    } catch (e) {
      console.error('Save failed', e)
      saveStatus.value = 'unsaved'
    }
  }

  // ========== 自动保存 ==========

  const AUTO_SAVE_DELAY = 1500 // ms
  const MAX_RETRY = 3
  let autoSaveTimer: ReturnType<typeof setTimeout> | null = null
  let retryCount = 0

  /**
   * 触发自动保存（防抖 1.5s）
   * 在每次 saveStatus 变为 'unsaved' 时自动调度
   */
  function scheduleAutoSave() {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
    }
    autoSaveTimer = setTimeout(async () => {
      autoSaveTimer = null
      if (saveStatus.value !== 'unsaved') return
      try {
        await saveProject()
        retryCount = 0
      } catch {
        retryCount++
        if (retryCount < MAX_RETRY) {
          // 3s 后重试
          autoSaveTimer = setTimeout(scheduleAutoSave, 3000)
        } else {
          console.error('[AutoSave] Max retries reached, stopping auto-save')
          retryCount = 0
        }
      }
    }, AUTO_SAVE_DELAY)
  }

  // 监听 saveStatus 变化，自动触发保存
  watch(saveStatus, (status) => {
    if (status === 'unsaved') {
      scheduleAutoSave()
    }
  })

  // 页面关闭前提示未保存
  function handleBeforeUnload(e: BeforeUnloadEvent) {
    if (saveStatus.value === 'unsaved') {
      e.preventDefault()
      e.returnValue = '您有未保存的更改，确定要离开吗？'
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', handleBeforeUnload)
  }

  function updatePageConfig(config: Partial<PageConfig>) {
    if (!currentPage.value) return
    if (!currentPage.value.config) {
      currentPage.value.config = {}
    }
    Object.assign(currentPage.value.config, config)
    saveStatus.value = 'unsaved'
  }

  function changePageLayout(pageId: string, layout: 'free' | 'grid'): boolean {
    const page = project.value.pages.find((p) => p.id === pageId)
    if (!page) return false

    if (!page.config) {
      page.config = {}
    }
    const normalizedLayout = normalizeLayoutMode(layout)
    page.config.defaultLayoutMode = normalizedLayout
    if (page.children) {
      page.children.container =
        normalizedLayout === 'free'
          ? { mode: 'free' }
          : createGridContainer(page.children.container)
    }
    saveStatus.value = 'unsaved'
    return true
  }

  return {
    project,
    currentPageId,
    activePageId,
    currentPage,
    saveStatus,
    lastSavedTime,
    initProject,
    addPage,
    switchPage,
    deletePage,
    renamePage,
    saveProject,
    updatePageConfig,
    changePageLayout,
  }
})
