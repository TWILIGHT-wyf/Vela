/**
 * Grid 容器规范化 —— 纯函数，无 Vue / 编辑器依赖
 *
 * 将重复出现在 useComponentTree 和 useComponentStyle 中的
 * normalizeGridContainer / updateContainerLayoutRaw 合并为一个
 * 共享模块，作为 Single Source of Truth。
 */

import type { GridContainerLayout, GridTrack, NodeSchema } from '../types'
import { parseFrTemplate, buildFrTemplate, countTracks } from './grid'

// ─── 常量 ────────────────────────────────────────────────────────────
const DEFAULT_COLUMN_COUNT = 12
const DEFAULT_GAP = 8
const DEFAULT_AUTO_FIT_MIN_WIDTH = 280
const MIN_AUTO_FIT_MIN_WIDTH = 120
const DEFAULT_AUTO_ROWS_MIN = 24

// ─── 工具函数 ────────────────────────────────────────────────────────

/**
 * 生成 auto-fit columns 字符串
 */
export function toAutoFitColumns(minWidth: number): string {
  return `repeat(auto-fit, minmax(${Math.round(minWidth)}px, 1fr))`
}

/**
 * 将 fr 模板字符串解析为 GridTrack 数组
 */
export function frTemplateToTracks(template: string): GridTrack[] {
  return parseFrTemplate(template).map((value) => ({ unit: 'fr' as const, value }))
}

/**
 * 检测 templateMode
 */
export function detectTemplateMode(container: Partial<GridContainerLayout>): 'manual' | 'autoFit' {
  if (container.templateMode === 'autoFit') return 'autoFit'
  if (typeof container.columns === 'string' && container.columns.includes('repeat(auto-fit')) {
    return 'autoFit'
  }
  return container.templateMode || 'manual'
}

/**
 * 解析容器的实际列数
 *
 * 当 autoFit 模式下，由于列数取决于容器实际宽度，放置算法无法精确预知，
 * 因此可通过 containerWidth 参数动态推算（若不传则回退到 DEFAULT_COLUMN_COUNT）。
 */
export function resolveColumnCount(
  container: Partial<GridContainerLayout>,
  templateMode: 'manual' | 'autoFit',
  normalizedColumns: string,
  containerWidth?: number,
): number {
  // 优先使用显式 columnTracks
  if (Array.isArray(container.columnTracks) && container.columnTracks.length > 0) {
    return container.columnTracks.length
  }

  if (templateMode === 'autoFit') {
    // 如果提供了容器宽度，计算实际列数
    const autoFitMinWidth = Math.max(
      MIN_AUTO_FIT_MIN_WIDTH,
      Number(container.autoFitMinWidth ?? DEFAULT_AUTO_FIT_MIN_WIDTH),
    )
    const gap = Number(container.gapX ?? container.gap ?? DEFAULT_GAP)
    if (containerWidth && containerWidth > 0) {
      // 模拟 auto-fit 的列数计算：floor((width + gap) / (minWidth + gap))
      return Math.max(1, Math.floor((containerWidth + gap) / (autoFitMinWidth + gap)))
    }
    return DEFAULT_COLUMN_COUNT
  }

  return Math.max(1, countTracks(normalizedColumns))
}

/**
 * 判断节点是否为容器类型
 *
 * 为避免 @vela/core 依赖 component-registry（来自 contracts），
 * 这里接受一个可选的外部探测函数。
 */
export type ContainerDetector = (node: NodeSchema) => boolean

/** 最小化的容器判断：只看 container.mode 和 children */
export function defaultContainerDetector(node: NodeSchema): boolean {
  const mode = node.container?.mode
  if (mode === 'grid') return true
  return Array.isArray(node.children)
}

// ─── 容器规范化配置 Options ─────────────────────────────────────────

export interface NormalizeGridOptions {
  /** 判断子节点是否为容器型 */
  isContainerNode?: ContainerDetector
  /** 容器实际宽度 (px)，用于 autoFit 模式动态推算列数 */
  containerWidth?: number
  /**
   * 用户显式设定的最小行数，防止自动裁剪破坏用户意图
   * 当提供此值时，最终行数 = max(userMinRows, computedRows)
   */
  userMinRows?: number
}

// ─── 核心规范化函数 ─────────────────────────────────────────────────

/**
 * 规范化 Grid 容器的所有字段。
 *
 * 填写缺省值、修正 columnTracks / rowTracks / gap，
 * 但 **不做** 子项放置解析（resolveGridPlacements）和 sanitize legacy sizing。
 * 这些操作由编辑器层自行处理——此函数仅保证容器数据结构的完整性。
 *
 * @returns 已计算的 { templateMode, normalizedColumns, colCount }，
 *          供调用方后续做放置等逻辑时使用
 */
export function normalizeGridContainerFields(
  container: GridContainerLayout,
  options: NormalizeGridOptions = {},
): {
  templateMode: 'manual' | 'autoFit'
  normalizedColumns: string
  colCount: number
} {
  const templateMode = detectTemplateMode(container)
  const autoFitMinWidth = Math.max(
    MIN_AUTO_FIT_MIN_WIDTH,
    Number(container.autoFitMinWidth ?? DEFAULT_AUTO_FIT_MIN_WIDTH),
  )

  // ── columns ──
  const normalizedColumns =
    templateMode === 'autoFit'
      ? toAutoFitColumns(autoFitMinWidth)
      : typeof container.columns === 'string' && container.columns.trim().length > 0
        ? container.columns
        : Array(DEFAULT_COLUMN_COUNT).fill('1fr').join(' ')

  // ── colCount ──
  const colCount = resolveColumnCount(
    container,
    templateMode,
    normalizedColumns,
    options.containerWidth,
  )

  // ── 回写字段 ──
  container.templateMode = templateMode
  container.autoFitMinWidth = autoFitMinWidth
  container.autoFitDense = container.autoFitDense ?? true
  container.columns = normalizedColumns

  // ── rows ──
  container.rows = templateMode === 'autoFit' ? 'auto' : container.rows || '1fr'

  // ── gap ──
  if (container.gap === undefined) {
    container.gap = DEFAULT_GAP
  }
  container.gapX = container.gapX ?? container.gap ?? DEFAULT_GAP
  container.gapY = container.gapY ?? container.gap ?? DEFAULT_GAP

  // ── columnTracks ──
  container.columnTracks = Array.isArray(container.columnTracks)
    ? container.columnTracks
    : templateMode === 'autoFit'
      ? Array.from({ length: DEFAULT_COLUMN_COUNT }, () => ({ unit: 'fr' as const, value: 1 }))
      : frTemplateToTracks(normalizedColumns)

  // ── rowTracks ──
  if (templateMode === 'autoFit') {
    container.rowTracks = 'auto'
  } else if (container.rowTracks === undefined) {
    container.rowTracks = frTemplateToTracks(container.rows || '1fr')
  }

  // ── 其他默认值 ──
  container.autoFlow = container.autoFlow || 'row'
  container.dense = container.dense ?? true
  container.autoRowsMin = container.autoRowsMin ?? DEFAULT_AUTO_ROWS_MIN

  return { templateMode, normalizedColumns, colCount }
}

/**
 * 根据占用的最大行号同步 rows 模板。
 *
 * @param minRows 用户显式设定的最小行数（保留用户留空行的意图）
 */
export function syncRowsTemplate(
  container: GridContainerLayout,
  maxOccupied: number,
  minRows?: number,
): void {
  if (container.templateMode === 'autoFit' || container.rowTracks === 'auto') return

  const rowValues = parseFrTemplate(container.rows || '1fr')
  const targetRowCount = Math.max(maxOccupied, minRows ?? 1, 1)

  // 只追加不裁剪——保留用户在 targetRowCount 之上手动添加的行
  while (rowValues.length < targetRowCount) {
    rowValues.push(1)
  }
  // 仅当没有用户显式最小行数约束时才裁剪
  if (minRows === undefined) {
    while (rowValues.length > targetRowCount) {
      rowValues.pop()
    }
  }

  container.rows = buildFrTemplate(rowValues)
  container.rowTracks = rowValues.map((value) => ({ unit: 'fr' as const, value }))
}
