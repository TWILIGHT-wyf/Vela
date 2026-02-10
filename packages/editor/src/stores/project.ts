import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { nanoid } from 'nanoid'
import type { ProjectSchema, PageSchema, NodeSchema, PageConfig } from '@vela/core'

const STORAGE_KEY = 'vela_project'

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

  const currentPage = computed(() => {
    return project.value.pages.find((p) => p.id === currentPageId.value)
  })

  // Save Status
  const saveStatus = ref<'saved' | 'saving' | 'unsaved'>('saved')
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
    currentPage,
    saveStatus,
    lastSavedTime,
    initProject,
    addPage,
    saveProject,
    updatePageConfig,
    changePageLayout,
  }
})
