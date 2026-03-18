import { defineStore, storeToRefs } from 'pinia'
import { ref, computed } from 'vue'
import type { LayoutMode } from '@vela/core'
import { useComponent } from './component'
import { useProjectStore } from './project'
import { convertLayout } from '@/utils/layoutConverter'

/**
 * UI 状态管理 Store
 * 管理画布缩放、平移、面板显示等 UI 状态
 */
export const useUIStore = defineStore('ui', () => {
  type EditorCanvasMode = 'free' | 'grid'
  // ========== Canvas State ==========

  /**
   * 画布宽度
   */
  const canvasWidth = ref<number>(1920)

  /**
   * 画布高度
   */
  const canvasHeight = ref<number>(1080)

  /**
   * 画布缩放比例
   */
  const canvasScale = ref<number>(1)

  /**
   * 画布偏移量
   */
  const canvasOffset = ref({ x: 0, y: 0 })

  /**
   * 画布面积
   */
  const canvasArea = computed(() => canvasWidth.value * canvasHeight.value)

  /**
   * 画布配置
   */
  const canvasSettings = ref({
    backgroundColor: '#fafafa',
    gridColor: '#f0f0f0',
    gridMajorColor: '#e5e5e5',
    showGrid: true,
    showCanvasBounds: true,
    gridSize: 20,
    gridMajorSize: 100,
    backgroundImage: '',
  })

  // ========== Panel State ==========

  /**
   * 右侧面板激活的 Tab
   * - 'properties': 属性面板
   * - 'animation': 动画面板
   * - 'events': 事件面板
   */
  const rightPanelTab = ref<'properties' | 'animation' | 'events'>('properties')

  /**
   * 左侧面板是否折叠
   */
  const leftPanelCollapsed = ref<boolean>(false)

  /**
   * 右侧面板是否折叠
   */
  const rightPanelCollapsed = ref<boolean>(false)

  /**
   * 模拟运行模式
   * 在模拟运行模式下，组件可以交互，但不能编辑
   */
  const isSimulationMode = ref<boolean>(false)

  // ========== Derived State ==========

  const projectStore = useProjectStore()
  const componentStore = useComponent()
  const { currentPage } = storeToRefs(projectStore)
  const { rootNode } = storeToRefs(componentStore)

  /**
   * 画布模式（单一真源：rootNode.container.mode）
   * page.config.defaultLayoutMode 仅作为兜底值
   */
  const canvasMode = computed<EditorCanvasMode>(() => {
    const rootMode = rootNode.value?.container?.mode
    if (rootMode === 'free') {
      return 'free'
    }
    if (rootMode === 'flow' || rootMode === 'grid') {
      return 'grid'
    }

    const pageMode = currentPage.value?.config?.defaultLayoutMode
    if (pageMode === 'free') return 'free'
    return 'grid'
  })

  // ========== Actions ==========

  /**
   * 设置画布尺寸
   */
  function setCanvasSize(width: number, height: number) {
    canvasWidth.value = Math.max(1, Math.floor(width))
    canvasHeight.value = Math.max(1, Math.floor(height))
  }

  /**
   * 设置画布缩放
   */
  function setCanvasScale(scale: number, min = 0.2, max = 4) {
    canvasScale.value = Math.min(max, Math.max(min, scale))
  }

  /**
   * 设置画布偏移
   */
  function setCanvasOffset(x: number, y: number) {
    canvasOffset.value = { x, y }
  }

  /**
   * 更新画布配置
   */
  function updateCanvasSettings(config: Partial<typeof canvasSettings.value>) {
    Object.assign(canvasSettings.value, config)
  }

  /**
   * 设置右侧面板 Tab
   */
  function setRightPanelTab(tab: 'properties' | 'animation' | 'events') {
    rightPanelTab.value = tab
  }

  /**
   * 切换左侧面板折叠状态
   */
  function toggleLeftPanel() {
    leftPanelCollapsed.value = !leftPanelCollapsed.value
  }

  /**
   * 切换右侧面板折叠状态
   */
  function toggleRightPanel() {
    rightPanelCollapsed.value = !rightPanelCollapsed.value
  }

  /**
   * 设置画布模式
   */
  function setCanvasMode(mode: EditorCanvasMode | LayoutMode) {
    const normalizedMode: EditorCanvasMode = mode === 'free' ? 'free' : 'grid'
    const root = rootNode.value
    if (root && root.container?.mode !== normalizedMode) {
      const converted = convertLayout(root, normalizedMode)
      componentStore.setTree(converted)
      componentStore.syncToProjectStore()
    }
    if (currentPage.value?.config?.defaultLayoutMode !== normalizedMode) {
      projectStore.updatePageConfig({ defaultLayoutMode: normalizedMode })
    }
  }

  /**
   * 切换画布模式
   */
  function toggleCanvasMode() {
    setCanvasMode(canvasMode.value === 'free' ? 'grid' : 'free')
  }

  /**
   * 切换模拟运行模式
   */
  function toggleSimulationMode() {
    isSimulationMode.value = !isSimulationMode.value
  }

  /**
   * 设置模拟运行模式
   */
  function setSimulationMode(mode: boolean) {
    isSimulationMode.value = mode
  }

  /**
   * Zoom to fit the canvas within the viewport
   * @param viewportWidth - Viewport width in pixels
   * @param viewportHeight - Viewport height in pixels
   */
  function zoomToFit(viewportWidth: number, viewportHeight: number) {
    const cw = canvasWidth.value
    const ch = canvasHeight.value
    if (cw <= 0 || ch <= 0 || viewportWidth <= 0 || viewportHeight <= 0) return

    const fitScale = Math.min(viewportWidth / cw, viewportHeight / ch) * 0.9
    setCanvasScale(fitScale)
  }

  return {
    // Canvas State
    canvasWidth,
    canvasHeight,
    canvasScale,
    canvasOffset,
    canvasArea,
    canvasSettings,
    canvasMode,
    isSimulationMode,

    // Panel State
    rightPanelTab,
    leftPanelCollapsed,
    rightPanelCollapsed,

    // Actions
    setCanvasSize,
    setCanvasScale,
    setCanvasOffset,
    updateCanvasSettings,
    setRightPanelTab,
    toggleLeftPanel,
    toggleRightPanel,
    setCanvasMode,
    toggleCanvasMode,
    toggleSimulationMode,
    setSimulationMode,
    zoomToFit,
  }
})
