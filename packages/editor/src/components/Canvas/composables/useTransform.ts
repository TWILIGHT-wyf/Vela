import { ref } from 'vue'
import { throttle } from 'lodash-es'
import type { NodeSchema } from '@vela/core'
import { useCanvasContext } from './useCanvasContext'
import { useSnapping } from './useSnapping'
import { useComponent } from '@/stores/component'
import { useSizeStore } from '@/stores/size'

export type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

const MIN_SIZE = 10

export function useTransform() {
  const { scale, toClientCoords } = useCanvasContext()
  const store = useComponent()
  const sizeStore = useSizeStore()
  const { snap, clearSnap, snapLines } = useSnapping()

  const isDragging = ref(false)
  const isResizing = ref(false)
  const isRotating = ref(false)
  const resizeInfo = ref<{ width: number; height: number } | null>(null)

  const getSiblings = (id: string) => {
    const parent = store.findParentNode(id)
    if (parent && parent.children) {
      return parent.children.filter((c) => c.id !== id)
    }
    if (store.rootNode?.children) {
      return store.rootNode.children.filter((c) => c.id !== id)
    }
    return []
  }

  // --- Drag ---
  const startDrag = (id: string, node: NodeSchema, e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    isDragging.value = true
    const startX = e.clientX
    const startY = e.clientY

    const geometry = node.geometry?.mode === 'free' ? node.geometry : undefined
    const initialX = geometry?.x ?? 0
    const initialY = geometry?.y ?? 0
    const width = Number(geometry?.width ?? node.style?.width ?? 100) || 100
    const height = Number(geometry?.height ?? node.style?.height ?? 100) || 100

    const siblings = getSiblings(id)

    const onMove = throttle((ev: MouseEvent) => {
      const dx = (ev.clientX - startX) / scale.value
      const dy = (ev.clientY - startY) / scale.value

      const rawX = initialX + dx
      const rawY = initialY + dy

      let nextX = rawX
      let nextY = rawY

      // Hold Alt to temporarily disable snapping for precise move
      if (!ev.altKey) {
        // Canvas boundary as a synthetic snap target (edges + center lines)
        const canvasBoundsRect = { x: 0, y: 0, w: sizeStore.width, h: sizeStore.height }
        const { position } = snap(
          {
            x: rawX,
            y: rawY,
            w: width,
            h: height,
          },
          siblings,
          [canvasBoundsRect],
        )
        nextX = position.x
        nextY = position.y
      } else {
        clearSnap()
      }

      // Snap-to-grid (sibling/boundary snapping takes priority over grid)
      // Use explicit flag: grid only applies if NO snap adjusted the position
      const siblingSnappedX = nextX !== rawX
      const siblingSnappedY = nextY !== rawY
      const rootContainer = store.rootNode?.container
      if (
        rootContainer?.mode === 'free' &&
        rootContainer.snapToGrid &&
        rootContainer.gridSize &&
        rootContainer.gridSize > 1
      ) {
        const gs = rootContainer.gridSize
        if (!siblingSnappedX) {
          nextX = Math.round(nextX / gs) * gs
        }
        if (!siblingSnappedY) {
          nextY = Math.round(nextY / gs) * gs
        }
      }

      // Clamp to canvas boundaries
      const canvasW = sizeStore.width
      const canvasH = sizeStore.height
      nextX = Math.max(0, Math.min(nextX, canvasW - width))
      nextY = Math.max(0, Math.min(nextY, canvasH - height))

      store.updateGeometry(id, {
        mode: 'free',
        x: Math.round(nextX),
        y: Math.round(nextY),
      })
    }, 16)

    const onUp = () => {
      isDragging.value = false
      clearSnap()
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // --- Resize ---
  const startResize = (id: string, handle: ResizeHandle, node: NodeSchema, e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    isResizing.value = true
    const startX = e.clientX
    const startY = e.clientY

    const geometry = node.geometry?.mode === 'free' ? node.geometry : undefined
    const initialX = geometry?.x ?? 0
    const initialY = geometry?.y ?? 0
    const initialW = Number(geometry?.width ?? node.style?.width ?? 100) || 100
    const initialH = Number(geometry?.height ?? node.style?.height ?? 100) || 100

    const canvasW = sizeStore.width
    const canvasH = sizeStore.height

    const onMove = throttle((ev: MouseEvent) => {
      const dx = (ev.clientX - startX) / scale.value
      const dy = (ev.clientY - startY) / scale.value

      let newX = initialX
      let newY = initialY
      let newW = initialW
      let newH = initialH

      // West handles: derive position from clamped size change
      if (handle.includes('w')) {
        newW = Math.max(MIN_SIZE, initialW - dx)
        newW = Math.min(newW, initialX + initialW) // left edge can't go below 0
        newX = initialX + initialW - newW
      }
      // East handles: clamp to canvas right edge
      if (handle.includes('e')) {
        newW = Math.max(MIN_SIZE, Math.min(initialW + dx, canvasW - initialX))
      }
      // North handles: derive position from clamped size change
      if (handle.includes('n')) {
        newH = Math.max(MIN_SIZE, initialH - dy)
        newH = Math.min(newH, initialY + initialH) // top edge can't go below 0
        newY = initialY + initialH - newH
      }
      // South handles: clamp to canvas bottom edge
      if (handle.includes('s')) {
        newH = Math.max(MIN_SIZE, Math.min(initialH + dy, canvasH - initialY))
      }

      resizeInfo.value = { width: Math.round(newW), height: Math.round(newH) }

      store.updateGeometry(id, {
        mode: 'free',
        x: Math.round(newX),
        y: Math.round(newY),
        width: Math.round(newW),
        height: Math.round(newH),
      })
    }, 16)

    const onUp = () => {
      isResizing.value = false
      resizeInfo.value = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // --- Rotate ---
  const startRotate = (id: string, node: NodeSchema, e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    isRotating.value = true

    const geometry = node.geometry?.mode === 'free' ? node.geometry : undefined
    const width = Number(geometry?.width ?? node.style?.width ?? 100) || 100
    const height = Number(geometry?.height ?? node.style?.height ?? 100) || 100
    const cx = Number(geometry?.x ?? 0) + width / 2
    const cy = Number(geometry?.y ?? 0) + height / 2

    const center = toClientCoords(cx, cy)
    const startAngle = Math.atan2(e.clientY - center.y, e.clientX - center.x)
    const initialRotate = Number(geometry?.rotate ?? 0)

    const onMove = throttle((ev: MouseEvent) => {
      const angle = Math.atan2(ev.clientY - center.y, ev.clientX - center.x)
      const delta = angle - startAngle
      const deg = initialRotate + (delta * 180) / Math.PI

      const finalDeg = ev.shiftKey ? Math.round(deg / 15) * 15 : deg

      store.updateGeometry(id, {
        mode: 'free',
        rotate: Math.round(finalDeg),
      })
    }, 16)

    const onUp = () => {
      isRotating.value = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return {
    isDragging,
    isResizing,
    isRotating,
    resizeInfo,
    startDrag,
    startResize,
    startRotate,
    snapLines,
  }
}
