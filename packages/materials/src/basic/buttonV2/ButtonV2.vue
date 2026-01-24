<template>
  <WrappedButton v-bind="normalizedProps">
    <slot />
  </WrappedButton>
</template>

<script setup lang="ts">
/**
 * ButtonV2 - 使用新架构的按钮物料
 *
 * 特性：
 * 1. 使用 defineMaterial HOC 统一处理切面逻辑
 * 2. 支持 ObjectSetter 语义分组的 Props
 * 3. 向后兼容旧的扁平 Props
 */
import { computed } from 'vue'
import { vButton } from '@vela/ui'
import { defineMaterial, createPropsAdapter } from '../../utils'

// 定义 Props 适配器：将旧的扁平属性映射到新结构
const propsAdapter = createPropsAdapter({
  backgroundColor: 'style.backgroundColor',
  textColor: 'style.textColor',
  fontSize: 'style.fontSize',
  fontWeight: 'style.fontWeight',
  borderRadius: 'style.borderRadius',
})

// 使用 defineMaterial 包装 UI 组件
const WrappedButton = defineMaterial(vButton, {
  name: 'ButtonV2',
  connectEvent: true,
  errorBoundary: true,
  fillContainer: true,
  propsAdapter,
})

// 定义 V2 Props（使用语义分组）
interface ButtonStyle {
  backgroundColor?: string
  textColor?: string
  fontSize?: number
  fontWeight?: number | string
  borderRadius?: number
}

const props = withDefaults(
  defineProps<{
    // 基础属性（保持扁平，因为它们是原子的）
    text?: string
    type?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'text' | 'default'
    size?: 'large' | 'default' | 'small'
    plain?: boolean
    round?: boolean
    circle?: boolean
    disabled?: boolean
    loading?: boolean
    icon?: string

    // V2: 样式分组（语义化）
    style?: ButtonStyle

    // 向后兼容：旧的扁平样式属性
    backgroundColor?: string
    textColor?: string
    fontSize?: number
    fontWeight?: number | string
    borderRadius?: number
  }>(),
  {
    text: '按钮',
    type: 'primary',
    size: 'default',
  },
)

// 将分组的 style 对象解构为 UI 层需要的扁平属性
const normalizedProps = computed(() => {
  const { style, ...rest } = props

  // 优先使用 style 对象，回退到扁平属性
  return {
    ...rest,
    backgroundColor: style?.backgroundColor ?? props.backgroundColor,
    textColor: style?.textColor ?? props.textColor,
    fontSize: style?.fontSize ?? props.fontSize,
    fontWeight: style?.fontWeight ?? props.fontWeight,
    borderRadius: style?.borderRadius ?? props.borderRadius,
  }
})

// 禁用属性继承，由内部组件接收
defineOptions({
  inheritAttrs: false,
})
</script>

<style scoped>
/* 样式由 defineMaterial 的 wrapper 和 UI 组件控制 */
</style>
