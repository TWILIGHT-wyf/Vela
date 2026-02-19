import { ref, inject, provide, type Ref, type InjectionKey } from 'vue'

/**
 * Canvas context interface
 * Provides viewport state and coordinate transformation utilities
 */
export interface CanvasContext {
  /** Current zoom scale (1 = 100%) */
  scale: Ref<number>
  /** Horizontal pan offset in pixels */
  panX: Ref<number>
  /** Vertical pan offset in pixels */
  panY: Ref<number>
  /** Reference to the viewport DOM element */
  viewportRef: Ref<HTMLElement | null>
  /** Whether panning is currently active */
  isPanning: Ref<boolean>
  /** Whether space key is pressed (for pan mode) */
  isSpacePressed: Ref<boolean>
  /** Convert client coordinates to stage coordinates */
  toStageCoords: (clientX: number, clientY: number) => { x: number; y: number }
  /** Convert stage coordinates to client coordinates */
  toClientCoords: (stageX: number, stageY: number) => { x: number; y: number }
  /** Set zoom scale with optional focal point */
  setScale: (newScale: number, focalPoint?: { x: number; y: number }) => void
  /** Set pan offset */
  setPan: (x: number, y: number) => void
  /** Pan by delta */
  panBy: (dx: number, dy: number) => void
}

/** Injection key for canvas context */
export const CANVAS_CONTEXT_KEY: InjectionKey<CanvasContext> = Symbol('canvas-context')

/**
 * Create and provide canvas context
 * Call this in the CanvasViewport component
 */
export function useCanvasContextProvider(options: {
  minScale?: number
  maxScale?: number
  initialScale?: number
}) {
  const { minScale = 0.1, maxScale = 3, initialScale = 1 } = options

  // State
  const scale = ref(initialScale)
  const panX = ref(0)
  const panY = ref(0)
  const viewportRef = ref<HTMLElement | null>(null)
  const isPanning = ref(false)
  const isSpacePressed = ref(false)

  /**
   * Convert client (screen) coordinates to stage (canvas) coordinates
   * Formula: stageX = (clientX - viewportLeft - panX) / scale
   */
  const toStageCoords = (clientX: number, clientY: number): { x: number; y: number } => {
    const viewport = viewportRef.value
    if (!viewport) return { x: 0, y: 0 }

    const rect = viewport.getBoundingClientRect()
    const x = (clientX - rect.left - panX.value) / scale.value
    const y = (clientY - rect.top - panY.value) / scale.value

    return { x, y }
  }

  /**
   * Convert stage coordinates back to client coordinates
   */
  const toClientCoords = (stageX: number, stageY: number): { x: number; y: number } => {
    const viewport = viewportRef.value
    if (!viewport) return { x: 0, y: 0 }

    const rect = viewport.getBoundingClientRect()
    const x = stageX * scale.value + panX.value + rect.left
    const y = stageY * scale.value + panY.value + rect.top

    return { x, y }
  }

  /**
   * Set scale with optional focal point (zoom towards cursor)
   */
  const setScale = (newScale: number, focalPoint?: { x: number; y: number }) => {
    const clampedScale = Math.min(maxScale, Math.max(minScale, newScale))

    if (focalPoint && viewportRef.value) {
      // Zoom towards focal point
      const rect = viewportRef.value.getBoundingClientRect()
      const mouseX = focalPoint.x - rect.left
      const mouseY = focalPoint.y - rect.top

      // Calculate the stage point under cursor before zoom
      const stageX = (mouseX - panX.value) / scale.value
      const stageY = (mouseY - panY.value) / scale.value

      // Update scale
      scale.value = clampedScale

      // Calculate new pan to keep the same stage point under cursor
      panX.value = mouseX - stageX * clampedScale
      panY.value = mouseY - stageY * clampedScale
    } else {
      scale.value = clampedScale
    }
  }

  /**
   * Set absolute pan position
   */
  const setPan = (x: number, y: number) => {
    panX.value = x
    panY.value = y
  }

  /**
   * Pan by delta values
   */
  const panBy = (dx: number, dy: number) => {
    panX.value += dx
    panY.value += dy
  }

  // Create context object
  const context: CanvasContext = {
    scale,
    panX,
    panY,
    viewportRef,
    isPanning,
    isSpacePressed,
    toStageCoords,
    toClientCoords,
    setScale,
    setPan,
    panBy,
  }

  // Provide to children
  provide(CANVAS_CONTEXT_KEY, context)

  return context
}

/**
 * Inject canvas context in child components
 * Throws if used outside of CanvasViewport
 */
export function useCanvasContext(): CanvasContext {
  const context = inject(CANVAS_CONTEXT_KEY)
  if (!context) {
    throw new Error('[useCanvasContext] Must be used within a CanvasViewport component')
  }
  return context
}
