import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { nanoid } from 'nanoid'
import type { ProjectSchema, PageSchema, NodeSchema } from '@vela/core'

const STORAGE_KEY = 'vela_project'

export const useProjectStore = defineStore('project', () => {
  // State
  const project = ref<ProjectSchema>({
    version: '1.0.0',
    name: 'Untitled Project',
    description: 'Created with Vela Editor',
    config: {
      layout: 'pc',
      theme: 'light',
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

  function normalizePageLayouts() {
    if (!Array.isArray(project.value.pages)) return
    for (const page of project.value.pages) {
      if (!page.config) page.config = { layout: 'flow' }
      if (page.config.layout !== 'flow' && page.config.layout !== 'free') {
        page.config.layout = 'flow'
      }
      if (page.children) {
        page.children.layoutMode = page.config.layout
      }
    }
  }

  function createDefaultProject() {
    const pageId = nanoid()
    const defaultPage: PageSchema = {
      id: pageId,
      name: 'Home',
      path: '/',
      config: {
        layout: 'flow',
      },
      state: [],
      apis: [],
      children: {
        id: 'root',
        componentName: 'Page', // Using 'Page' as root container
        layoutMode: 'flow',
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
      version: '1.0.0',
      name: 'My Awesome Dashboard',
      config: {
        layout: 'pc',
        theme: 'light',
      },
      pages: [defaultPage],
    }
    currentPageId.value = pageId
  }

  function addPage(name: string) {
    const pageId = nanoid()
    const newPage: PageSchema = {
      id: pageId,
      name,
      path: `/${name.toLowerCase()}`,
      config: {
        layout: 'flow',
      },
      state: [],
      apis: [],
      children: {
        id: `root_${pageId}`,
        componentName: 'Page',
        layoutMode: 'flow',
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

  function updatePageConfig(config: Partial<PageSchema['config']>) {
    if (currentPage.value && currentPage.value.config) {
      Object.assign(currentPage.value.config, config)
      if (config.layout && currentPage.value.children) {
        currentPage.value.children.layoutMode = config.layout
      }
    }
  }

  function changePageLayout(pageId: string, layout: 'free' | 'flow'): boolean {
    const page = project.value.pages.find((p) => p.id === pageId)
    if (page && page.config) {
      page.config.layout = layout
      if (page.children) {
        page.children.layoutMode = layout
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
