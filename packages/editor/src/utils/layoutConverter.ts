import type { LayoutMode, NodeSchema } from '@vela/core'
import { cloneDeep } from 'lodash-es'

/**
 * 需要从 Flow 模式中移除的样式属性
 */
const FREE_ONLY_STYLES = ['position', 'left', 'top', 'right', 'bottom', 'zIndex', 'transform'] as const

/**
 * 块级组件列表 - 这些组件在 Flow 模式下应该是 width: 100%
 */
const BLOCK_COMPONENTS = ['Container', 'Page', 'Row', 'Col', 'Panel', 'Card', 'Form', 'Table']

/**
 * 从 style 字符串中提取数值（如 "100px" -> 100）
 */
function parseStyleValue(value: string | number | undefined): number {
  if (value === undefined || value === null) return 0
  if (typeof value === 'number') return value
  const num = parseFloat(value)
  return isNaN(num) ? 0 : num
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
    if (parentLayout === 'flow' && node.style) {
      for (const prop of FREE_ONLY_STYLES) {
        delete node.style[prop]
      }

      if (BLOCK_COMPONENTS.includes(getNodeComponentName(node))) {
        node.style.width = '100%'
        if (node.style.height && node.children && node.children.length > 0) {
          node.style.minHeight = node.style.height
          delete node.style.height
        }
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
              ? a.geometry.y ?? 0
              : parseStyleValue(a.style?.top as string | number | undefined)
          const topB =
            b.geometry?.mode === 'free'
              ? b.geometry.y ?? 0
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
          child.geometry = {
            mode: 'free',
            x: existingFree?.x ?? OFFSET_X + index * OFFSET_X,
            y: existingFree?.y ?? OFFSET_Y + index * OFFSET_Y,
            width: existingFree?.width ?? child.style.width ?? DEFAULT_WIDTH,
            height: existingFree?.height ?? child.style.height ?? DEFAULT_HEIGHT,
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
        }

        processNode(child, childLayout)
      })
    }
  }

  processNode(cloned, 'free')
  return cloned
}

/**
 * 根据目标模式转换布局
 */
export function convertLayout(root: NodeSchema, targetMode: LayoutMode): NodeSchema {
  return targetMode === 'flow' ? convertToFlow(root) : convertToFree(root)
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
  if (root.container?.mode) {
    return root.container.mode
  }

  if (!root.children || root.children.length === 0) {
    return 'flow'
  }

  const firstChild = root.children[0]
  return hasFreeLayoutStyles(firstChild) ? 'free' : 'flow'
}
