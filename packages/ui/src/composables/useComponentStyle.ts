import { computed, type Ref, type ComputedRef, unref, type CSSProperties } from 'vue'
import type { NodeSchema, NodeStyle } from '@vela/core'
import type { LayoutMode, NodeGeometry } from '@vela/core'
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
  /** 布局模式覆盖 (默认从 geometry.mode 推断) */
  layoutMode?: LayoutMode
}

/**
 * 判断输入值是否为 NodeSchema (而非 NodeStyle)
 * 使用 id 字段判断，因为 id 是 NodeSchema 的必填字段
 */
function isNodeSchema(value: unknown): value is NodeSchema {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value
  )
}

/**
 * Unified composable for generating component styles from NodeSchema
 * Used by both editor and renderer packages
 *
 * 支持新的 geometry/container 布局协议：
 * - 从 NodeSchema.geometry 提取位置/尺寸/旋转等信息
 * - 兼容旧的 style 字段
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
  const { includeLayout = true, includeAnimation = true, layoutMode } = options

  // Normalize input to get style object
  const styleRef = computed(() => {
    const value = unref(nodeOrStyle)
    if (!value) return undefined

    if (isNodeSchema(value)) {
      return value.style
    }
    return value as NodeStyle
  })

  // Get geometry from NodeSchema if available
  const geometryRef = computed((): NodeGeometry | undefined => {
    const value = unref(nodeOrStyle)
    if (!value) return undefined
    if (isNodeSchema(value)) {
      return value.geometry
    }
    return undefined
  })

  // Get animation from NodeSchema if available
  const animationRef = computed(() => {
    const value = unref(nodeOrStyle)
    if (!value) return undefined
    if (isNodeSchema(value)) {
      return value.animation
    }
    return undefined
  })

  // 推断布局模式
  const resolvedMode = computed((): LayoutMode => {
    if (layoutMode) return layoutMode
    return geometryRef.value?.mode ?? 'free'
  })

  // Layout properties (使用 geometry 优先)
  const position = computed(() => extractPosition(styleRef.value, geometryRef.value))
  const size = computed(() => extractSize(styleRef.value, geometryRef.value))
  const rotation = computed(() => extractRotation(styleRef.value, geometryRef.value))
  const zIndex = computed(() => extractZIndex(styleRef.value))

  // State (使用 geometry 判断 locked/visible)
  const locked = computed(() => isNodeLocked(styleRef.value, geometryRef.value))
  const visible = computed(() => isNodeVisible(styleRef.value, geometryRef.value))

  // Layout CSS (传入 mode 和 geometry)
  const layoutStyle = computed(() =>
    generateLayoutCSS(styleRef.value, resolvedMode.value, geometryRef.value) as CSSProperties,
  )

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

  // Animation classes (使用 className 而非旧的 class)
  const animationClasses = computed(() => {
    const animation = animationRef.value
    if (!animation || !animation.className) return []
    return ['animated', animation.className]
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
