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

import type { MaterialMeta } from '@vela/core/types/material'
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
  Search,
  Upload,
  Files,
  DocumentCopy,
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
 * All category configurations
 */
export const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  图表: { order: 1, defaultWidth: 320, defaultHeight: 200 },
  KPI: { order: 2, defaultWidth: 160, defaultHeight: 100 }, // 兼容旧分类
  数据: { order: 3, defaultWidth: 360, defaultHeight: 240 },
  数据展示: { order: 3, defaultWidth: 360, defaultHeight: 240 }, // 兼容旧分类
  基础组件: { order: 4, defaultWidth: 180, defaultHeight: 50 },
  基础控件: { order: 4, defaultWidth: 180, defaultHeight: 50 }, // 兼容旧分类
  布局容器: { order: 5, defaultWidth: 400, defaultHeight: 240 },
  表单组件: { order: 5, defaultWidth: 200, defaultHeight: 40 },
  内容: { order: 6, defaultWidth: 300, defaultHeight: 200 },
  媒体: { order: 7, defaultWidth: 300, defaultHeight: 200 },
  高级: { order: 8, defaultWidth: 300, defaultHeight: 150 },
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
  return CATEGORY_CONFIG[category] || DEFAULT_CONFIG
}

// ========== Icon Mapping ==========

/**
 * Icon mapping for component types
 * Based on componentName patterns
 */
export function getComponentIcon(componentName: string): Component {
  const name = componentName.toLowerCase()

  if (name.includes('button')) return Pointer
  if (name.includes('input') || name.includes('form')) return EditPen
  if (name.includes('table') || name.includes('list')) return Grid
  if (name.includes('image') || name.includes('video') || name.includes('media')) return Picture
  if (name.includes('chart')) return PieChart
  if (name.includes('histogram') || name.includes('bar')) return Histogram
  if (name.includes('line') || name.includes('trend')) return DataLine
  if (name.includes('container') || name.includes('row') || name.includes('col')) return Files
  if (name.includes('layout') || name.includes('grid')) return Monitor
  if (name.includes('tool') || name.includes('menu')) return Tools

  // Default fallback
  return Box
}

// ========== Category Grouping ==========

/**
 * Group materials with UI metadata
 */
export interface MaterialItem {
  componentName: string
  label: string
  meta: MaterialMeta
  categoryConfig: CategoryConfig
  icon: Component
}

/**
 * Create material item with UI metadata
 */
export function createMaterialItem(meta: MaterialMeta, materials: MaterialMeta[]): MaterialItem {
  const categoryConfig = getCategoryConfig(meta.category || '其他')

  return {
    componentName: meta.componentName,
    label: meta.title,
    meta,
    categoryConfig,
    icon: getComponentIcon(meta.componentName),
  }
}

/**
 * Group materials by category with UI metadata
 */
export function getMaterialsWithUI(meta: MaterialMeta[]): MaterialItem[] {
  return meta.map((item) => createMaterialItem(item, meta))
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
