import { ref } from 'vue'
import type { NodeSchema } from '@vela/core'

export interface SnapLine {
  type: 'v' | 'h'
  position: number // x or y value
  start: number // start coordinate (y for v-line, x for h-line)
  end: number // end coordinate
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/** Extract Rect from a NodeSchema's geometry/style */
const getNodeRect = (node: NodeSchema): Rect => {
  const geometry = node.geometry?.mode === 'free' ? node.geometry : undefined
  const style = node.style || {}
  const parseNumber = (value: unknown): number => {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0
    }
    if (typeof value === 'string') {
      const num = Number.parseFloat(value)
      return Number.isFinite(num) ? num : 0
    }
    return 0
  }

  return {
    x: parseNumber(geometry?.x ?? style.left ?? 0),
    y: parseNumber(geometry?.y ?? style.top ?? 0),
    w: parseNumber(geometry?.width ?? style.width ?? 0),
    h: parseNumber(geometry?.height ?? style.height ?? 0),
  }
}

export function useSnapping(threshold = 5) {
  const snapLines = ref<SnapLine[]>([])

  /**
   * Calculate snapped position against target rects
   * Accepts either NodeSchema[] (for backward compat) or Rect[] targets
   */
  const snap = (current: Rect, siblings: NodeSchema[], extraTargets?: Rect[]) => {
    let newX = current.x
    let newY = current.y
    const lines: SnapLine[] = []

    // Points of interest on current rect
    const cx = {
      start: current.x,
      center: current.x + current.w / 2,
      end: current.x + current.w,
    }

    const cy = {
      start: current.y,
      center: current.y + current.h / 2,
      end: current.y + current.h,
    }

    let minDeltaX = Infinity
    let minDeltaY = Infinity
    let snapX: number | null = null
    let snapY: number | null = null

    // Collect all target rects: sibling nodes + extra targets (canvas bounds, etc.)
    const targetRects: Rect[] = siblings.map(getNodeRect)
    if (extraTargets) {
      targetRects.push(...extraTargets)
    }

    // Iterate targets
    for (const target of targetRects) {
      const sx = {
        start: target.x,
        center: target.x + target.w / 2,
        end: target.x + target.w,
      }

      const sy = {
        start: target.y,
        center: target.y + target.h / 2,
        end: target.y + target.h,
      }

      // Check X axis alignment (vertical lines)
      for (const [, cVal] of Object.entries(cx)) {
        for (const [, sVal] of Object.entries(sx)) {
          const diff = sVal - cVal
          if (Math.abs(diff) < threshold && Math.abs(diff) < Math.abs(minDeltaX)) {
            minDeltaX = diff
            snapX = sVal
          }
        }
      }

      // Check Y axis alignment (horizontal lines)
      for (const [, cVal] of Object.entries(cy)) {
        for (const [, sVal] of Object.entries(sy)) {
          const diff = sVal - cVal
          if (Math.abs(diff) < threshold && Math.abs(diff) < Math.abs(minDeltaY)) {
            minDeltaY = diff
            snapY = sVal
          }
        }
      }
    }

    // Apply snap if within threshold
    if (Math.abs(minDeltaX) < threshold) {
      newX += minDeltaX
      lines.push({
        type: 'v',
        position: snapX!,
        start: -99999, // Infinite for now
        end: 99999,
      })
    }

    if (Math.abs(minDeltaY) < threshold) {
      newY += minDeltaY
      lines.push({
        type: 'h',
        position: snapY!,
        start: -99999,
        end: 99999,
      })
    }

    snapLines.value = lines
    return {
      position: { x: newX, y: newY },
      lines,
    }
  }

  const clearSnap = () => {
    snapLines.value = []
  }

  return {
    snap,
    clearSnap,
    snapLines,
    getNodeRect,
  }
}
