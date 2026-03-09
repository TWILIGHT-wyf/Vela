import type { GridItemLayout, GridNodeGeometry, NodeSchema } from '@vela/core'

export interface GridPlacement {
  colStart: number
  colSpan: number
  rowStart: number
  rowSpan: number
}

export interface GridPlacementItem {
  id: string
  placement?: Partial<GridPlacement> | null
  explicit?: boolean
}

const MAX_GRID_SPAN = 48
const MAX_SCAN_ROWS = 4096

function clampInt(value: number, min: number, max: number): number {
  const rounded = Math.round(Number.isFinite(value) ? value : min)
  return Math.min(max, Math.max(min, rounded))
}

function normalizeSpan(value: number | undefined, fallback: number, max: number): number {
  if (!Number.isFinite(value)) return clampInt(fallback, 1, max)
  return clampInt(value as number, 1, max)
}

export function normalizePlacement(
  placement: Partial<GridPlacement> | null | undefined,
  columnCount: number,
  fallback: GridPlacement = { colStart: 1, colSpan: 3, rowStart: 1, rowSpan: 2 },
): GridPlacement {
  const cols = Math.max(1, clampInt(columnCount, 1, MAX_GRID_SPAN))
  const colSpan = normalizeSpan(placement?.colSpan, fallback.colSpan, cols)
  const rowSpan = normalizeSpan(placement?.rowSpan, fallback.rowSpan, MAX_GRID_SPAN)
  const maxColStart = Math.max(1, cols - colSpan + 1)
  const colStart = clampInt(placement?.colStart ?? fallback.colStart, 1, maxColStart)
  const rowStart = clampInt(placement?.rowStart ?? fallback.rowStart, 1, MAX_SCAN_ROWS)
  return { colStart, colSpan, rowStart, rowSpan }
}

export function geometryToPlacement(
  geometry: GridNodeGeometry | undefined,
  columnCount: number,
  fallback?: GridPlacement,
): GridPlacement {
  if (!geometry || geometry.mode !== 'grid') {
    return normalizePlacement(undefined, columnCount, fallback)
  }

  const colStart = geometry.gridColumnStart
  const colSpan = Math.max(1, geometry.gridColumnEnd - geometry.gridColumnStart)
  const rowStart = geometry.gridRowStart
  const rowSpan = Math.max(1, geometry.gridRowEnd - geometry.gridRowStart)
  return normalizePlacement({ colStart, colSpan, rowStart, rowSpan }, columnCount, fallback)
}

export function layoutItemToPlacement(
  layoutItem: GridItemLayout | undefined,
  columnCount: number,
  fallback?: GridPlacement,
): GridPlacement {
  if (!layoutItem || layoutItem.mode !== 'grid') {
    return normalizePlacement(undefined, columnCount, fallback)
  }

  return normalizePlacement(
    {
      colStart: layoutItem.placement.colStart,
      colSpan: layoutItem.placement.colSpan,
      rowStart: layoutItem.placement.rowStart,
      rowSpan: layoutItem.placement.rowSpan,
    },
    columnCount,
    fallback,
  )
}

export function placementToLayoutItem(
  placement: GridPlacement,
  base?: Partial<GridItemLayout>,
): GridItemLayout {
  return {
    ...(base || {}),
    mode: 'grid',
    placement: {
      colStart: placement.colStart,
      colSpan: placement.colSpan,
      rowStart: placement.rowStart,
      rowSpan: placement.rowSpan,
    },
    sizeModeX: base?.sizeModeX || 'stretch',
    sizeModeY: base?.sizeModeY || 'stretch',
    fixedWidth: base?.fixedWidth,
    fixedHeight: base?.fixedHeight,
  }
}

export function nodeToPlacement(
  node: Pick<NodeSchema, 'geometry' | 'layoutItem'>,
  columnCount: number,
  fallback?: GridPlacement,
): GridPlacement {
  if (node.layoutItem?.mode === 'grid') {
    return layoutItemToPlacement(node.layoutItem, columnCount, fallback)
  }
  const geometry = node.geometry?.mode === 'grid' ? (node.geometry as GridNodeGeometry) : undefined
  return geometryToPlacement(geometry, columnCount, fallback)
}

export function writePlacementToNode(
  node: Pick<NodeSchema, 'geometry' | 'layoutItem'>,
  placement: GridPlacement,
): void {
  const nextLayoutItem = placementToLayoutItem(
    placement,
    node.layoutItem?.mode === 'grid' ? node.layoutItem : undefined,
  )
  node.layoutItem = nextLayoutItem
  node.geometry = placementToGeometry(
    placement,
    node.geometry?.mode === 'grid' ? (node.geometry as GridNodeGeometry) : undefined,
  )
}

export function placementToGeometry(
  placement: GridPlacement,
  base?: Partial<GridNodeGeometry>,
): GridNodeGeometry {
  return {
    ...(base || {}),
    mode: 'grid',
    gridColumnStart: placement.colStart,
    gridColumnEnd: placement.colStart + placement.colSpan,
    gridRowStart: placement.rowStart,
    gridRowEnd: placement.rowStart + placement.rowSpan,
  }
}

export function placementsOverlap(a: GridPlacement, b: GridPlacement): boolean {
  const aColEnd = a.colStart + a.colSpan
  const bColEnd = b.colStart + b.colSpan
  const aRowEnd = a.rowStart + a.rowSpan
  const bRowEnd = b.rowStart + b.rowSpan

  const colOverlap = a.colStart < bColEnd && aColEnd > b.colStart
  const rowOverlap = a.rowStart < bRowEnd && aRowEnd > b.rowStart
  return colOverlap && rowOverlap
}

// ─── 二维位图碰撞检测（性能优化）─────────────────────────────────────

/**
 * 二维位图用于 O(1) 碰撞检测。
 * 使用 Set<number> 存储已占用的 (row * maxCols + col) 键。
 */
class OccupancyGrid {
  private readonly occupied = new Set<number>()
  private readonly maxCols: number

  constructor(columnCount: number) {
    this.maxCols = columnCount
  }

  private key(row: number, col: number): number {
    return row * (this.maxCols + 1) + col
  }

  mark(placement: GridPlacement): void {
    const colEnd = placement.colStart + placement.colSpan
    const rowEnd = placement.rowStart + placement.rowSpan
    for (let r = placement.rowStart; r < rowEnd; r++) {
      for (let c = placement.colStart; c < colEnd; c++) {
        this.occupied.add(this.key(r, c))
      }
    }
  }

  fits(placement: GridPlacement): boolean {
    const colEnd = placement.colStart + placement.colSpan
    const rowEnd = placement.rowStart + placement.rowSpan
    for (let r = placement.rowStart; r < rowEnd; r++) {
      for (let c = placement.colStart; c < colEnd; c++) {
        if (this.occupied.has(this.key(r, c))) return false
      }
    }
    return true
  }
}

function buildColumnScanOrder(start: number, maxColStart: number): number[] {
  const list: number[] = []
  for (let col = start; col <= maxColStart; col++) list.push(col)
  for (let col = 1; col < start; col++) list.push(col)
  return list
}

/**
 * 使用二维位图加速的放置扫描算法
 * 复杂度从 O(rows × cols × N) 降至 O(rows × cols × span²)
 */
export function findFirstFitPlacement(
  existing: GridPlacement[],
  desired: GridPlacement,
  columnCount: number,
): GridPlacement {
  const normalized = normalizePlacement(desired, columnCount, desired)
  const maxColStart = Math.max(1, columnCount - normalized.colSpan + 1)

  const grid = new OccupancyGrid(columnCount)
  for (const p of existing) grid.mark(p)

  for (let row = normalized.rowStart; row <= MAX_SCAN_ROWS; row++) {
    const scanCols = buildColumnScanOrder(normalized.colStart, maxColStart)
    for (const col of scanCols) {
      const candidate: GridPlacement = {
        ...normalized,
        rowStart: row,
        colStart: col,
      }
      if (grid.fits(candidate)) {
        return candidate
      }
    }
  }

  return normalized
}

export function resolveGridPlacements(
  items: GridPlacementItem[],
  columnCount: number,
): Map<string, GridPlacement> {
  const map = new Map<string, GridPlacement>()
  const grid = new OccupancyGrid(columnCount)
  const placed: GridPlacement[] = []
  const explicitItems = items.filter((item) => item.explicit)
  const autoItems = items.filter((item) => !item.explicit)

  for (const item of [...explicitItems, ...autoItems]) {
    const desired = normalizePlacement(item.placement, columnCount)
    const collision = !grid.fits(desired)
    const resolved = collision ? findFirstFitPlacement(placed, desired, columnCount) : desired
    grid.mark(resolved)
    placed.push(resolved)
    map.set(item.id, resolved)
  }

  return map
}

export function maxOccupiedRow(placements: Iterable<GridPlacement>): number {
  let maxRow = 1
  for (const placement of placements) {
    const occupied = placement.rowStart + placement.rowSpan - 1
    if (occupied > maxRow) maxRow = occupied
  }
  return maxRow
}
