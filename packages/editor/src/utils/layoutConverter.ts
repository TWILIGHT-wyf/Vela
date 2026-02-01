import type { NodeSchema } from '@vela/core'
import { cloneDeep } from 'lodash-es'

export type LayoutMode = 'free' | 'flow'

/**
 * 需要从 Flow 模式中移除的样式属性
 */
const FREE_ONLY_STYLES = [
  'position',
  'x',
  'y',
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

/**
 * 从 style 字符串中提取数值（如 "100px" -> 100）
 */
function parseStyleValue(value: string | number | undefined): number {
  if (value === undefined || value === null) return 0
  if (typeof value === 'number') return value
  const num = parseFloat(value)
  return isNaN(num) ? 0 : num
}

/**
 * 将组件树转换为流式布局（Flow）
 *
 * 转换规则：
 * 1. 移除绝对定位相关样式（position, left, top, right, bottom, zIndex, transform）
 * 2. 根据原 top 值对同级子节点排序，保持视觉顺序
 * 3. 块级组件的 width 重置为 100%
 * 4. 保留其他样式属性（如 backgroundColor, border 等）
 */
export function convertToFlow(root: NodeSchema): NodeSchema {
  const cloned = cloneDeep(root)

  function processNode(node: NodeSchema, parentLayout: LayoutMode = 'flow'): void {
    if (parentLayout === 'flow' && node.style) {
      for (const prop of FREE_ONLY_STYLES) {
        delete node.style[prop]
      }

      if (BLOCK_COMPONENTS.includes(node.componentName)) {
        node.style.width = '100%'
        if (node.style.height && node.children && node.children.length > 0) {
          node.style.minHeight = node.style.height
          delete node.style.height
        }
      }
    }

    const childLayout = (node.layoutMode as LayoutMode | undefined) || parentLayout
    if (node.children && Array.isArray(node.children) && node.children.length > 0) {
      if (childLayout === 'flow') {
        node.children.sort((a, b) => {
          const topA = parseStyleValue(a.style?.y ?? a.style?.top)
          const topB = parseStyleValue(b.style?.y ?? b.style?.top)
          return topA - topB
        })
      }

      for (const child of node.children) {
        processNode(child, childLayout)
      }
    }
  }

  processNode(cloned, 'flow')

  console.log('[LayoutConverter] Converted to Flow mode:', cloned)
  return cloned
}

/**
 * 将组件树转换为自由布局（Free）
 *
 * 转换规则：
 * 1. 添加 position: absolute
 * 2. 根据索引设置初始位置（错开排列，避免重叠）
 * 3. 保留原有的宽高数据
 * 4. 设置初始 zIndex
 */
export function convertToFree(root: NodeSchema): NodeSchema {
  const cloned = cloneDeep(root)

  // 用于跟踪当前层级的位置偏移
  const OFFSET_X = 20
  const OFFSET_Y = 50
  const DEFAULT_WIDTH = 200
  const DEFAULT_HEIGHT = 100

  function processNode(
    node: NodeSchema,
    parentLayout: LayoutMode = 'flow',
    depth: number = 0,
  ): void {
    // 初始化 style
    if (!node.style) {
      node.style = {}
    }

    // Page 根节点不需要绝对定位
    if (node.componentName === 'Page') {
      node.style.width = '100%'
      node.style.height = '100%'
    }

    // 处理子节点
    const childLayout = (node.layoutMode as LayoutMode | undefined) || parentLayout

    if (node.children && Array.isArray(node.children) && node.children.length > 0) {
      node.children.forEach((child, index) => {
        if (!child.style) {
          child.style = {}
        }

        if (childLayout === 'free') {
          if (child.style.x === undefined) {
            child.style.x = OFFSET_X + index * OFFSET_X
          }
          if (child.style.y === undefined) {
            child.style.y = OFFSET_Y + index * OFFSET_Y
          }

          if (!child.style.width) {
            child.style.width = DEFAULT_WIDTH
          }
          if (!child.style.height) {
            child.style.height = DEFAULT_HEIGHT
          }

          if (child.style.zIndex === undefined) {
            child.style.zIndex = index + 1
          }
        }

        // 递归处理
        processNode(child, childLayout, depth + 1)
      })
    }
  }

  processNode(cloned, 'free')

  console.log('[LayoutConverter] Converted to Free mode:', cloned)
  return cloned
}

/**
 * 根据目标模式转换布局
 */
export function convertLayout(root: NodeSchema, targetMode: LayoutMode): NodeSchema {
  const converted = targetMode === 'flow' ? convertToFlow(root) : convertToFree(root)
  converted.layoutMode = targetMode
  return converted
}

/**
 * 检查节点是否包含自由布局特有的样式
 */
export function hasFreeLayoutStyles(node: NodeSchema): boolean {
  if (!node.style) return false
  return (
    node.style.x !== undefined || node.style.y !== undefined || node.style.left || node.style.top
  )
}

/**
 * 检测当前树的布局模式（基于第一层子节点）
 */
export function detectLayoutMode(root: NodeSchema): LayoutMode {
  if (!root.children || root.children.length === 0) {
    return 'flow' // 默认流式
  }

  // 检查第一个子节点
  const firstChild = root.children[0]
  return hasFreeLayoutStyles(firstChild) ? 'free' : 'flow'
}
