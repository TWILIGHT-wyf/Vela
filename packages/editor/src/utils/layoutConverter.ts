import type { LayoutMode, NodeSchema } from '@vela/core'
import { countTracks, type GridContainerLayout } from '@vela/core'
import { cloneDeep } from 'lodash-es'
import {
  maxOccupiedRow,
  nodeToPlacement,
  resolveGridPlacements,
  writePlacementToNode,
  type GridPlacement,
} from './gridPlacement'

/**
 * 需要从自由布局中移除的样式属性
 */
const FREE_ONLY_STYLES = [
  'position',
  'left',
  'top',
  'right',
  'bottom',
  'zIndex',
  'transform',
] as const

/**
 * 块级组件列表 - 在网格模式下默认占满整行
 */
const BLOCK_COMPONENTS = ['Container', 'Page', 'Row', 'Col', 'Panel', 'Card', 'Form', 'Table']

const DEFAULT_GRID_COLUMNS = 12
const DEFAULT_GRID_COL_SPAN = 3
const DEFAULT_GRID_ROW_SPAN = 2
const GRID_COL_PIXEL = 160
const GRID_ROW_PIXEL = 36
const GRID_GAP = 8

function buildDefaultColumnTemplate(colCount: number = DEFAULT_GRID_COLUMNS): string {
  return Array(Math.max(1, colCount)).fill('1fr').join(' ')
}

/**
 * 从 style 字符串中提取数值（如 "100px" -> 100）
 */
function parseStyleValue(value: string | number | undefined): number {
  if (value === undefined || value === null) return 0
  if (typeof value === 'number') return value
  const num = Number.parseFloat(value)
  return Number.isFinite(num) ? num : 0
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function toGridSpan(
  value: string | number | undefined,
  fallback: number,
  unitSize: number,
  maxSpan: number,
): number {
  const parsed = parseStyleValue(value)
  if (parsed <= 0) return fallback
  return clamp(Math.round(parsed / unitSize), 1, maxSpan)
}

function parseGridSpanValue(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return clamp(Math.round(value), 1, 48)
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    const spanMatch = trimmed.match(/^span\s+(\d+)$/i)
    if (spanMatch) {
      return clamp(Number.parseInt(spanMatch[1], 10), 1, 48)
    }
    const parsed = Number.parseFloat(trimmed)
    if (Number.isFinite(parsed) && parsed > 0) {
      return clamp(Math.round(parsed), 1, 48)
    }
  }
  return fallback
}

function getNodeComponentName(node: NodeSchema): string {
  return node.component || node.componentName || ''
}

function getContainerMode(node: NodeSchema, parentMode: LayoutMode): LayoutMode {
  return node.container?.mode || parentMode
}

function getGeometryAsPlacement(
  node: NodeSchema,
  colCount: number,
  fallbackRow: number,
): Partial<GridPlacement> {
  if (node.layoutItem?.mode === 'grid') {
    return nodeToPlacement(node, colCount)
  }

  if (node.geometry?.mode === 'grid') {
    return nodeToPlacement(node, colCount)
  }

  if (node.geometry?.mode === 'free') {
    const free = node.geometry
    const colStart = Math.max(1, Math.round((free.x ?? 0) / GRID_COL_PIXEL) + 1)
    const rowStart = Math.max(1, Math.round((free.y ?? 0) / GRID_ROW_PIXEL) + 1)
    const width = (free.width ?? node.style?.width) as number | string | undefined
    const height = (free.height ?? node.style?.height) as number | string | undefined
    const colSpan = toGridSpan(width, DEFAULT_GRID_COL_SPAN, GRID_COL_PIXEL, colCount)
    const rowSpan = toGridSpan(height, DEFAULT_GRID_ROW_SPAN, GRID_ROW_PIXEL, 48)
    return { colStart, colSpan, rowStart, rowSpan }
  }

  const style = node.style || {}
  const width = style.width as string | number | undefined
  const height = (style.height ?? style.minHeight) as string | number | undefined
  const defaultColSpan = BLOCK_COMPONENTS.includes(getNodeComponentName(node))
    ? colCount
    : toGridSpan(width, DEFAULT_GRID_COL_SPAN, GRID_COL_PIXEL, colCount)
  const colSpan = parseGridSpanValue(style.gridColumn, defaultColSpan)
  const rowSpan = parseGridSpanValue(
    style.gridRow,
    toGridSpan(height, DEFAULT_GRID_ROW_SPAN, GRID_ROW_PIXEL, 48),
  )
  return {
    colStart: 1,
    colSpan,
    rowStart: fallbackRow,
    rowSpan,
  }
}

function normalizeGridChildren(node: NodeSchema, parentLayout: LayoutMode): void {
  if (!node.style) node.style = {}

  const childLayout = getContainerMode(node, parentLayout)
  if (!node.children || node.children.length === 0) return

  if (childLayout === 'grid') {
    const container = (node.container || {}) as GridContainerLayout
    const columns =
      typeof container.columns === 'string' && container.columns.trim().length > 0
        ? container.columns
        : buildDefaultColumnTemplate()
    const colCount = Math.max(1, countTracks(columns))

    node.container = {
      ...container,
      mode: 'grid',
      columns,
      gap: typeof container.gap === 'number' ? container.gap : GRID_GAP,
      autoFlow: container.autoFlow || 'row',
      dense: container.dense ?? true,
      autoRowsMin: container.autoRowsMin ?? 24,
      rows: container.rows || '1fr',
    }

    const placementMap = resolveGridPlacements(
      node.children.map((child, index) => ({
        id: child.id,
        placement: getGeometryAsPlacement(child, colCount, index + 1),
      })),
      colCount,
    )

    for (const child of node.children) {
      const placement = placementMap.get(child.id)
      if (placement) {
        writePlacementToNode(child, placement)
      }

      if (!child.style) child.style = {}
      for (const prop of FREE_ONLY_STYLES) {
        delete child.style[prop]
      }
      delete child.style.gridColumn
      delete child.style.gridRow

      normalizeGridChildren(child, childLayout)
    }

    const maxRow = maxOccupiedRow(placementMap.values())
    const gridContainer = node.container as GridContainerLayout
    gridContainer.rows = Array(maxRow).fill('1fr').join(' ')
    return
  }

  for (const child of node.children) {
    normalizeGridChildren(child, childLayout)
  }
}

/**
 * 将组件树转换为流式布局（Flow）
 */
export function convertToFlow(root: NodeSchema): NodeSchema {
  const cloned = cloneDeep(root)
  cloned.container = {
    ...(cloned.container || {}),
    mode: 'flow',
  }

  function processNode(node: NodeSchema, parentLayout: LayoutMode = 'flow'): void {
    if (!node.style) {
      node.style = {}
    }

    if (parentLayout === 'flow' && node.style) {
      for (const prop of FREE_ONLY_STYLES) {
        delete node.style[prop]
      }

      const widthSource =
        node.geometry?.mode === 'free'
          ? node.geometry.width
          : (node.style.width as string | number | undefined)
      const heightSource =
        node.geometry?.mode === 'free'
          ? node.geometry.height
          : ((node.style.height ?? node.style.minHeight) as string | number | undefined)

      if (!node.style.gridColumn) {
        const defaultColSpan = BLOCK_COMPONENTS.includes(getNodeComponentName(node))
          ? DEFAULT_GRID_COLUMNS
          : toGridSpan(widthSource, DEFAULT_GRID_COL_SPAN, GRID_COL_PIXEL, DEFAULT_GRID_COLUMNS)
        node.style.gridColumn = `span ${defaultColSpan}`
      }
      if (!node.style.gridRow) {
        node.style.gridRow = `span ${toGridSpan(heightSource, DEFAULT_GRID_ROW_SPAN, GRID_ROW_PIXEL, 24)}`
      }
    }

    if (node.geometry?.mode === 'free') {
      node.geometry = {
        mode: 'flow',
        width: node.geometry.width,
        height: node.geometry.height,
        minWidth: node.geometry.minWidth,
        maxWidth: node.geometry.maxWidth,
        minHeight: node.geometry.minHeight,
        maxHeight: node.geometry.maxHeight,
      }
    }

    const childLayout = getContainerMode(node, parentLayout)
    if (node.children && Array.isArray(node.children) && node.children.length > 0) {
      if (childLayout === 'flow') {
        node.children.sort((a, b) => {
          const topA =
            a.geometry?.mode === 'free'
              ? (a.geometry.y ?? 0)
              : parseStyleValue(a.style?.top as string | number | undefined)
          const topB =
            b.geometry?.mode === 'free'
              ? (b.geometry.y ?? 0)
              : parseStyleValue(b.style?.top as string | number | undefined)
          return topA - topB
        })
      }

      for (const child of node.children) {
        processNode(child, childLayout)
      }
    }
  }

  processNode(cloned, 'flow')
  return cloned
}

/**
 * 将组件树转换为自由布局（Free）
 */
export function convertToFree(root: NodeSchema): NodeSchema {
  const cloned = cloneDeep(root)
  cloned.container = {
    ...(cloned.container || {}),
    mode: 'free',
  }

  const OFFSET_X = 20
  const OFFSET_Y = 50
  const DEFAULT_WIDTH = 200
  const DEFAULT_HEIGHT = 100

  function processNode(node: NodeSchema, parentLayout: LayoutMode = 'flow'): void {
    if (!node.style) {
      node.style = {}
    }

    if (getNodeComponentName(node) === 'Page') {
      node.style.width = '100%'
      node.style.height = '100%'
    }

    const childLayout = getContainerMode(node, parentLayout)

    if (node.children && Array.isArray(node.children) && node.children.length > 0) {
      node.children.forEach((child, index) => {
        if (!child.style) {
          child.style = {}
        }

        if (childLayout === 'free') {
          const prevGeometry = child.geometry
          const existingFree = prevGeometry?.mode === 'free' ? prevGeometry : undefined
          const styleWidthRaw = child.style?.width
          const styleHeightRaw = child.style?.height
          const styleWidth =
            typeof styleWidthRaw === 'number'
              ? styleWidthRaw
              : typeof styleWidthRaw === 'string' && /^\d+(\.\d+)?px$/.test(styleWidthRaw.trim())
                ? parseStyleValue(styleWidthRaw)
                : 0
          const styleHeight =
            typeof styleHeightRaw === 'number'
              ? styleHeightRaw
              : typeof styleHeightRaw === 'string' && /^\d+(\.\d+)?px$/.test(styleHeightRaw.trim())
                ? parseStyleValue(styleHeightRaw)
                : 0

          let gridColSpan = parseGridSpanValue(child.style?.gridColumn, DEFAULT_GRID_COL_SPAN)
          let gridRowSpan = parseGridSpanValue(child.style?.gridRow, DEFAULT_GRID_ROW_SPAN)
          let x = OFFSET_X + index * OFFSET_X
          let y = OFFSET_Y + index * OFFSET_Y

          if (prevGeometry?.mode === 'grid') {
            const placement = nodeToPlacement(
              { geometry: prevGeometry, layoutItem: child.layoutItem },
              DEFAULT_GRID_COLUMNS,
            )
            gridColSpan = placement.colSpan
            gridRowSpan = placement.rowSpan
            x = (placement.colStart - 1) * GRID_COL_PIXEL + OFFSET_X
            y = (placement.rowStart - 1) * GRID_ROW_PIXEL + OFFSET_Y
          }

          const inferredWidth = styleWidth > 0 ? styleWidth : gridColSpan * GRID_COL_PIXEL
          const inferredHeight = styleHeight > 0 ? styleHeight : gridRowSpan * GRID_ROW_PIXEL

          child.geometry = {
            mode: 'free',
            x: existingFree?.x ?? x,
            y: existingFree?.y ?? y,
            width: existingFree?.width ?? inferredWidth ?? DEFAULT_WIDTH,
            height: existingFree?.height ?? inferredHeight ?? DEFAULT_HEIGHT,
            minWidth: existingFree?.minWidth,
            maxWidth: existingFree?.maxWidth,
            minHeight: existingFree?.minHeight,
            maxHeight: existingFree?.maxHeight,
            zIndex: existingFree?.zIndex ?? index + 1,
            rotate: existingFree?.rotate,
            scaleX: existingFree?.scaleX,
            scaleY: existingFree?.scaleY,
            locked: existingFree?.locked,
            hidden: existingFree?.hidden,
          }

          delete child.style.gridColumn
          delete child.style.gridRow
        }

        processNode(child, childLayout)
      })
    }
  }

  processNode(cloned, 'free')
  return cloned
}

/**
 * 将组件树转换为自适应网格布局（Grid）
 */
export function convertToGrid(root: NodeSchema): NodeSchema {
  const cloned = cloneDeep(root)

  if (cloned.children && Array.isArray(cloned.children) && cloned.children.length > 0) {
    cloned.children.sort((a, b) => {
      const topA =
        a.geometry?.mode === 'free'
          ? (a.geometry.y ?? 0)
          : parseStyleValue(a.style?.top as string | number | undefined)
      const topB =
        b.geometry?.mode === 'free'
          ? (b.geometry.y ?? 0)
          : parseStyleValue(b.style?.top as string | number | undefined)
      if (topA !== topB) return topA - topB

      const leftA =
        a.geometry?.mode === 'free'
          ? (a.geometry.x ?? 0)
          : parseStyleValue(a.style?.left as string | number | undefined)
      const leftB =
        b.geometry?.mode === 'free'
          ? (b.geometry.x ?? 0)
          : parseStyleValue(b.style?.left as string | number | undefined)
      return leftA - leftB
    })
  }

  cloned.container = {
    ...(cloned.container || {}),
    mode: 'grid',
    columns: buildDefaultColumnTemplate(),
    rows: '1fr',
    gap: GRID_GAP,
    autoFlow: 'row',
    dense: true,
    autoRowsMin: 24,
  }

  normalizeGridChildren(cloned, 'grid')
  return cloned
}

/**
 * 根据目标模式转换布局
 */
export function convertLayout(root: NodeSchema, targetMode: LayoutMode): NodeSchema {
  if (targetMode === 'flow') return convertToFlow(root)
  if (targetMode === 'grid') return convertToGrid(root)
  return convertToFree(root)
}

/**
 * 检查节点是否包含自由布局特征
 */
export function hasFreeLayoutStyles(node: NodeSchema): boolean {
  if (node.geometry?.mode === 'free') {
    return true
  }
  return !!(node.style?.left || node.style?.top)
}

/**
 * 检测当前树的布局模式（优先根容器配置）
 */
export function detectLayoutMode(root: NodeSchema): LayoutMode {
  if (root.container?.mode === 'free') {
    return 'free'
  }
  if (root.container?.mode === 'flow' || root.container?.mode === 'grid') {
    return 'grid'
  }

  if (!root.children || root.children.length === 0) {
    return 'grid'
  }

  const firstChild = root.children[0]
  return hasFreeLayoutStyles(firstChild) ? 'free' : 'grid'
}
