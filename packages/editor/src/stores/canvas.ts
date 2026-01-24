import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type EditorMode = 'edit' | 'preview'
export type LayoutMode = 'free' | 'flow'

export const useCanvasStore = defineStore('canvas', () => {
  // --- State ---

  // 视图状态
  const scale = ref(1.0)
  const offsetX = ref(0)
  const offsetY = ref(0)

  // 交互状态
  const isPanning = ref(false) // 是否正在平移画布
  const isSpacePressed = ref(false) // 是否按下了空格键

  // 编辑器模式
  const mode = ref<EditorMode>('edit')
  const layoutMode = ref<LayoutMode>('free')

  // --- Getters ---

  const cursorStyle = computed(() => {
    if (isPanning.value) return 'grabbing'
    if (isSpacePressed.value) return 'grab'
    return 'default'
  })

  // --- Actions ---

  /**
   * 设置缩放比例
   * @param val 新的缩放比例
   * @param center 缩放中心点（可选，相对于视口的坐标）
   */
  function setScale(val: number, center?: { x: number; y: number }) {
    // 限制缩放范围 10% ~ 500%
    const newScale = Math.max(0.1, Math.min(val, 5.0))

    // 如果有缩放中心，需要调整 offset 以保持中心点不动
    // 公式: (MouseWorld - Offset) * OldScale = MouseScreen
    // 简化逻辑：暂不实现定点缩放，先实现中心缩放
    scale.value = newScale
  }

  function zoomIn() {
    setScale(scale.value + 0.1)
  }

  function zoomOut() {
    setScale(scale.value - 0.1)
  }

  function resetView() {
    scale.value = 1.0
    offsetX.value = 0
    offsetY.value = 0
  }

  function setOffset(x: number, y: number) {
    offsetX.value = x
    offsetY.value = y
  }

  function pan(dx: number, dy: number) {
    offsetX.value += dx
    offsetY.value += dy
  }

  return {
    scale,
    offsetX,
    offsetY,
    isPanning,
    isSpacePressed,
    mode,
    layoutMode,
    cursorStyle,

    setScale,
    zoomIn,
    zoomOut,
    resetView,
    setOffset,
    pan,
  }
})
