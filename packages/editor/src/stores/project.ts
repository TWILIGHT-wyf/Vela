import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { nanoid } from 'nanoid'
import type {
  ProjectSchema,
  PageSchema,
  NodeSchema,
  PageConfig,
  PageType,
  DialogPage,
} from '@vela/core'
import { countTracks, createDialogPage, createFragmentPage, createRoutePage } from '@vela/core'
import type { ApiSchema, VariableSchema } from '@vela/core/types/data'

const STORAGE_KEY = 'vela_project'
export type SaveStatus = 'saved' | 'saving' | 'unsaved'

const DEFAULT_GRID_COL_COUNT = 12
const DEFAULT_GRID_GAP = 8
const DEFAULT_GRID_AUTO_FIT_MIN_WIDTH = 280

function buildDefaultColumnTracks() {
  return Array.from({ length: DEFAULT_GRID_COL_COUNT }, () => ({ unit: 'fr' as const, value: 1 }))
}

function buildDefaultColumnsTemplate() {
  return Array(DEFAULT_GRID_COL_COUNT).fill('1fr').join(' ')
}

function toAutoFitColumns(minWidth: number): string {
  const safeMinWidth = Math.max(120, Math.round(minWidth))
  return `repeat(auto-fit, minmax(${safeMinWidth}px, 1fr))`
}

function createGridContainer(container?: NodeSchema['container']): NodeSchema['container'] {
  const toTracks = (template: string) =>
    template
      .trim()
      .split(/\s+/)
      .map((token) => {
        const match = token.match(/^([\d.]+)fr$/)
        return { unit: 'fr' as const, value: Number.parseFloat(match?.[1] || '1') || 1 }
      })

  if (container?.mode === 'grid') {
    const templateMode =
      container.templateMode ||
      (typeof container.columns === 'string' && container.columns.includes('repeat(auto-fit')
        ? 'autoFit'
        : 'manual')
    const autoFitMinWidth = Math.max(
      120,
      Number(container.autoFitMinWidth ?? DEFAULT_GRID_AUTO_FIT_MIN_WIDTH),
    )
    const columns =
      templateMode === 'autoFit'
        ? toAutoFitColumns(autoFitMinWidth)
        : container.columns || buildDefaultColumnsTemplate()
    const rows = templateMode === 'autoFit' ? 'auto' : container.rows || '1fr'
    const gap = container.gap ?? DEFAULT_GRID_GAP
    return {
      ...container,
      mode: 'grid',
      templateMode,
      autoFitMinWidth,
      autoFitDense: container.autoFitDense ?? true,
      columns,
      rows,
      gap,
      columnTracks:
        Array.isArray(container.columnTracks) && container.columnTracks.length > 0
          ? container.columnTracks
          : templateMode === 'autoFit'
            ? buildDefaultColumnTracks()
            : toTracks(columns),
      rowTracks:
        templateMode === 'autoFit'
          ? 'auto'
          : container.rowTracks === 'auto'
            ? 'auto'
            : container.rowTracks || toTracks(rows),
      gapX: container.gapX ?? gap,
      gapY: container.gapY ?? gap,
      autoFlow: container.autoFlow || 'row',
      dense: container.dense ?? true,
      autoRowsMin: container.autoRowsMin ?? 24,
    }
  }
  return {
    mode: 'grid',
    templateMode: 'autoFit',
    autoFitMinWidth: DEFAULT_GRID_AUTO_FIT_MIN_WIDTH,
    autoFitDense: true,
    columns: toAutoFitColumns(DEFAULT_GRID_AUTO_FIT_MIN_WIDTH),
    rows: 'auto',
    gap: DEFAULT_GRID_GAP,
    columnTracks: buildDefaultColumnTracks(),
    rowTracks: 'auto',
    gapX: DEFAULT_GRID_GAP,
    gapY: DEFAULT_GRID_GAP,
    autoFlow: 'row',
    dense: true,
    autoRowsMin: 24,
  }
}

function ensureEditableRootGridContainer(
  container: NodeSchema['container'],
  childCount: number,
): NodeSchema['container'] {
  if (container?.mode !== 'grid') return container
  if (container.templateMode === 'autoFit') return container

  const columnCount = Math.max(1, countTracks(container.columns || '1fr'))
  const normalizedColumns = String(container.columns || '').trim()
  const normalizedRows = String(container.rows || '').trim()
  const isLegacySingleColumnPreset =
    normalizedColumns === '1fr' &&
    (normalizedRows.length === 0 || normalizedRows === '1fr') &&
    (container.gap === undefined || Number(container.gap) === DEFAULT_GRID_GAP)

  if (columnCount > 1) return container
  if (childCount > 0 && !isLegacySingleColumnPreset) return container

  return {
    ...container,
    templateMode: 'manual',
    columns: buildDefaultColumnsTemplate(),
    columnTracks: buildDefaultColumnTracks(),
    rows: container.rows || '1fr',
    rowTracks: container.rowTracks === 'auto' ? 'auto' : container.rowTracks,
    gap: container.gap ?? DEFAULT_GRID_GAP,
    gapX: container.gapX ?? container.gap ?? DEFAULT_GRID_GAP,
    gapY: container.gapY ?? container.gap ?? DEFAULT_GRID_GAP,
  }
}

type ManagedPageType = Extract<PageType, 'page' | 'dialog' | 'fragment'>

interface AddPageOptions {
  type?: ManagedPageType
  path?: string
}

function toRoutePath(name: string, path?: string): string {
  const trimmed = path?.trim()
  if (trimmed) {
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  }

  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `/${slug || 'page'}`
}

function enrichPageDefaults(page: PageSchema): PageSchema {
  page.config = {
    defaultLayoutMode: 'grid',
    ...(page.config || {}),
  }
  page.state = page.state || []
  page.apis = page.apis || []

  if (page.children) {
    page.children.props = page.children.props || {}
    page.children.style = {
      width: '100%',
      height: '100%',
      position: 'relative',
      ...(page.children.style || {}),
    }
    page.children.container = createGridContainer(page.children.container)
  }

  return page
}

function createManagedPage(name: string, options: AddPageOptions = {}): PageSchema {
  const pageId = nanoid()
  const type = options.type || 'page'

  switch (type) {
    case 'dialog':
      return enrichPageDefaults(createDialogPage(pageId, name))
    case 'fragment':
      return enrichPageDefaults(createFragmentPage(pageId, name))
    case 'page':
    default:
      return enrichPageDefaults(createRoutePage(pageId, toRoutePath(name, options.path), name))
  }
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
      if (!page.config) page.config = {}
      if (page.children) {
        const normalizedContainer: NodeSchema['container'] = createGridContainer(
          page.children.container,
        )
        page.children.container = ensureEditableRootGridContainer(
          normalizedContainer,
          Array.isArray(page.children.children) ? page.children.children.length : 0,
        )
      }
    }
  }

  function createDefaultProject() {
    const defaultPage = createManagedPage('Home', {
      type: 'page',
      path: '/',
    })

    if (defaultPage.children) {
      defaultPage.children.id = 'root'
      defaultPage.children.style = {
        ...(defaultPage.children.style || {}),
        backgroundColor: '#ffffff',
      }
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
    currentPageId.value = defaultPage.id
  }

  function addPage(name: string, options: AddPageOptions = {}) {
    const newPage = createManagedPage(name, options)
    project.value.pages.push(newPage)
    currentPageId.value = newPage.id
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

  function updateCurrentPageMeta(meta: {
    name?: string
    title?: string
    description?: string
  }) {
    if (!currentPage.value) return

    if (meta.name !== undefined) {
      currentPage.value.name = meta.name
    }
    if (meta.title !== undefined) {
      currentPage.value.title = meta.title
    }
    if (meta.description !== undefined) {
      currentPage.value.description = meta.description
    }

    saveStatus.value = 'unsaved'
  }

  function updateCurrentPagePath(path: string) {
    if (!currentPage.value || currentPage.value.type !== 'page') return
    currentPage.value.path = path.startsWith('/') ? path : `/${path}`
    saveStatus.value = 'unsaved'
  }

  function updateCurrentPageRuntime(runtime: Partial<NonNullable<PageConfig['runtime']>>) {
    if (!currentPage.value) return
    if (!currentPage.value.config) {
      currentPage.value.config = {}
    }
    currentPage.value.config.runtime = {
      ...(currentPage.value.config.runtime || {}),
      ...runtime,
    }
    saveStatus.value = 'unsaved'
  }

  function updateCurrentPageState(state: VariableSchema[]) {
    if (!currentPage.value) return
    currentPage.value.state = state
    saveStatus.value = 'unsaved'
  }

  function updateCurrentPageApis(apis: ApiSchema[]) {
    if (!currentPage.value) return
    currentPage.value.apis = apis
    saveStatus.value = 'unsaved'
  }

  function updateCurrentDialogConfig(config: Partial<NonNullable<DialogPage['dialogConfig']>>) {
    if (!currentPage.value || currentPage.value.type !== 'dialog') return
    currentPage.value.dialogConfig = {
      ...(currentPage.value.dialogConfig || {}),
      ...config,
    }
    saveStatus.value = 'unsaved'
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
    updateCurrentPageMeta,
    updateCurrentPagePath,
    updateCurrentPageRuntime,
    updateCurrentPageState,
    updateCurrentPageApis,
    updateCurrentDialogConfig,
  }
})
