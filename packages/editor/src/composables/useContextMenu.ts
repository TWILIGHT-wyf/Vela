import { ref } from 'vue'

export interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  targetId?: string
  // 额外数据，如 stage 坐标
  [key: string]: any
}

export function useContextMenu() {
  const menuState = ref<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    targetId: undefined,
  })

  function openContextMenu(e: MouseEvent, targetId?: string, extraData: Record<string, any> = {}) {
    e.preventDefault()
    e.stopPropagation()

    menuState.value = {
      visible: true,
      x: e.clientX,
      y: e.clientY,
      targetId,
      ...extraData,
    }
  }

  function closeContextMenu() {
    if (menuState.value.visible) {
      menuState.value.visible = false
    }
  }

  return {
    menuState,
    openContextMenu,
    closeContextMenu,
  }
}
