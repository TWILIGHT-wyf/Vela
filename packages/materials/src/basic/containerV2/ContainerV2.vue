<template>
  <WrappedContainer v-bind="normalizedProps">
    <slot />
  </WrappedContainer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { vContainer } from '@vela/ui'
import { defineMaterial, createPropsAdapter } from '../../../utils'

// 1. Props 适配器 (V2 -> UI)
const propsAdapter = createPropsAdapter({
  // 如果有需要，可以在这里定义一些特殊映射
})

// 2. 使用 HOC 包装
const WrappedContainer = defineMaterial(vContainer, {
  name: 'ContainerV2',
  connectEvent: true,
  fillContainer: true, // 容器填满 wrapper
  propsAdapter,
})

// 3. 定义 V2 Props 结构
interface LayoutConfig {
  display?: 'block' | 'flex' | 'grid'
  direction?: 'row' | 'column'
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around'
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch'
  gap?: number
  wrap?: boolean
}

interface StyleConfig {
  background?: {
    color?: string
    image?: string
    size?: string
  }
  border?: {
    width?: number
    style?: 'solid' | 'dashed' | 'dotted'
    color?: string
    radius?: number
  }
  spacing?: {
    padding?: number | string
    margin?: number | string
  }
  shadow?: string
}

const props = withDefaults(
  defineProps<{
    // V2 配置分组
    layout?: LayoutConfig
    style?: StyleConfig

    // 兼容旧属性 (部分)
    width?: string | number
    height?: string | number
  }>(),
  {
    layout: () => ({ display: 'block' }),
    style: () => ({}),
  },
)

// 4. Config Object -> Flat UI Props
const normalizedProps = computed(() => {
  const { layout, style, width, height } = props

  return {
    // 尺寸透传
    width: width,
    height: height,

    // 布局映射
    display: layout.display,
    flexDirection: layout.direction,
    justifyContent: layout.justify,
    alignItems: layout.align,
    gap: layout.gap,

    // 样式映射
    backgroundColor: style.background?.color,
    backgroundImage: style.background?.image,
    backgroundSize: style.background?.size,

    borderWidth: style.border?.width,
    borderStyle: style.border?.style,
    borderColor: style.border?.color,
    borderRadius: style.border?.radius,

    padding: style.spacing?.padding,
    // margin 通常由外部 wrapper 控制，或者容器内部
    margin: style.spacing?.margin,

    boxShadow: style.shadow,
  }
})

defineOptions({
  inheritAttrs: false,
})
</script>
