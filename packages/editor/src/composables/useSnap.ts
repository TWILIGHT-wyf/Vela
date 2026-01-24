import { ref } from 'vue'
import type { NodeSchema } from '@vela/core'

export interface SnapLine {
  type: 'v' | 'h'
  position: number // 线的位置 (x for vertical, y for horizontal)
  start: number // 线的起点
  end: number // 线的终点
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export function useSnap(threshold = 5) {
  const snapLines = ref<SnapLine[]>([])

  /**
   * 计算吸附
   * @param current 当前拖拽的节点 Rect (预测位置)
   * @param siblings 兄弟节点列表
   * @returns 修正后的 { x, y }
   */
  const calcSnap = (current: Rect, siblings: NodeSchema[]) => {
    let newX = current.x
    let newY = current.y
    const lines: SnapLine[] = []

    // 关键点定义
    // X轴: 左(x), 中(x+w/2), 右(x+w)
    // Y轴: 顶(y), 中(y+h/2), 底(y+h)

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

    // 遍历兄弟节点
    for (const node of siblings) {
      // 排除自己 (假设调用方已过滤，或者在这里通过ID判断，但这里没ID)
      // 简单起见，调用方负责传入过滤后的列表

      const nx = Number(node.style?.x || 0)
      const ny = Number(node.style?.y || 0)
      const nw = Number(node.style?.width || 0)
      const nh = Number(node.style?.height || 0)

      const sx = {
        start: nx,
        center: nx + nw / 2,
        end: nx + nw,
      }

      const sy = {
        start: ny,
        center: ny + nh / 2,
        end: ny + nh,
      }

      // --- 水平吸附 (调整 X) ---
      // 检查当前节点的 start/center/end 是否对齐了目标的 start/center/end
      for (const [cKey, cVal] of Object.entries(cx)) {
        for (const [sKey, sVal] of Object.entries(sx)) {
          const diff = sVal - cVal
          if (Math.abs(diff) < threshold && Math.abs(diff) < Math.abs(minDeltaX)) {
            minDeltaX = diff
            snapX = sVal // 吸附到的位置
            // 记录辅助线
            // 线长度取两者的并集
            const minY = Math.min(current.y, ny)
            const maxY = Math.max(current.y + current.h, ny + nh)

            // 清除旧的同方向线? 暂时保留最近的
            // 简单策略：先存下来，最后再决定用哪个
          }
        }
      }

      // --- 垂直吸附 (调整 Y) ---
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

    // 应用吸附
    if (Math.abs(minDeltaX) < threshold) {
      newX += minDeltaX
      // 生成 X 轴辅助线 (Vertical Line)
      // 这里简化：只画一条线。实际上可能需要画多条如果对齐了多个
      // 且需要计算线的长度 range
      lines.push({
        type: 'v',
        position: snapX!, // newX + offset... 实际上 position 就是 targetVal
        start: -9999, // 简化：画无限长，或者由 UI 截断
        end: 9999,
      })
    }

    if (Math.abs(minDeltaY) < threshold) {
      newY += minDeltaY
      lines.push({
        type: 'h',
        position: snapY!,
        start: -9999,
        end: 9999,
      })
    }

    snapLines.value = lines
    return { x: newX, y: newY }
  }

  const clearSnap = () => {
    snapLines.value = []
  }

  return {
    snapLines,
    calcSnap,
    clearSnap,
  }
}
