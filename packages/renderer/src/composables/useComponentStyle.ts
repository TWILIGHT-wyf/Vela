import { computed, type Ref, type ComputedRef, unref, type CSSProperties, shallowRef, watch } from 'vue'
import type { NodeSchema, NodeStyle } from '@vela/core'
import {
  extractPosition,
  extractSize,
  extractRotation,
  extractZIndex,
  isNodeLocked,
  isNodeVisible,
  generateLayoutCSS,
  generateVisualCSS,
  generateAnimationCSS,
} from '@vela/core/utils'

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
    if ('componentName' in value) {
      return (value as NodeSchema).style
    }
    return value as NodeStyle
  })

  const animationRef = computed(() => {
    const value = unref(nodeOrStyle)
    if (!value) return undefined
    if ('componentName' in value) {
      return (value as NodeSchema).animation
    }
    return undefined
  })

  // ========== Granular Layout Properties ==========

  // Position (x, y) - only recalculates when position changes
  const position = computed(() => extractPosition(styleRef.value))

  // Size (width, height) - only recalculates when size changes
  const size = computed(() => extractSize(styleRef.value))

  // Rotation - only recalculates when rotation changes
  const rotation = computed(() => extractRotation(styleRef.value))

  // Z-Index - only recalculates when zIndex changes
  const zIndex = computed(() => extractZIndex(styleRef.value))

  // Lock state
  const locked = computed(() => isNodeLocked(styleRef.value))

  // Visibility state
  const visible = computed(() => isNodeVisible(styleRef.value))

  // ========== Cached Style Computations ==========

  // Position style (absolute positioning)
  const positionStyle = computed<CSSProperties>(() => {
    const style = styleRef.value
    if (!style) return {}

    const cacheKey = `pos:${style.x}:${style.y}`
    if (enableCache && styleCache.has(cacheKey)) {
      return styleCache.get(cacheKey)!.value
    }

    const result: CSSProperties = {
      position: 'absolute',
      left: style.x != null ? `${style.x}px` : undefined,
      top: style.y != null ? `${style.y}px` : undefined,
    }

    if (enableCache) {
      styleCache.set(cacheKey, { key: cacheKey, value: result })
    }

    return result
  })

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
    const style = styleRef.value
    if (!style) return {}

    const transforms: string[] = []
    if (style.rotate) transforms.push(`rotate(${style.rotate}deg)`)
    if (style.scaleX != null || style.scaleY != null) {
      const sx = style.scaleX ?? 1
      const sy = style.scaleY ?? 1
      transforms.push(`scale(${sx}, ${sy})`)
    }

    if (transforms.length === 0) return {}

    return { transform: transforms.join(' ') }
  })

  // Full layout style (uses core utility for complete layout)
  const layoutStyle = computed<CSSProperties>(() => {
    const cacheKey = generateCacheKey(styleRef.value, 'layout')
    if (enableCache && styleCache.has(cacheKey)) {
      return styleCache.get(cacheKey)!.value
    }

    const result = generateLayoutCSS(styleRef.value) as CSSProperties

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

  // Use shallowRef for the final computed style to reduce reactive overhead
  const _computedStyleCache = shallowRef<CSSProperties>({})

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
    if (!animation || !animation.class) return []
    return ['animated', animation.class]
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
    position,
    size,
    rotation,
    zIndex,
    locked,
    visible,

    // Granular styles
    positionStyle,
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
