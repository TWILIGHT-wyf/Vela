<template>
  <vContainer
    :tag="props.tag"
    :role="props.role || undefined"
    :aria-label="props.ariaLabel || undefined"
    v-bind="forwardedAttrs"
    :style="mergedStyle"
  >
    <slot />
  </vContainer>
</template>

<script setup lang="ts">
import { computed, useAttrs, type CSSProperties } from 'vue'
import { vContainer } from '@vela/ui'
import type { CSSLength } from '@vela/core/contracts'

defineOptions({
  name: 'MaterialContainer',
  inheritAttrs: false,
})

interface Props {
  tag?: 'div' | 'section' | 'article' | 'main' | 'aside' | 'header' | 'footer' | 'nav' | 'form'
  role?: string
  ariaLabel?: string
  padding?: CSSLength
  backgroundColor?: string
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto'
}

const props = withDefaults(defineProps<Props>(), {
  tag: 'div',
  role: '',
  ariaLabel: '',
  padding: '0px',
  backgroundColor: 'transparent',
  overflow: 'visible',
})

const attrs = useAttrs()

function hasPaddingStyleOverride(styleInput: unknown): boolean {
  if (!styleInput) return false

  if (Array.isArray(styleInput)) {
    return styleInput.some((item) => hasPaddingStyleOverride(item))
  }

  if (typeof styleInput === 'string') {
    return /\bpadding(?:-(top|right|bottom|left))?\s*:/.test(styleInput)
  }

  if (typeof styleInput === 'object') {
    const styleObject = styleInput as Record<string, unknown>
    return (
      'padding' in styleObject ||
      'paddingTop' in styleObject ||
      'paddingRight' in styleObject ||
      'paddingBottom' in styleObject ||
      'paddingLeft' in styleObject
    )
  }

  return false
}

function toCssLength(value: CSSLength | undefined): string | undefined {
  if (value === undefined || value === null) {
    return undefined
  }
  if (typeof value === 'number') {
    return `${value}px`
  }
  return value
}

const baseStyle = computed<CSSProperties>(() => {
  // The page editor owns box-model adjustments. Material defaults stay neutral
  // so overlays, hit targets, and section-style stretching remain predictable.
  const incoming = attrs.style as CSSProperties | CSSProperties[] | string | undefined
  const usePropPadding = !hasPaddingStyleOverride(incoming)
  const p = toCssLength(props.padding)
  return {
    display: 'block',
    boxSizing: 'border-box',
    minWidth: 0,
    minHeight: 0,
    paddingTop: usePropPadding ? p : undefined,
    paddingRight: usePropPadding ? p : undefined,
    paddingBottom: usePropPadding ? p : undefined,
    paddingLeft: usePropPadding ? p : undefined,
    backgroundColor: props.backgroundColor || undefined,
    overflow: props.overflow || undefined,
  }
})

const mergedStyle = computed(() => {
  const incoming = attrs.style as CSSProperties | CSSProperties[] | undefined
  return [baseStyle.value, incoming]
})

const forwardedAttrs = computed(() => {
  const rest: Record<string, unknown> = { ...attrs }
  delete rest.style
  return rest
})
</script>
