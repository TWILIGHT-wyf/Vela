import { onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { countTracks, type GridNodeGeometry } from '@vela/core'
import { useComponent } from '@/stores/component'
import { nodeToPlacement } from '@/utils/gridPlacement'

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)))
}

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
    getParentId,
    updateGeometry,
    selectComponent,
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

  const resolveGridColumnCount = (node: NonNullable<(typeof selectedNodes.value)[number]>) => {
    const parent = findParentNode(node.id)
    if (!parent || parent.container?.mode !== 'grid') return 12
    if (Array.isArray(parent.container.columnTracks) && parent.container.columnTracks.length > 0) {
      return parent.container.columnTracks.length
    }
    return Math.max(1, countTracks(parent.container.columns || '1fr'))
  }

  const resolveGridGeometry = (
    node: NonNullable<(typeof selectedNodes.value)[number]>,
  ): GridNodeGeometry => {
    const colCount = resolveGridColumnCount(node)
    const placement = nodeToPlacement(node, colCount, {
      colStart: 1,
      colSpan: 3,
      rowStart: 1,
      rowSpan: 2,
    })
    return {
      mode: 'grid',
      gridColumnStart: placement.colStart,
      gridColumnEnd: placement.colStart + placement.colSpan,
      gridRowStart: placement.rowStart,
      gridRowEnd: placement.rowStart + placement.rowSpan,
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return
    }

    const isMac = navigator.platform.toUpperCase().includes('MAC')
    const ctrlKey = isMac ? e.metaKey : e.ctrlKey

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

    if ((options.enableClipboard ?? true) && ctrlKey && e.key === 'c') {
      if (selectedId.value || selectedIds.value.length > 0) {
        e.preventDefault()
        copySelectedNodes()
      }
      return
    }

    if ((options.enableClipboard ?? true) && ctrlKey && e.key === 'x') {
      if (selectedId.value || selectedIds.value.length > 0) {
        e.preventDefault()
        cutSelectedNodes()
      }
      return
    }

    if ((options.enableClipboard ?? true) && ctrlKey && e.key === 'v') {
      e.preventDefault()
      pasteNodes()
      return
    }

    if ((options.enableSelectAll ?? true) && ctrlKey && e.key === 'a') {
      if (rootNode.value?.children && rootNode.value.children.length > 0) {
        e.preventDefault()
        const allIds = rootNode.value.children.map((n) => n.id)
        selectComponents(allIds)
      }
      return
    }

    if ((options.enableNudge ?? true) && !ctrlKey && !e.altKey) {
      let dx = 0
      let dy = 0
      if (e.key === 'ArrowLeft') dx = -1
      if (e.key === 'ArrowRight') dx = 1
      if (e.key === 'ArrowUp') dy = -1
      if (e.key === 'ArrowDown') dy = 1

      if (dx !== 0 || dy !== 0) {
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

        const gridNodes = selectedNodes.value.filter((node) => isNodeGridLayout(node))
        if (gridNodes.length > 0) {
          e.preventDefault()
          const moveStep = e.shiftKey ? 1 : (options.nudgeStep ?? 1)
          gridNodes.forEach((node) => {
            const geo = resolveGridGeometry(node)
            const colCount = resolveGridColumnCount(node)
            const colSpan = Math.max(1, geo.gridColumnEnd - geo.gridColumnStart)
            const rowSpan = Math.max(1, geo.gridRowEnd - geo.gridRowStart)

            let colStart = geo.gridColumnStart
            let rowStart = geo.gridRowStart
            let nextColSpan = colSpan
            let nextRowSpan = rowSpan

            if (e.shiftKey) {
              if (dx !== 0) {
                nextColSpan = clampInt(colSpan + dx * moveStep, 1, colCount - colStart + 1)
              }
              if (dy !== 0) {
                nextRowSpan = clampInt(rowSpan + dy * moveStep, 1, 48)
              }
            } else {
              colStart = clampInt(colStart + dx * moveStep, 1, colCount - colSpan + 1)
              rowStart = clampInt(rowStart + dy * moveStep, 1, 4096)
            }

            updateGeometry(node.id, {
              mode: 'grid',
              gridColumnStart: colStart,
              gridColumnEnd: colStart + nextColSpan,
              gridRowStart: rowStart,
              gridRowEnd: rowStart + nextRowSpan,
            })
          })
          return
        }
        return
      }
    }

    if (e.key === 'Escape') {
      const currentId = selectedId.value ?? selectedIds.value[0]
      if (currentId && selectedIds.value.length === 1) {
        const parentId = getParentId(currentId)
        if (parentId) {
          e.preventDefault()
          if (options.closeMenu) {
            options.closeMenu()
          }
          selectComponent(parentId)
          return
        }
      }

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
