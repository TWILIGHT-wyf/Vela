import { onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { useComponent } from '@/stores/component'
import type { NodeStyle } from '@vela/core'

export function useEditorShortcuts(
  options: {
    enableDelete?: boolean
    enableClipboard?: boolean
    enableSelectAll?: boolean
    enableNudge?: boolean
    nudgeStep?: number
    nudgeLargeStep?: number
    closeMenu?: () => void
  } = {},
) {
  const compStore = useComponent()
  const { rootNode, selectedId, selectedIds, selectedNodes } = storeToRefs(compStore)
  const {
    deleteComponent,
    deleteComponents,
    copySelectedNodes,
    cutSelectedNodes,
    pasteNodes,
    selectComponents,
    findParentNode,
    updateGeometry,
    updateStyle,
    clearSelection,
  } = compStore

  const isNodeFreeMovable = (node: NonNullable<(typeof selectedNodes.value)[number]>) => {
    if (node.geometry?.mode === 'free') return true
    const parent = findParentNode(node.id)
    return parent?.container?.mode === 'free'
  }

  const isNodeGridLayout = (node: NonNullable<(typeof selectedNodes.value)[number]>) => {
    const parent = findParentNode(node.id)
    return !parent || parent.container?.mode !== 'free'
  }

  const parseMarginNumber = (val: unknown): number => {
    if (typeof val === 'number' && Number.isFinite(val)) return val
    if (typeof val === 'string') {
      const num = Number.parseFloat(val)
      return Number.isFinite(num) ? num : 0
    }
    return 0
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    // Ignore if user is typing in an input
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return
    }

    const isMac = navigator.platform.toUpperCase().includes('MAC')
    const ctrlKey = isMac ? e.metaKey : e.ctrlKey

    // Delete - 删除选中组件
    if ((options.enableDelete ?? true) && (e.key === 'Delete' || e.key === 'Backspace')) {
      if (selectedIds.value.length > 1) {
        e.preventDefault()
        deleteComponents([...selectedIds.value])
      } else {
        const targetId = selectedId.value ?? selectedIds.value[0]
        if (targetId) {
          e.preventDefault()
          deleteComponent(targetId)
        }
      }
      return
    }

    // Ctrl+C - 复制
    if ((options.enableClipboard ?? true) && ctrlKey && e.key === 'c') {
      if (selectedId.value || selectedIds.value.length > 0) {
        e.preventDefault()
        copySelectedNodes()
      }
      return
    }

    // Ctrl+X - 剪切
    if ((options.enableClipboard ?? true) && ctrlKey && e.key === 'x') {
      if (selectedId.value || selectedIds.value.length > 0) {
        e.preventDefault()
        cutSelectedNodes()
      }
      return
    }

    // Ctrl+V - 粘贴
    if ((options.enableClipboard ?? true) && ctrlKey && e.key === 'v') {
      e.preventDefault()
      pasteNodes()
      return
    }

    // Ctrl+A - 全选 (选中所有顶层组件)
    if ((options.enableSelectAll ?? true) && ctrlKey && e.key === 'a') {
      if (rootNode.value?.children && rootNode.value.children.length > 0) {
        e.preventDefault()
        const allIds = rootNode.value.children.map((n) => n.id)
        selectComponents(allIds)
      }
      return
    }

    // Arrow Keys - 自由布局精确微调
    if ((options.enableNudge ?? true) && !ctrlKey && !e.altKey) {
      let dx = 0
      let dy = 0
      if (e.key === 'ArrowLeft') dx = -1
      if (e.key === 'ArrowRight') dx = 1
      if (e.key === 'ArrowUp') dy = -1
      if (e.key === 'ArrowDown') dy = 1

      if (dx !== 0 || dy !== 0) {
        // Free mode: nudge position
        const movableNodes = selectedNodes.value.filter((node) => isNodeFreeMovable(node))
        if (movableNodes.length > 0) {
          e.preventDefault()
          const step = e.shiftKey ? (options.nudgeLargeStep ?? 10) : (options.nudgeStep ?? 1)
          movableNodes.forEach((node) => {
            const geometry = node.geometry?.mode === 'free' ? node.geometry : undefined
            const nextX = Math.round(Number(geometry?.x ?? 0) + dx * step)
            const nextY = Math.round(Number(geometry?.y ?? 0) + dy * step)
            updateGeometry(node.id, {
              mode: 'free',
              x: nextX,
              y: nextY,
            })
          })
          return
        }

        // Grid mode: nudge margin
        const gridNodes = selectedNodes.value.filter((node) => isNodeGridLayout(node))
        if (gridNodes.length > 0) {
          e.preventDefault()
          const step = e.shiftKey ? (options.nudgeLargeStep ?? 10) : (options.nudgeStep ?? 1)
          gridNodes.forEach((node) => {
            const style = node.style || {}
            const patch: Partial<NodeStyle> = {}

            if (dy !== 0) {
              const currentMarginTop = parseMarginNumber(style.marginTop)
              patch.marginTop = Math.round(currentMarginTop + dy * step)
            }
            if (dx !== 0) {
              const currentMarginLeft = parseMarginNumber(style.marginLeft)
              patch.marginLeft = Math.round(currentMarginLeft + dx * step)
            }

            if (Object.keys(patch).length > 0) {
              updateStyle(node.id, patch)
            }
          })
          return
        }
        return
      }
    }

    // Escape - 取消选中 / 关闭菜单
    if (e.key === 'Escape') {
      if (options.closeMenu) {
        options.closeMenu()
      } else {
        clearSelection()
      }
      return
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })
}
