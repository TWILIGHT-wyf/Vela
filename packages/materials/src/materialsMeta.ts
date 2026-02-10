/**
 * Material Metadata for Editor UI
 *
 * This module provides UI-specific metadata for materials:
 * - Category configuration (order, default sizes)
 * - Icon mappings
 * - Component categorization
 *
 * This is separate from individual component meta.ts files
 * to keep UI concerns isolated from component logic.
 */

import type { MaterialMeta, I18nString } from '@vela/core/types'
import type { Component } from 'vue'
import {
  Pointer,
  EditPen,
  Grid,
  Picture,
  PieChart,
  Monitor,
  Tools,
  DataLine,
  Histogram,
  Box,
  Files,
} from '@element-plus/icons-vue'

// ========== Category Configuration ==========

/**
 * Category configuration for UI display
 */
export interface CategoryConfig {
  order: number // Display order in UI
  defaultWidth: number // Default width when dragged
  defaultHeight: number // Default height when dragged
}

/**
 * Canonical category labels shown in editor.
 * Keep this set small and stable; old labels should go through CATEGORY_ALIASES.
 */
export type CanonicalCategory =
  | '基础'
  | '表单'
  | '布局'
  | '数据'
  | '图表'
  | '导航'
  | 'KPI'
  | '内容'
  | '媒体'
  | '高级'

/**
 * Canonical category configuration used by MaterialPanel ordering.
 */
export const CATEGORY_CONFIG: Record<CanonicalCategory, CategoryConfig> = {
  基础: { order: 1, defaultWidth: 180, defaultHeight: 50 },
  表单: { order: 2, defaultWidth: 200, defaultHeight: 40 },
  布局: { order: 3, defaultWidth: 400, defaultHeight: 240 },
  数据: { order: 4, defaultWidth: 360, defaultHeight: 240 },
  图表: { order: 5, defaultWidth: 320, defaultHeight: 200 },
  导航: { order: 6, defaultWidth: 260, defaultHeight: 40 },
  KPI: { order: 7, defaultWidth: 160, defaultHeight: 100 },
  内容: { order: 8, defaultWidth: 300, defaultHeight: 200 },
  媒体: { order: 9, defaultWidth: 300, defaultHeight: 200 },
  高级: { order: 10, defaultWidth: 300, defaultHeight: 150 },
}

/**
 * Legacy/alias labels -> canonical category labels.
 */
export const CATEGORY_ALIASES: Record<string, CanonicalCategory> = {
  基础组件: '基础',
  基础控件: '基础',
  布局容器: '布局',
  表单组件: '表单',
  数据展示: '数据',
  图表: '图表',
  KPI: 'KPI',
  数据: '数据',
  内容: '内容',
  媒体: '媒体',
  高级: '高级',
  导航: '导航',
  基础: '基础',
  布局: '布局',
  表单: '表单',
}

/**
 * Fallback config for unknown categories
 */
const DEFAULT_CONFIG: CategoryConfig = {
  order: 99,
  defaultWidth: 300,
  defaultHeight: 200,
}

/**
 * Get category configuration by category name
 */
export function getCategoryConfig(category: string): CategoryConfig {
  const normalized = normalizeCategoryName(category)
  return CATEGORY_CONFIG[normalized as CanonicalCategory] || DEFAULT_CONFIG
}

/**
 * Normalize incoming category names to canonical labels.
 */
export function normalizeCategoryName(category: string): string {
  return CATEGORY_ALIASES[category] || category
}

// ========== Icon Mapping ==========

/**
 * Icon mapping for component types
 * Based on component name patterns
 */
export function getComponentIcon(name: string): Component {
  const n = name.toLowerCase()

  if (n.includes('button')) return Pointer
  if (n.includes('input') || n.includes('form')) return EditPen
  if (n.includes('table') || n.includes('list')) return Grid
  if (n.includes('image') || n.includes('video') || n.includes('media')) return Picture
  if (n.includes('chart')) return PieChart
  if (n.includes('histogram') || n.includes('bar')) return Histogram
  if (n.includes('line') || n.includes('trend')) return DataLine
  if (n.includes('container') || n.includes('row') || n.includes('col')) return Files
  if (n.includes('layout') || n.includes('grid')) return Monitor
  if (n.includes('tool') || n.includes('menu')) return Tools

  // Default fallback
  return Box
}

// ========== Category Grouping ==========

/**
 * Group materials with UI metadata
 */
export interface MaterialItem {
  name: string
  label: I18nString
  meta: MaterialMeta
  categoryConfig: CategoryConfig
  icon: Component
}

/**
 * Create material item with UI metadata
 */
export function createMaterialItem(meta: MaterialMeta): MaterialItem {
  const categoryConfig = getCategoryConfig(meta.category || '其他')

  return {
    name: meta.name,
    label: meta.title,
    meta,
    categoryConfig,
    icon: getComponentIcon(meta.name),
  }
}

/**
 * Group materials by category with UI metadata
 */
export function getMaterialsWithUI(meta: MaterialMeta[]): MaterialItem[] {
  return meta.map((item) => createMaterialItem(item))
}

/**
 * Sort categories by configured order
 */
export function sortCategoriesByOrder(grouped: Record<string, MaterialMeta[]>): string[] {
  const categories = Object.keys(grouped)
  const configMap = Object.fromEntries(categories.map((cat) => [cat, getCategoryConfig(cat)]))

  return categories.sort((a, b) => {
    const orderA = configMap[a]?.order ?? 99
    const orderB = configMap[b]?.order ?? 99
    return orderA - orderB
  })
}
