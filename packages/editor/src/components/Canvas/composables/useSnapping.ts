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

export function useSnapping(threshold = 5) {
  const snapLines = ref<SnapLine[]>([])

  /**
   * Calculate snapped position against siblings
   */
  const snap = (current: Rect, siblings: NodeSchema[]) => {
    let newX = current.x
    let newY = current.y
    const lines: SnapLine[] = []

    // Helper to extract rect from node
    const getNodeRect = (node: NodeSchema): Rect => {
      const s = node.style || {}
      return {
        x: Number(s.x ?? 0),
        y: Number(s.y ?? 0),
        w: Number(s.width ?? 0),
        h: Number(s.height ?? 0),
      }
    }

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

    // Iterate siblings
    for (const node of siblings) {
      const target = getNodeRect(node)

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
      // Compare current [start, center, end] with target [start, center, end]
      for (const [cKey, cVal] of Object.entries(cx)) {
        for (const [sKey, sVal] of Object.entries(sx)) {
          const diff = sVal - cVal
          if (Math.abs(diff) < threshold && Math.abs(diff) < Math.abs(minDeltaX)) {
            minDeltaX = diff
            snapX = sVal

            // For now, simplify line to infinite or fixed range
            // Ideally should be min/max of the two components
          }
        }
      }

      // Check Y axis alignment (horizontal lines)
      for (const [cKey, cVal] of Object.entries(cy)) {
        for (const [sKey, sVal] of Object.entries(sy)) {
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
  }
}
