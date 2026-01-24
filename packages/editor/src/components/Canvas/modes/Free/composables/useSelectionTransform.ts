import { type Ref, type ComputedRef } from 'vue'
import { throttle } from 'lodash-es'
import { useComponent } from '@/stores/component'
import { useSnap } from './useSnap'

interface TransformOptions {
  canvasScale: Ref<number>
  emitSnapLines: (lines: { x?: number; y?: number }[]) => void
}

export function useSelectionTransform(
  selectedNodeId: ComputedRef<string | null>,
  currentStyle: ComputedRef<Record<string, any> | undefined>,
  options: TransformOptions,
) {
  const componentStore = useComponent()
  const { updateStyle } = componentStore

  // Initialize snap
  let snapToNeighbors: ReturnType<typeof useSnap>['snapToNeighbors'] | null = null
  let snapToGrid: ReturnType<typeof useSnap>['snapToGrid'] | null = null

  try {
    const snap = useSnap()
    snapToNeighbors = snap.snapToNeighbors
    snapToGrid = snap.snapToGrid
  } catch (e) {
    console.warn('[useSelectionTransform] Snap initialization failed:', e)
  }

  // Constants
  const MIN_SIZE = 20
  const SNAP_THRESHOLD = 5
  const GRID_SIZE = 20

  // ========== Drag Logic ==========
  let isDragging = false
  let dragStartX = 0
  let dragStartY = 0
  let dragStartPos = { x: 0, y: 0 }

  const onDragStart = (e: MouseEvent) => {
    if (!selectedNodeId.value || !currentStyle.value) return

    e.preventDefault()
    e.stopPropagation()

    isDragging = true
    dragStartX = e.clientX
    dragStartY = e.clientY

    // Parse current position
    const style = currentStyle.value
    dragStartPos = {
      x: typeof style.x === 'number' ? style.x : parseFloat(style.left || '0') || 0,
      y: typeof style.y === 'number' ? style.y : parseFloat(style.top || '0') || 0,
    }

    window.addEventListener('mousemove', onDragMove)
    window.addEventListener('mouseup', onDragEnd)
  }

  const onDragMove = throttle((e: MouseEvent) => {
    if (!isDragging || !selectedNodeId.value) return

    const scale = options.canvasScale.value || 1
    const dx = (e.clientX - dragStartX) / scale
    const dy = (e.clientY - dragStartY) / scale

    let newX = dragStartPos.x + dx
    let newY = dragStartPos.y + dy

    // Snap logic
    try {
      if (e.ctrlKey && snapToGrid) {
        const gridSnap = snapToGrid({ x: newX, y: newY }, GRID_SIZE)
        newX = gridSnap.position.x
        newY = gridSnap.position.y
        options.emitSnapLines(gridSnap.lines)
      } else if (snapToNeighbors) {
        const componentSnap = snapToNeighbors(SNAP_THRESHOLD, { x: newX, y: newY })
        if (componentSnap) {
          newX = componentSnap.position.x
          newY = componentSnap.position.y
          options.emitSnapLines(componentSnap.lines)
        } else {
          options.emitSnapLines([])
        }
      }
    } catch (e) {
      console.warn('[useSelectionTransform] Snap failed:', e)
      options.emitSnapLines([])
    }

    updateStyle(selectedNodeId.value, {
      x: Math.round(newX),
      y: Math.round(newY),
    })
  }, 16)

  const onDragEnd = () => {
    isDragging = false
    options.emitSnapLines([])
    window.removeEventListener('mousemove', onDragMove)
    window.removeEventListener('mouseup', onDragEnd)
  }

  // ========== Resize Logic ==========
  let isResizing = false
  let resizeStartX = 0
  let resizeStartY = 0
  let resizeStartPos = { x: 0, y: 0 }
  let resizeStartSize = { width: 0, height: 0 }
  let resizeDirection = ''

  const onResizeStart = (direction: string, e: MouseEvent) => {
    if (!selectedNodeId.value || !currentStyle.value) return

    e.preventDefault()
    e.stopPropagation()

    isResizing = true
    resizeStartX = e.clientX
    resizeStartY = e.clientY
    resizeDirection = direction

    const style = currentStyle.value
    resizeStartPos = {
      x: typeof style.x === 'number' ? style.x : parseFloat(style.left || '0') || 0,
      y: typeof style.y === 'number' ? style.y : parseFloat(style.top || '0') || 0,
    }
    resizeStartSize = {
      width:
        typeof style.width === 'number' ? style.width : parseFloat(style.width || '100') || 100,
      height:
        typeof style.height === 'number' ? style.height : parseFloat(style.height || '100') || 100,
    }

    window.addEventListener('mousemove', onResizeMove)
    window.addEventListener('mouseup', onResizeEnd)
  }

  const onResizeMove = throttle((e: MouseEvent) => {
    if (!isResizing || !selectedNodeId.value) return

    const scale = options.canvasScale.value || 1
    const dx = (e.clientX - resizeStartX) / scale
    const dy = (e.clientY - resizeStartY) / scale

    let newX = resizeStartPos.x
    let newY = resizeStartPos.y
    let newWidth = resizeStartSize.width
    let newHeight = resizeStartSize.height

    if (resizeDirection.includes('e')) {
      newWidth = Math.max(MIN_SIZE, resizeStartSize.width + dx)
    }
    if (resizeDirection.includes('w')) {
      const diff = Math.min(dx, resizeStartSize.width - MIN_SIZE)
      newX = resizeStartPos.x + diff
      newWidth = resizeStartSize.width - diff
    }
    if (resizeDirection.includes('s')) {
      newHeight = Math.max(MIN_SIZE, resizeStartSize.height + dy)
    }
    if (resizeDirection.includes('n')) {
      const diff = Math.min(dy, resizeStartSize.height - MIN_SIZE)
      newY = resizeStartPos.y + diff
      newHeight = resizeStartSize.height - diff
    }

    if (e.ctrlKey) {
      newX = Math.round(newX / GRID_SIZE) * GRID_SIZE
      newY = Math.round(newY / GRID_SIZE) * GRID_SIZE
      newWidth = Math.round(newWidth / GRID_SIZE) * GRID_SIZE
      newHeight = Math.round(newHeight / GRID_SIZE) * GRID_SIZE
    }

    updateStyle(selectedNodeId.value, {
      x: Math.round(newX),
      y: Math.round(newY),
      width: Math.round(newWidth),
      height: Math.round(newHeight),
    })
  }, 16)

  const onResizeEnd = () => {
    isResizing = false
    window.removeEventListener('mousemove', onResizeMove)
    window.removeEventListener('mouseup', onResizeEnd)
  }

  // ========== Rotate Logic ==========
  let isRotating = false
  let rotateStartAngle = 0
  let rotateCenterX = 0
  let rotateCenterY = 0

  const onRotateStart = (e: MouseEvent) => {
    if (!selectedNodeId.value || !currentStyle.value) return

    e.preventDefault()
    e.stopPropagation()

    isRotating = true

    const handleEl = e.target as HTMLElement
    const overlayEl = handleEl.closest('.selection-overlay')
    if (!overlayEl) return

    const rect = overlayEl.getBoundingClientRect()
    rotateCenterX = rect.left + rect.width / 2
    rotateCenterY = rect.top + rect.height / 2

    const style = currentStyle.value
    const currentRotation = typeof style.rotate === 'number' ? style.rotate : 0

    rotateStartAngle =
      Math.atan2(e.clientY - rotateCenterY, e.clientX - rotateCenterX) -
      (currentRotation * Math.PI) / 180

    window.addEventListener('mousemove', onRotateMove)
    window.addEventListener('mouseup', onRotateEnd)
  }

  const onRotateMove = throttle((e: MouseEvent) => {
    if (!isRotating || !selectedNodeId.value) return

    const angle =
      Math.atan2(e.clientY - rotateCenterY, e.clientX - rotateCenterX) - rotateStartAngle
    let deg = (angle * 180) / Math.PI

    if (e.shiftKey) {
      deg = Math.round(deg / 15) * 15
    }

    updateStyle(selectedNodeId.value, {
      rotate: Math.round(deg),
    })
  }, 16)

  const onRotateEnd = () => {
    isRotating = false
    window.removeEventListener('mousemove', onRotateMove)
    window.removeEventListener('mouseup', onRotateEnd)
  }

  return {
    onDragStart,
    onResizeStart,
    onRotateStart,
  }
}
