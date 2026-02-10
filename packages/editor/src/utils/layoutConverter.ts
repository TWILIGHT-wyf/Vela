import type { LayoutMode, GridNodeGeometry, NodeSchema } from '@vela/core'
import { cloneDeep } from 'lodash-es'

/**
 * 需要从 Flow 模式中移除的样式属性
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
 * 块级组件列表 - 这些组件在 Flow 模式下应该是 width: 100%
 */
const BLOCK_COMPONENTS = ['Container', 'Page', 'Row', 'Col', 'Panel', 'Card', 'Form', 'Table']
const DEFAULT_GRID_COLUMNS = 12
const DEFAULT_GRID_COL_SPAN = 3
const DEFAULT_GRID_ROW_SPAN = 4
const GRID_COL_PIXEL = 160
const GRID_ROW_PIXEL = 36

/**
 * 从 style 字符串中提取数值（如 "100px" -> 100）
 */
function parseStyleValue(value: string | number | undefined): number {
  if (value === undefined || value === null) return 0
  if (typeof value === 'number') return value
  const num = parseFloat(value)
  return isNaN(num) ? 0 : num
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

      // Grid composition defaults: every node has explicit span metadata.
      if (!node.style.gridColumn) {
        const defaultColSpan = BLOCK_COMPONENTS.includes(getNodeComponentName(node))
          ? DEFAULT_GRID_COLUMNS
          : toGridSpan(widthSource, DEFAULT_GRID_COL_SPAN, GRID_COL_PIXEL, DEFAULT_GRID_COLUMNS)
        node.style.gridColumn = `span ${defaultColSpan}`
      }
      if (!node.style.gridRow) {
        node.style.gridRow = `span ${toGridSpan(heightSource, DEFAULT_GRID_ROW_SPAN, GRID_ROW_PIXEL, 24)}`
      }

      // In grid mode, nodes fill their allocated cells.
      node.style.width = '100%'
      if (node.style.height && node.style.minHeight === undefined) {
        node.style.minHeight = node.style.height
      }
      delete node.style.height
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
          const gridColSpan = parseGridSpanValue(child.style?.gridColumn, DEFAULT_GRID_COL_SPAN)
          const gridRowSpan = parseGridSpanValue(child.style?.gridRow, DEFAULT_GRID_ROW_SPAN)
          const widthRaw = child.style?.width
          const heightRaw = child.style?.height
          const styleWidth =
            typeof widthRaw === 'number'
              ? widthRaw
              : typeof widthRaw === 'string' && /^\d+(\.\d+)?px$/.test(widthRaw.trim())
                ? parseStyleValue(widthRaw)
                : 0
          const styleHeight =
            typeof heightRaw === 'number'
              ? heightRaw
              : typeof heightRaw === 'string' && /^\d+(\.\d+)?px$/.test(heightRaw.trim())
                ? parseStyleValue(heightRaw)
                : 0
          const inferredWidth = styleWidth > 0 ? styleWidth : gridColSpan * GRID_COL_PIXEL
          const inferredHeight = styleHeight > 0 ? styleHeight : gridRowSpan * GRID_ROW_PIXEL
          child.geometry = {
            mode: 'free',
            x: existingFree?.x ?? OFFSET_X + index * OFFSET_X,
            y: existingFree?.y ?? OFFSET_Y + index * OFFSET_Y,
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

          if (child.style) {
            delete child.style.gridColumn
            delete child.style.gridRow
          }
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
 * 组件以 fr 比例填满画布，支持嵌套子网格
 */
export function convertToGrid(root: NodeSchema): NodeSchema {
  const cloned = cloneDeep(root)

  function processNode(node: NodeSchema, parentLayout: LayoutMode = 'grid'): void {
    if (!node.style) node.style = {}

    const childLayout = getContainerMode(node, parentLayout)
    const children = node.children ?? []

    if (childLayout === 'grid') {
      // Set this node as a grid container
      const rowCount = Math.max(children.length, 1)
      node.container = {
        mode: 'grid',
        columns: '1fr',
        rows: Array(rowCount).fill('1fr').join(' '),
        gap: 8,
      } as NodeSchema['container']

      children.forEach((child, index) => {
        if (!child.style) child.style = {}

        // Strip free-only and flow-span styles
        for (const prop of FREE_ONLY_STYLES) {
          delete child.style[prop]
        }
        delete child.style.gridColumn
        delete child.style.gridRow

        // Size fills the cell
        child.style.width = '100%'
        if (child.style.height && child.style.minHeight === undefined) {
          child.style.minHeight = child.style.height
        }
        delete child.style.height

        // Assign grid geometry: single column, one row per child
        child.geometry = {
          mode: 'grid',
          gridColumnStart: 1,
          gridColumnEnd: 2,
          gridRowStart: index + 1,
          gridRowEnd: index + 2,
        } as GridNodeGeometry

        processNode(child, childLayout)
      })
    } else {
      for (const child of children) {
        processNode(child, childLayout)
      }
    }
  }

  // Sort children by Y coordinate before converting (same as convertToFlow)
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
      return topA - topB
    })
  }

  // Set root as grid container
  const rootRowCount = Math.max(cloned.children?.length ?? 0, 1)
  cloned.container = {
    mode: 'grid',
    columns: '1fr',
    rows: Array(rootRowCount).fill('1fr').join(' '),
    gap: 8,
  } as NodeSchema['container']

  processNode(cloned, 'grid')
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
