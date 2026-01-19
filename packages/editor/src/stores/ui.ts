import { defineStore, storeToRefs } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useProjectStore } from './project'

/**
 * UI 状态管理 Store
 * 管理画布缩放、平移、面板显示等 UI 状态
 */
export const useUIStore = defineStore('ui', () => {
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
   * 画布模式
   * - 'free': 自由画布模式 (绝对定位，支持 Snap/Shape/ContextMenu)
   * - 'flow': 流式画布模式 (文档流)
   */
  const canvasMode = ref<'free' | 'flow'>('free')

  /**
   * 模拟运行模式
   * 在模拟运行模式下，组件可以交互，但不能编辑
   */
  const isSimulationMode = ref<boolean>(false)

  // ========== Watchers ==========

  /**
   * 监听页面切换，同步布局模式
   * 当用户切换到不同页面时，画布模式应该跟随该页面的配置
   */
  const projectStore = useProjectStore()
  const { currentPageLayout } = storeToRefs(projectStore)

  watch(
    currentPageLayout,
    (newLayout) => {
      if (newLayout && newLayout !== canvasMode.value) {
        canvasMode.value = newLayout
        console.log(`[UIStore] Synced canvasMode to page layout: ${newLayout}`)
      }
    },
    { immediate: true },
  )

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
  function setCanvasMode(mode: 'free' | 'flow') {
    canvasMode.value = mode
  }

  /**
   * 切换画布模式
   */
  function toggleCanvasMode() {
    canvasMode.value = canvasMode.value === 'free' ? 'flow' : 'free'
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
  }
})
