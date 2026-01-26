<template>
  <el-button
    :type="type"
    :size="size"
    :plain="plain"
    :round="round"
    :circle="circle"
    :disabled="disabled"
    :icon="icon"
    :loading="loading"
    :style="buttonStyle"
    @click="handleClick"
  >
    {{ text }}
  </el-button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'
import { ElButton } from 'element-plus'

// 定义纯 UI Props
const props = withDefaults(
  defineProps<{
    // 内容
    text?: string

    // 类型
    type?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'text' | 'default'
    size?: 'large' | 'default' | 'small'

    // 状态
    plain?: boolean
    round?: boolean
    circle?: boolean
    disabled?: boolean
    loading?: boolean

    // 图标
    icon?: string

    // 样式
    width?: string | number
    height?: string | number
    backgroundColor?: string
    color?: string // 标准化命名：原 textColor
    fontSize?: number | string // 标准化类型：支持 string | number
    fontWeight?: number | string
    borderRadius?: number | string // 标准化类型
    padding?: string
  }>(),
  {
    text: '按钮',
    type: 'primary',
    size: 'default',
    plain: false,
    round: false,
    circle: false,
    disabled: false,
    loading: false,
    // 样式默认值保持 undefined 由 CSS 控制，或显式指定
  },
)

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

// 按钮样式
const buttonStyle = computed<CSSProperties>(() => {
  const style: CSSProperties = {}

  if (props.width !== undefined) {
    style.width = typeof props.width === 'number' ? `${props.width}px` : props.width
  }

  if (props.height !== undefined) {
    style.height = typeof props.height === 'number' ? `${props.height}px` : props.height
  }

  if (props.backgroundColor) {
    style.backgroundColor = props.backgroundColor
    style.borderColor = props.backgroundColor
  }

  if (props.color) {
    style.color = props.color
  }

  if (props.fontSize !== undefined) {
    style.fontSize = typeof props.fontSize === 'number' ? `${props.fontSize}px` : props.fontSize
  }

  if (props.fontWeight !== undefined) {
    style.fontWeight = props.fontWeight
  }

  if (props.borderRadius !== undefined) {
    style.borderRadius =
      typeof props.borderRadius === 'number' ? `${props.borderRadius}px` : props.borderRadius
  }

  if (props.padding) {
    style.padding = props.padding
  }

  return style
})

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<style scoped>
/* 样式由 Element Plus 和 props 控制 */
</style>
