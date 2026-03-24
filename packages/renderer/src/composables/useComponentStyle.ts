import { computed, type Ref, type ComputedRef, unref, type CSSProperties, watch } from 'vue'
import {
  extractSize,
  extractRotation,
  extractZIndex,
  isNodeLocked,
  isNodeVisible,
  generateLayoutCSS,
  generateVisualCSS,
  generateAnimationCSS,
  type NodeSchema,
  type NodeStyle,
} from '@vela/core'

export type ComponentCSSStyle = CSSProperties

export interface UseComponentStyleOptions {
  includeLayout?: boolean
  includeAnimation?: boolean
  /** Enable granular caching for better performance */
  enableCache?: boolean
}

/**
 * Style cache entry
 */
interface StyleCacheEntry {
  key: string
  value: CSSProperties
}

function inferLayoutMode(
  style: NodeStyle | undefined,
  geometry: NodeSchema['geometry'] | undefined,
): 'grid' {
  void style
  return geometry?.mode === 'grid' ? 'grid' : 'grid'
}

/**
 * Generate a cache key from style properties
 */
function generateCacheKey(style: NodeStyle | undefined, prefix: string): string {
  if (!style) return `${prefix}:empty`
  return `${prefix}:${JSON.stringify(style)}`
}

/**
 * Unified composable for generating component styles from NodeSchema
 * (Renderer Version)
 *
 * Performance optimizations:
 * 1. Granular computed properties - only recalculate affected parts
 * 2. ShallowRef for style objects - reduce reactive overhead
 * 3. Memoization with cache keys - skip identical calculations
 * 4. Separated concerns - position/size/visual/animation
 */
export function useComponentStyle(
  nodeOrStyle:
    | Ref<NodeSchema | undefined>
    | Ref<NodeStyle | undefined>
    | ComputedRef<NodeSchema | undefined>
    | ComputedRef<NodeStyle | undefined>
    | NodeSchema
    | NodeStyle
    | undefined,
  options: UseComponentStyleOptions = {},
) {
  const { includeLayout = true, includeAnimation = true, enableCache = true } = options

  // Style cache for memoization
  const styleCache = new Map<string, StyleCacheEntry>()

  const styleRef = computed(() => {
    const value = unref(nodeOrStyle)
    if (!value) return undefined
    if ('component' in value || 'componentName' in value) {
      return (value as NodeSchema).style
    }
    return value as NodeStyle
  })

  const geometryRef = computed(() => {
    const value = unref(nodeOrStyle)
    if (!value) return undefined
    if ('component' in value || 'componentName' in value) {
      return (value as NodeSchema).geometry
    }
    return undefined
  })

  const animationRef = computed(() => {
    const value = unref(nodeOrStyle)
    if (!value) return undefined
    if ('component' in value || 'componentName' in value) {
      return (value as NodeSchema).animation
    }
    return undefined
  })

  const layoutMode = computed<'grid'>(() => inferLayoutMode(styleRef.value, geometryRef.value))

  // ========== Granular Layout Properties ==========

  // Size (width, height) - only recalculates when size changes
  const size = computed(() => extractSize(styleRef.value, geometryRef.value))

  // Rotation - only recalculates when rotation changes
  const rotation = computed(() => extractRotation(styleRef.value, geometryRef.value))

  // Z-Index - only recalculates when zIndex changes
  const zIndex = computed(() => extractZIndex(styleRef.value))

  // Lock state
  const locked = computed(() => isNodeLocked(styleRef.value, geometryRef.value))

  // Visibility state
  const visible = computed(() => isNodeVisible(styleRef.value, geometryRef.value))

  // ========== Cached Style Computations ==========

  // Size style (width, height)
  const sizeStyle = computed<CSSProperties>(() => {
    const style = styleRef.value
    if (!style) return {}

    const cacheKey = `size:${style.width}:${style.height}`
    if (enableCache && styleCache.has(cacheKey)) {
      return styleCache.get(cacheKey)!.value
    }

    const result: CSSProperties = {}
    if (style.width != null) {
      result.width = typeof style.width === 'number' ? `${style.width}px` : style.width
    }
    if (style.height != null) {
      result.height = typeof style.height === 'number' ? `${style.height}px` : style.height
    }

    if (enableCache) {
      styleCache.set(cacheKey, { key: cacheKey, value: result })
    }

    return result
  })

  // Transform style (rotation, scale)
  const transformStyle = computed<CSSProperties>(() => {
    const geometry = geometryRef.value

    const transforms: string[] = []
    if (rotation.value) transforms.push(`rotate(${rotation.value}deg)`)

    if (transforms.length === 0) return {}

    return { transform: transforms.join(' ') }
  })

  // Full layout style (uses core utility for complete layout)
  const layoutStyle = computed<CSSProperties>(() => {
    const cacheKey = `layout:${layoutMode.value}:${JSON.stringify(styleRef.value)}:${JSON.stringify(
      geometryRef.value,
    )}`
    if (enableCache && styleCache.has(cacheKey)) {
      return styleCache.get(cacheKey)!.value
    }

    const result = generateLayoutCSS(
      styleRef.value,
      layoutMode.value,
      geometryRef.value,
    ) as CSSProperties

    if (enableCache) {
      styleCache.set(cacheKey, { key: cacheKey, value: result })
    }

    return result
  })

  // Visual style (colors, borders, shadows, etc.)
  const visualStyle = computed<CSSProperties>(() => {
    const cacheKey = generateCacheKey(styleRef.value, 'visual')
    if (enableCache && styleCache.has(cacheKey)) {
      return styleCache.get(cacheKey)!.value
    }

    const result = generateVisualCSS(styleRef.value) as CSSProperties

    if (enableCache) {
      styleCache.set(cacheKey, { key: cacheKey, value: result })
    }

    return result
  })

  // Animation style
  const animationStyle = computed<CSSProperties>(() => {
    if (!includeAnimation) return {}

    const animation = animationRef.value
    if (!animation) return {}

    const cacheKey = `anim:${JSON.stringify(animation)}`
    if (enableCache && styleCache.has(cacheKey)) {
      return styleCache.get(cacheKey)!.value
    }

    const result = generateAnimationCSS(animation) as unknown as CSSProperties

    if (enableCache) {
      styleCache.set(cacheKey, { key: cacheKey, value: result })
    }

    return result
  })

  // ========== Combined Styles ==========

  const computedStyle = computed<CSSProperties>(() => {
    const base: CSSProperties = {}

    if (includeLayout) {
      Object.assign(base, layoutStyle.value)
    }

    Object.assign(base, visualStyle.value)

    if (includeAnimation) {
      Object.assign(base, animationStyle.value)
    }

    return base
  })

  // Animation classes
  const animationClasses = computed(() => {
    const animation = animationRef.value
    const className =
      animation?.className || (animation as unknown as { class?: string } | undefined)?.class
    if (!className) return []
    return ['animated', className]
  })

  // ========== Cache Management ==========

  // Clear cache when style significantly changes (optional optimization)
  const clearCache = () => {
    styleCache.clear()
  }

  // Limit cache size to prevent memory leaks
  const maxCacheSize = 100
  watch(
    () => styleCache.size,
    (size) => {
      if (size > maxCacheSize) {
        // Remove oldest entries (first half)
        const entries = Array.from(styleCache.entries())
        const toRemove = entries.slice(0, Math.floor(size / 2))
        for (const [key] of toRemove) {
          styleCache.delete(key)
        }
      }
    },
  )

  return {
    // Granular properties
    size,
    rotation,
    zIndex,
    locked,
    visible,

    // Granular styles
    sizeStyle,
    transformStyle,

    // Combined styles
    layoutStyle,
    visualStyle,
    animationStyle,
    computedStyle,

    // Animation
    animationClasses,

    // Cache management
    clearCache,
  }
}
