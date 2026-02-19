import { reactive, computed, type Ref } from 'vue'
import type { NodeSchema } from '@vela/core'
import { inspector } from './inspector'
import { logger } from './logger'
import { performanceMonitor } from './performance'

/**
 * DevTools 面板标签页
 */
export type DevToolsTab = 'inspector' | 'console' | 'performance' | 'network'

/**
 * DevTools 面板状态
 */
export interface DevToolsPanelState {
  visible: boolean
  activeTab: DevToolsTab
  position: 'bottom' | 'right' | 'floating'
  size: number // height for bottom, width for right
  minimized: boolean
}

/**
 * 创建 DevTools 面板
 */
export function createDevToolsPanel() {
  const state = reactive<DevToolsPanelState>({
    visible: false,
    activeTab: 'inspector',
    position: 'bottom',
    size: 300,
    minimized: false,
  })

  /**
   * 打开 DevTools
   */
  function open(tab?: DevToolsTab) {
    state.visible = true
    state.minimized = false
    if (tab) {
      state.activeTab = tab
    }

    // 启用对应功能
    if (state.activeTab === 'inspector') {
      inspector.enable()
    } else if (state.activeTab === 'performance') {
      performanceMonitor.enable()
    }

    console.log('[DevTools] Panel opened')
  }

  /**
   * 关闭 DevTools
   */
  function close() {
    state.visible = false
    inspector.disable()
    performanceMonitor.disable()
    console.log('[DevTools] Panel closed')
  }

  /**
   * 切换 DevTools
   */
  function toggle() {
    if (state.visible) {
      close()
    } else {
      open()
    }
  }

  /**
   * 最小化/恢复
   */
  function toggleMinimize() {
    state.minimized = !state.minimized
  }

  /**
   * 切换标签页
   */
  function switchTab(tab: DevToolsTab) {
    state.activeTab = tab

    // 启用/禁用对应功能
    if (tab === 'inspector') {
      inspector.enable()
    } else {
      inspector.disable()
    }

    if (tab === 'performance') {
      performanceMonitor.enable()
    } else {
      performanceMonitor.disable()
    }
  }

  /**
   * 设置位置
   */
  function setPosition(position: DevToolsPanelState['position']) {
    state.position = position
  }

  /**
   * 设置大小
   */
  function setSize(size: number) {
    state.size = Math.max(200, Math.min(size, 600))
  }

  /**
   * 初始化根节点
   */
  function initWithRoot(root: Ref<NodeSchema | null>) {
    inspector.init(root)
  }

  // ========== Inspector 相关 ==========

  const inspectorState = inspector.state
  const selectedInfo = inspector.selectedInfo

  function selectComponent(id: string | null) {
    inspector.selectNode(id)
  }

  function getTreeStructure() {
    return inspector.getTreeStructure()
  }

  function searchComponents(query: string) {
    return inspector.searchNodes(query)
  }

  // ========== Console 相关 ==========

  const logEntries = computed(() => logger.getFilteredEntries())
  const logFilter = logger.filter

  function clearLogs() {
    logger.clear()
  }

  function pauseLogs() {
    logger.paused.value = !logger.paused.value
  }

  // ========== Performance 相关 ==========

  const perfMetrics = performanceMonitor.metrics

  function getSlowComponents() {
    return performanceMonitor.getSlowComponents()
  }

  function getHotComponents() {
    return performanceMonitor.getHotComponents()
  }

  function getPerformanceTimeline() {
    return performanceMonitor.getTimeline()
  }

  function clearPerformance() {
    performanceMonitor.clear()
  }

  // ========== 导出功能 ==========

  function exportAll(): string {
    return JSON.stringify(
      {
        tree: inspector.exportTree(),
        logs: logger.exportLogs(),
        performance: performanceMonitor.exportData(),
        timestamp: new Date().toISOString(),
      },
      null,
      2,
    )
  }

  // ========== 键盘快捷键 ==========

  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + Shift + D: 切换 DevTools
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault()
        toggle()
      }

      // Escape: 关闭 DevTools
      if (e.key === 'Escape' && state.visible) {
        close()
      }
    })
  }

  return {
    state,
    open,
    close,
    toggle,
    toggleMinimize,
    switchTab,
    setPosition,
    setSize,
    initWithRoot,

    // Inspector
    inspectorState,
    selectedInfo,
    selectComponent,
    getTreeStructure,
    searchComponents,

    // Console
    logEntries,
    logFilter,
    clearLogs,
    pauseLogs,

    // Performance
    perfMetrics,
    getSlowComponents,
    getHotComponents,
    getPerformanceTimeline,
    clearPerformance,

    // Utils
    exportAll,
    setupKeyboardShortcuts,
  }
}

/**
 * 全局 DevTools 面板实例
 */
export const devToolsPanel = createDevToolsPanel()

function isDevMode(): boolean {
  const meta = import.meta as ImportMeta & { env?: { DEV?: boolean } }
  return Boolean(meta.env?.DEV)
}

/**
 * 初始化 DevTools（在应用入口调用）
 */
export function initDevTools(root: Ref<NodeSchema | null>) {
  devToolsPanel.initWithRoot(root)
  devToolsPanel.setupKeyboardShortcuts()

  // 开发环境自动启用日志
  if (isDevMode()) {
    logger.enabled.value = true
  }

  console.log('[DevTools] Initialized. Press Ctrl+Shift+D to open.')
}
