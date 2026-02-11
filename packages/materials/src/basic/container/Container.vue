<template>
  <vContainer v-bind="forwardedAttrs" :style="mergedStyle">
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
  padding?: CSSLength
  backgroundColor?: string
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto'
}

const props = withDefaults(defineProps<Props>(), {
  padding: '12px',
  backgroundColor: 'transparent',
  overflow: 'visible',
})

const attrs = useAttrs()

function toCssLength(value: CSSLength | undefined): string | undefined {
  if (value === undefined || value === null) {
    return undefined
  }
  if (typeof value === 'number') {
    return `${value}px`
  }
  return value
}

const baseStyle = computed<CSSProperties>(() => ({
  boxSizing: 'border-box',
  padding: toCssLength(props.padding),
  backgroundColor: props.backgroundColor,
  overflow: props.overflow,
}))

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
