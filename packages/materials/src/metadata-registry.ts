import type { MaterialMeta, PropSchema } from '@vela/core/types'
import {
  COMPONENT_ALIASES,
  getComponentDefinition,
  resolveComponentAlias,
} from '@vela/core/contracts'

/**
 * Category configuration with order, label, and default sizes
 */
export interface CategoryConfig {
  order: number
  label: string
  labelEn?: string
  icon?: string
  defaultSize: [number, number] // [width, height]
}

/**
 * Material Registry - Unified metadata management
 *
 * Features:
 * 1. Centralized category configuration
 * 2. Alias management for backward compatibility
 * 3. O(1) lookup by name
 * 4. Category-based filtering and sorting
 */
export class MaterialRegistry {
  private static instance: MaterialRegistry | null = null

  /**
   * Category configuration - single source of truth
   */
  readonly categories: Record<string, CategoryConfig> = {
    chart: {
      order: 1,
      label: '图表',
      labelEn: 'Chart',
      icon: 'chart-line',
      defaultSize: [320, 200],
    },
    kpi: {
      order: 2,
      label: 'KPI',
      labelEn: 'KPI',
      icon: 'dashboard',
      defaultSize: [160, 100],
    },
    data: {
      order: 3,
      label: '数据',
      labelEn: 'Data',
      icon: 'table',
      defaultSize: [360, 240],
    },
    form: {
      order: 4,
      label: '表单',
      labelEn: 'Form',
      icon: 'edit',
      defaultSize: [200, 40],
    },
    layout: {
      order: 5,
      label: '布局',
      labelEn: 'Layout',
      icon: 'layout',
      defaultSize: [400, 300],
    },
    basic: {
      order: 6,
      label: '基础',
      labelEn: 'Basic',
      icon: 'cube',
      defaultSize: [200, 100],
    },
    media: {
      order: 7,
      label: '媒体',
      labelEn: 'Media',
      icon: 'image',
      defaultSize: [320, 180],
    },
    advanced: {
      order: 8,
      label: '高级',
      labelEn: 'Advanced',
      icon: 'code',
      defaultSize: [400, 300],
    },
  }

  /**
   * Alias mapping for backward compatibility
   * Now derived from the unified COMPONENT_ALIASES in @vela/core/contracts
   */
  readonly aliases: Record<string, string> = { ...COMPONENT_ALIASES }

  /**
   * Internal material storage
   */
  private materials = new Map<string, MaterialMeta>()

  /**
   * Category-based index for fast filtering
   */
  private categoryIndex = new Map<string, Set<string>>()

  private constructor() {}

  private toMetaDefaultSize(size: [number, number]): NonNullable<MaterialMeta['defaultSize']> {
    return { width: size[0], height: size[1] }
  }

  private normalizeComponentName(name: string): string {
    const source = name?.trim()
    if (!source) return name

    const aliased = resolveComponentAlias(source)
    const candidates = new Set([
      source,
      aliased,
      source.charAt(0).toLowerCase() + source.slice(1),
      source.charAt(0).toUpperCase() + source.slice(1),
      aliased.charAt(0).toLowerCase() + aliased.slice(1),
      aliased.charAt(0).toUpperCase() + aliased.slice(1),
    ])

    for (const candidate of candidates) {
      const definition = getComponentDefinition(candidate)
      if (definition) {
        return definition.name
      }
    }

    return this.aliases[source] || source
  }

  /**
   * Get singleton instance
   */
  static getInstance(): MaterialRegistry {
    if (!MaterialRegistry.instance) {
      MaterialRegistry.instance = new MaterialRegistry()
    }
    return MaterialRegistry.instance
  }

  /**
   * Resolve component name (handle aliases and casing)
   */
  resolveName(name: string): string {
    return this.normalizeComponentName(name)
  }

  /**
   * Register a material
   */
  register(meta: MaterialMeta): void {
    const name = meta.name || meta.componentName
    if (!name) {
      console.warn('[MaterialRegistry] Cannot register material without name')
      return
    }

    // Normalize the name to core canonical component name
    const normalizedName = this.normalizeComponentName(name)

    // Merge with category defaults
    const category = meta.category?.toLowerCase() || 'basic'
    const categoryConfig = this.categories[category]

    const enhancedMeta: MaterialMeta = {
      ...meta,
      name: normalizedName,
      componentName: normalizedName,
      category: category,
      defaultSize:
        meta.defaultSize || this.toMetaDefaultSize(categoryConfig?.defaultSize || [200, 100]),
    }

    this.materials.set(normalizedName, enhancedMeta)

    // Update category index
    if (!this.categoryIndex.has(category)) {
      this.categoryIndex.set(category, new Set())
    }
    this.categoryIndex.get(category)!.add(normalizedName)
  }

  /**
   * Register multiple materials
   */
  registerAll(metas: MaterialMeta[]): void {
    for (const meta of metas) {
      this.register(meta)
    }
  }

  /**
   * Get a material by name
   */
  get(name: string): MaterialMeta | undefined {
    const resolvedName = this.resolveName(name)
    return this.materials.get(resolvedName)
  }

  /**
   * Check if a material exists
   */
  has(name: string): boolean {
    const resolvedName = this.resolveName(name)
    return this.materials.has(resolvedName)
  }

  /**
   * List all materials, optionally filtered by category
   */
  list(category?: string): MaterialMeta[] {
    if (category) {
      const normalizedCategory = category.toLowerCase()
      const names = this.categoryIndex.get(normalizedCategory)
      if (!names) return []

      return Array.from(names)
        .map((name) => this.materials.get(name)!)
        .filter(Boolean)
    }

    return Array.from(this.materials.values())
  }

  /**
   * Get materials grouped by category with proper ordering
   */
  listGrouped(): Record<string, MaterialMeta[]> {
    const result: Record<string, MaterialMeta[]> = {}

    // Sort categories by order
    const sortedCategories = Object.entries(this.categories)
      .sort(([, a], [, b]) => a.order - b.order)
      .map(([key]) => key)

    for (const category of sortedCategories) {
      const materials = this.list(category)
      if (materials.length > 0) {
        result[category] = materials
      }
    }

    // Add uncategorized materials
    const uncategorized = this.list().filter(
      (m) => !sortedCategories.includes(m.category?.toLowerCase() || ''),
    )
    if (uncategorized.length > 0) {
      result['other'] = uncategorized
    }

    return result
  }

  /**
   * Get all category names with their labels
   */
  getCategories(): Array<{ key: string; config: CategoryConfig }> {
    return Object.entries(this.categories)
      .sort(([, a], [, b]) => a.order - b.order)
      .map(([key, config]) => ({ key, config }))
  }

  /**
   * Get category configuration by key
   */
  getCategory(key: string): CategoryConfig | undefined {
    return this.categories[key.toLowerCase()]
  }

  /**
   * Add a new alias
   */
  addAlias(alias: string, target: string): void {
    this.aliases[alias] = target
  }

  /**
   * Get all aliases
   */
  getAliases(): Record<string, string> {
    return { ...this.aliases }
  }

  /**
   * Clear all registered materials
   */
  clear(): void {
    this.materials.clear()
    this.categoryIndex.clear()
  }

  /**
   * Get default props from material meta
   */
  getDefaultProps(name: string): Record<string, unknown> {
    const meta = this.get(name)
    if (!meta?.props) return {}
    return extractDefaultProps(meta.props)
  }

  /**
   * Get default size for a material
   */
  getDefaultSize(name: string): NonNullable<MaterialMeta['defaultSize']> {
    const meta = this.get(name)
    if (meta?.defaultSize) {
      return meta.defaultSize
    }

    const category = meta?.category?.toLowerCase() || 'basic'
    return this.toMetaDefaultSize(this.categories[category]?.defaultSize || [200, 100])
  }
}

/**
 * Extract default values from prop schemas
 */
export function extractDefaultProps(
  props: MaterialMeta['props'] | PropSchema[],
): Record<string, unknown> {
  const defaults: Record<string, unknown> = {}

  // Normalize to array
  const propList: PropSchema[] = Array.isArray(props)
    ? props
    : Object.values(props as Record<string, PropSchema>)

  for (const prop of propList) {
    let value = prop.defaultValue

    // Recursively handle ObjectSetter nested properties
    if (prop.setter === 'ObjectSetter' && prop.properties) {
      const subDefaults = extractDefaultProps(prop.properties)
      if (typeof value === 'object' && value !== null) {
        value = { ...subDefaults, ...value }
      } else if (Object.keys(subDefaults).length > 0) {
        value = subDefaults
      }
    }

    if (value !== undefined) {
      defaults[prop.name] = value
    }
  }

  return defaults
}

/**
 * Global singleton instance
 */
export const materialRegistry = MaterialRegistry.getInstance()

/**
 * Convenience function to register a material
 */
export function registerMaterial(meta: MaterialMeta): void {
  materialRegistry.register(meta)
}

/**
 * Convenience function to get a material
 */
export function getMaterial(name: string): MaterialMeta | undefined {
  return materialRegistry.get(name)
}

/**
 * Convenience function to list materials
 */
export function listMaterials(category?: string): MaterialMeta[] {
  return materialRegistry.list(category)
}
