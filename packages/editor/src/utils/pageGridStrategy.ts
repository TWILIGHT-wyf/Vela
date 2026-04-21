import type { GridContainerLayout, NodeSchema } from '@vela/core'

export const PAGE_ROOT_COLUMN_COUNT = 12
export const ROOT_SECTION_CONTAINER_ROW_SPAN = 4
export const ROOT_SECTION_ITEM_ROW_SPAN = 2
export const NESTED_CONTAINER_ROW_SPAN = 4
export const NESTED_ITEM_ROW_SPAN = 2

export function isPageRootNode(parent: NodeSchema, rootNode: NodeSchema | null | undefined): boolean {
  return Boolean(rootNode && parent.id === rootNode.id)
}

export function resolveEditorGridSpan(options: {
  colCount: number
  isContainer: boolean
  isPageRoot: boolean
  templateMode?: GridContainerLayout['templateMode']
}): { colSpan: number; rowSpan: number } {
  const safeColCount = Math.max(1, options.colCount)

  if (options.isPageRoot) {
    if (options.isContainer) {
      return {
        colSpan: safeColCount,
        rowSpan: ROOT_SECTION_CONTAINER_ROW_SPAN,
      }
    }

    return {
      colSpan: Math.min(safeColCount, Math.max(4, Math.ceil(safeColCount / 2))),
      rowSpan: ROOT_SECTION_ITEM_ROW_SPAN,
    }
  }

  if (options.isContainer) {
    return {
      colSpan: options.templateMode === 'autoFit' ? 1 : Math.min(6, safeColCount),
      rowSpan: NESTED_CONTAINER_ROW_SPAN,
    }
  }

  return {
    colSpan: Math.min(3, safeColCount),
    rowSpan: NESTED_ITEM_ROW_SPAN,
  }
}
