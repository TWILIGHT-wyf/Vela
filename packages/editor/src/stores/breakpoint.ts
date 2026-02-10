import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useProjectStore } from './project'

export interface BreakpointDef {
  name: string
  width: number
}

const DEFAULT_BREAKPOINTS: Record<string, number> = {
  desktop: 1920,
  tablet: 1024,
  mobile: 393,
}

export const useBreakpointStore = defineStore('breakpoint', () => {
  const projectStore = useProjectStore()

  /** Active breakpoint name (null = default/desktop, no override) */
  const activeBreakpoint = ref<string | null>(null)

  /** Breakpoint definitions: name -> width threshold */
  const breakpoints = ref<Record<string, number>>({ ...DEFAULT_BREAKPOINTS })

  /** Whether responsive mode is enabled */
  const responsiveEnabled = ref(false)

  /** Sorted breakpoints (descending by width) */
  const sortedBreakpoints = computed<BreakpointDef[]>(() => {
    return Object.entries(breakpoints.value)
      .map(([name, width]) => ({ name, width }))
      .sort((a, b) => b.width - a.width)
  })

  function setActiveBreakpoint(name: string | null) {
    activeBreakpoint.value = name
  }

  function addBreakpoint(name: string, width: number) {
    if (!name || width <= 0) return
    breakpoints.value = {
      ...breakpoints.value,
      [name]: width,
    }
    syncToProject()
  }

  function removeBreakpoint(name: string) {
    const next = { ...breakpoints.value }
    delete next[name]
    breakpoints.value = next

    if (activeBreakpoint.value === name) {
      activeBreakpoint.value = null
    }
    syncToProject()
  }

  function updateBreakpoint(name: string, width: number) {
    if (!(name in breakpoints.value)) return
    breakpoints.value = {
      ...breakpoints.value,
      [name]: width,
    }
    syncToProject()
  }

  function setResponsiveEnabled(enabled: boolean) {
    responsiveEnabled.value = enabled
    if (!enabled) {
      activeBreakpoint.value = null
    }
  }

  function syncToProject() {
    projectStore.updatePageConfig({
      breakpoints: { ...breakpoints.value },
    })
  }

  /** Load breakpoints from project config */
  function loadFromProject() {
    const config = projectStore.currentPage?.config
    if (config?.breakpoints && Object.keys(config.breakpoints).length > 0) {
      breakpoints.value = { ...config.breakpoints }
      responsiveEnabled.value = true
    }
  }

  return {
    activeBreakpoint,
    breakpoints,
    responsiveEnabled,
    sortedBreakpoints,
    setActiveBreakpoint,
    addBreakpoint,
    removeBreakpoint,
    updateBreakpoint,
    setResponsiveEnabled,
    loadFromProject,
  }
})
