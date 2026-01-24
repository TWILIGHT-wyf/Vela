import { computed, type Ref, type ComputedRef, unref, type CSSProperties } from 'vue'
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
  type AnimationStyle,
} from '@vela/core/utils'

/**
 * CSS Style object returned by useComponentStyle
 */
export type ComponentCSSStyle = CSSProperties

/**
 * Options for useComponentStyle
 */
export interface UseComponentStyleOptions {
  includeLayout?: boolean
  includeAnimation?: boolean
}

/**
 * Unified composable for generating component styles from NodeSchema
 * (Editor Version - specific for Vue environment)
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
  const { includeLayout = true, includeAnimation = true } = options

  // Normalize input to get style object
  const styleRef = computed(() => {
    const value = unref(nodeOrStyle)
    if (!value) return undefined

    if ('componentName' in value) {
      return (value as NodeSchema).style
    }
    return value as NodeStyle
  })

  // Get animation from NodeSchema if available
  const animationRef = computed(() => {
    const value = unref(nodeOrStyle)
    if (!value) return undefined
    if ('componentName' in value) {
      return (value as NodeSchema).animation
    }
    return undefined
  })

  // Layout properties
  const position = computed(() => extractPosition(styleRef.value))
  const size = computed(() => extractSize(styleRef.value))
  const rotation = computed(() => extractRotation(styleRef.value))
  const zIndex = computed(() => extractZIndex(styleRef.value))

  // State
  const locked = computed(() => isNodeLocked(styleRef.value))
  const visible = computed(() => isNodeVisible(styleRef.value))

  // Layout CSS
  const layoutStyle = computed(() => generateLayoutCSS(styleRef.value) as CSSProperties)

  // Visual CSS
  const visualStyle = computed(() => generateVisualCSS(styleRef.value) as CSSProperties)

  // Animation CSS
  const animationStyle = computed(() => {
    if (!includeAnimation) return {}
    return generateAnimationCSS(animationRef.value) as unknown as CSSProperties
  })

  // Combined style
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

  return {
    position,
    size,
    rotation,
    zIndex,
    locked,
    visible,
    layoutStyle,
    visualStyle,
    animationStyle,
    computedStyle,
    animationClasses,
  }
}

export type UseComponentStyleReturn = ReturnType<typeof useComponentStyle>
