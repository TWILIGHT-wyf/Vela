import { ref } from 'vue'
import { throttle } from 'lodash-es'
import type { NodeSchema } from '@vela/core'
import { useCanvasContext } from './useCanvasContext'
import { useSnapping } from './useSnapping'
import { useComponent } from '@/stores/component'

export type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

export function useTransform() {
  const { scale, toClientCoords } = useCanvasContext()
  const store = useComponent()
  const { snap, clearSnap, snapLines } = useSnapping()

  const isDragging = ref(false)
  const isResizing = ref(false)
  const isRotating = ref(false)

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
        const { position } = snap(
          {
            x: rawX,
            y: rawY,
            w: width,
            h: height,
          },
          siblings,
        )
        nextX = position.x
        nextY = position.y
      } else {
        clearSnap()
      }

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
  const startResize = (
    id: string,
    handle: ResizeHandle,
    node: NodeSchema,
    e: MouseEvent,
  ) => {
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

    const onMove = throttle((ev: MouseEvent) => {
      const dx = (ev.clientX - startX) / scale.value
      const dy = (ev.clientY - startY) / scale.value

      let newX = initialX
      let newY = initialY
      let newW = initialW
      let newH = initialH

      if (handle.includes('e')) newW = initialW + dx
      if (handle.includes('w')) {
        newX = initialX + dx
        newW = initialW - dx
      }
      if (handle.includes('s')) newH = initialH + dy
      if (handle.includes('n')) {
        newY = initialY + dy
        newH = initialH - dy
      }

      if (newW < 10) newW = 10
      if (newH < 10) newH = 10

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
    startDrag,
    startResize,
    startRotate,
    snapLines,
  }
}
