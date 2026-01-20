import { useComponent } from '@/stores/component'
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import type { NodeSchema } from '@vela/core'

type Position = { x: number; y: number }
type Size = { width: number; height: number }

type Box = {
  minx: number
  miny: number
  maxx: number
  maxy: number
  cx: number
  cy: number
  corners: Position[]
}

type SnapComp = {
  id: string
  position: Position
  size: Size
  rotation: number
}

type SnapResult = {
  position: Position
  lines: { x?: number; y?: number }[]
}

/**
 * 吸附计算 Composable (V1.5 - 适配 NodeSchema)
 * 提供网格吸附和邻居组件吸附的纯计算逻辑
 */
export function useSnap() {
  const store = useComponent()
  const { rootNode, selectedId } = storeToRefs(store)

  function deg2rad(deg: number): number {
    return (deg * Math.PI) / 180
  }

  /**
   * 安全解析数值（支持 number 和 string 类型）
   */
  function parseNumericValue(value: unknown, defaultValue: number): number {
    if (typeof value === 'number') return value
    if (typeof value === 'string') return parseFloat(value) || defaultValue
    return defaultValue
  }

  /**
   * 从 NodeSchema 的 style 中提取位置信息
   * 支持新格式 (x/y 数值) 和旧格式 (left/top 字符串)
   */
  function extractPosition(node: NodeSchema): Position {
    const style = node.style
    return {
      x: style?.x !== undefined ? parseNumericValue(style.x, 0) : parseNumericValue(style?.left, 0),
      y: style?.y !== undefined ? parseNumericValue(style.y, 0) : parseNumericValue(style?.top, 0),
    }
  }

  /**
   * 从 NodeSchema 的 style 中提取尺寸信息
   */
  function extractSize(node: NodeSchema): Size {
    const style = node.style
    return {
      width: parseNumericValue(style?.width, 100),
      height: parseNumericValue(style?.height, 100),
    }
  }

  /**
   * 从 NodeSchema 的 style 中提取旋转角度
   */
  function extractRotation(node: NodeSchema): number {
    const transform = node.style?.transform || ''
    const match = transform.match(/rotate\(([-\d.]+)deg\)/)
    return match ? parseFloat(match[1]) : 0
  }

  /**
   * 将 NodeSchema 树扁平化为数组
   */
  function flattenNodes(node: NodeSchema | null): NodeSchema[] {
    if (!node) return []

    const result: NodeSchema[] = [node]

    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        result.push(...flattenNodes(child))
      }
    }

    return result
  }

  // ========== 响应式数据 ==========

  /**
   * 所有组件的吸附数据
   */
  const comps = computed(() => {
    const allNodes = flattenNodes(rootNode.value)
    return allNodes
      .filter((node) => node.style?.position === 'absolute') // 只处理绝对定位的组件
      .map((node) => ({
        id: node.id,
        position: extractPosition(node),
        size: extractSize(node),
        rotation: deg2rad(extractRotation(node)),
      })) as SnapComp[]
  })

  /**
   * 当前选中组件
   */
  const selectedNode = computed(() => {
    if (!selectedId.value) return null
    return store.getComponentById(selectedId.value)
  })

  /**
   * 当前选中组件的吸附数据
   */
  const meComp = computed<SnapComp>(() => {
    const node = selectedNode.value
    if (!node) {
      return {
        id: '',
        position: { x: 0, y: 0 },
        size: { width: 0, height: 0 },
        rotation: 0,
      }
    }

    return {
      id: node.id,
      position: extractPosition(node),
      size: extractSize(node),
      rotation: deg2rad(extractRotation(node)),
    }
  })

  /**
   * 当前选中组件的包围盒
   */
  const meBox = computed(() => toBox(meComp.value))

  /**
   * 所有组件的包围盒缓存
   */
  const boxCache = computed(() => {
    const cache = new Map<string, Box>()
    comps.value.forEach((c) => cache.set(c.id, toBox(c)))
    return cache
  })

  // ========== 核心计算函数 ==========

  /**
   * 将组件转换为包围盒（支持旋转）
   */
  function toBox(com: SnapComp): Box {
    const { x, y } = com.position
    const { width, height } = com.size
    const rotation = com.rotation || 0

    const halfW = width / 2
    const halfH = height / 2
    const cx0 = x + halfW
    const cy0 = y + halfH

    const cos = Math.cos(rotation)
    const sin = Math.sin(rotation)

    const localCorners = [
      { x: -halfW, y: -halfH },
      { x: halfW, y: -halfH },
      { x: halfW, y: halfH },
      { x: -halfW, y: halfH },
    ]

    const transformedCorners = localCorners.map((p) => ({
      x: p.x * cos - p.y * sin + cx0,
      y: p.x * sin + p.y * cos + cy0,
    }))

    const xs = transformedCorners.map((p) => p.x)
    const ys = transformedCorners.map((p) => p.y)
    const minx = Math.min(...xs)
    const maxx = Math.max(...xs)
    const miny = Math.min(...ys)
    const maxy = Math.max(...ys)
    const cx = (minx + maxx) / 2
    const cy = (miny + maxy) / 2

    return { minx, miny, maxx, maxy, cx, cy, corners: transformedCorners }
  }

  /**
   * 获取组件的辅助线位置
   */
  function getGuideLines(box: Box): { xLines: number[]; yLines: number[] } {
    const xSet = new Set<number>([box.minx, box.cx, box.maxx])
    const ySet = new Set<number>([box.miny, box.cy, box.maxy])
    box.corners.forEach((p) => {
      xSet.add(p.x)
      ySet.add(p.y)
    })
    return { xLines: Array.from(xSet), yLines: Array.from(ySet) }
  }

  /**
   * 找到可能产生吸附的邻居组件
   */
  function findSnapNeighbors(targetBox: Box, threshold: number = 10): { box: Box; id: string }[] {
    const neighbors: { box: Box; id: string }[] = []
    const myId = meComp.value.id

    boxCache.value.forEach((box, id) => {
      if (!id || id === myId) return

      const searchDist = threshold + 10

      const isCloseX =
        Math.abs(box.cx - targetBox.cx) <
        (box.maxx - box.minx + targetBox.maxx - targetBox.minx) / 2 + searchDist
      const isCloseY =
        Math.abs(box.cy - targetBox.cy) <
        (box.maxy - box.miny + targetBox.maxy - targetBox.miny) / 2 + searchDist

      if (isCloseX && isCloseY) {
        neighbors.push({ box, id })
      }
    })
    return neighbors
  }

  /**
   * 网格对齐
   */
  function snapToGrid(
    previewPos: Position,
    gridSize: number = 20,
  ): { position: Position; lines: { x?: number; y?: number }[] } {
    const snappedX = Math.round(previewPos.x / gridSize) * gridSize
    const snappedY = Math.round(previewPos.y / gridSize) * gridSize
    const lines: { x?: number; y?: number }[] = []

    if (Math.abs(snappedX - previewPos.x) < 2) {
      lines.push({ x: snappedX })
    }
    if (Math.abs(snappedY - previewPos.y) < 2) {
      lines.push({ y: snappedY })
    }
    return { position: { x: snappedX, y: snappedY }, lines }
  }

  /**
   * 计算与邻居组件的最佳吸附
   */
  function snapToNeighbors(threshold: number = 10, previewPos?: Position): SnapResult | null {
    const meCompEffective: SnapComp = previewPos
      ? { ...meComp.value, position: previewPos }
      : meComp.value

    if (!meCompEffective.id) return null

    const me = toBox(meCompEffective)
    const mePos = meCompEffective.position
    const myXAnchors = [me.minx, me.cx, me.maxx, ...me.corners.map((p) => p.x)]
    const myYAnchors = [me.miny, me.cy, me.maxy, ...me.corners.map((p) => p.y)]

    let bestDx: number | null = null
    let bestDy: number | null = null
    let bestDxDist = threshold + 1
    let bestDyDist = threshold + 1
    let xLine: number | undefined
    let yLine: number | undefined

    const candidateBoxes = findSnapNeighbors(me, threshold)
    const currentNode = selectedNode.value
    const childrenIds = currentNode?.children?.map((child) => child.id) || []

    candidateBoxes.forEach(({ box, id }) => {
      if (!id || id === meComp.value.id || childrenIds.includes(id)) return

      const { xLines: guideXs, yLines: guideYs } = getGuideLines(box)

      for (const myX of myXAnchors) {
        for (const gx of guideXs) {
          const dx = gx - myX
          const dist = Math.abs(dx)
          if (dist < bestDxDist && dist <= threshold) {
            bestDxDist = dist
            bestDx = dx
            xLine = gx
          }
        }
      }

      for (const myY of myYAnchors) {
        for (const gy of guideYs) {
          const dy = gy - myY
          const dist = Math.abs(dy)
          if (dist < bestDyDist && dist <= threshold) {
            bestDyDist = dist
            bestDy = dy
            yLine = gy
          }
        }
      }
    })

    if (bestDx == null && bestDy == null) return null

    const nx = mePos.x + (bestDx ?? 0)
    const ny = mePos.y + (bestDy ?? 0)
    const lines: { x?: number; y?: number }[] = []
    if (xLine !== undefined) lines.push({ x: xLine })
    if (yLine !== undefined) lines.push({ y: yLine })

    return { position: { x: nx, y: ny }, lines }
  }

  return {
    comps,
    meComp,
    meBox,
    boxCache,
    findSnapNeighbors,
    snapToNeighbors,
    snapToGrid,
  }
}
