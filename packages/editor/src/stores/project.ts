import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { nanoid } from 'nanoid'
import type { ProjectSchema, PageSchema, NodeSchema, PageConfig } from '@vela/core'

const STORAGE_KEY = 'vela_project'

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
      if (!page.config) page.config = { defaultLayoutMode: 'flow' }
      if (page.config.defaultLayoutMode !== 'flow' && page.config.defaultLayoutMode !== 'free') {
        page.config.defaultLayoutMode = 'flow'
      }
      if (page.children) {
        page.children.container = {
          mode: page.config.defaultLayoutMode,
        }
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
        defaultLayoutMode: 'flow',
      },
      state: [],
      apis: [],
      children: {
        id: 'root',
        component: 'Page',
        container: { mode: 'flow' },
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
        defaultLayoutMode: 'flow',
      },
      state: [],
      apis: [],
      children: {
        id: `root_${pageId}`,
        component: 'Page',
        container: { mode: 'flow' },
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
    if (currentPage.value && currentPage.value.config) {
      Object.assign(currentPage.value.config, config)
      if (config.defaultLayoutMode !== undefined && currentPage.value.children) {
        currentPage.value.children.container = {
          mode: config.defaultLayoutMode,
        }
      }
    }
  }

  function changePageLayout(pageId: string, layout: 'free' | 'flow'): boolean {
    const page = project.value.pages.find((p) => p.id === pageId)
    if (page && page.config) {
      page.config.defaultLayoutMode = layout
      if (page.children) {
        page.children.container = { mode: layout }
      }
      return true
    }
    return false
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
