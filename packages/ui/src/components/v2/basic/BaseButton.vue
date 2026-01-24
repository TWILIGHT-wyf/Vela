<template>
  <button
    class="v-button"
    :class="[
      `v-button--${type}`,
      `v-button--${size}`,
      {
        'is-disabled': disabled,
        'is-loading': loading,
        'is-plain': plain,
        'is-round': round,
        'is-circle': circle,
      },
    ]"
    :disabled="disabled || loading"
    :style="customStyle"
    @click="handleClick"
  >
    <i v-if="loading" class="el-icon-loading" />
    <i v-else-if="icon" :class="icon" />
    <span v-if="$slots.default"><slot /></span>
    <span v-else>{{ text }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'

/**
 * Button V2 (UI Layer)
 * 纯粹的展示组件，严格遵循 Core Schema 定义
 */

export interface ButtonStyleConfig {
  backgroundColor?: string
  textColor?: string
  fontSize?: number
  fontWeight?: number | string
  borderRadius?: number
  borderColor?: string
}

const props = withDefaults(
  defineProps<{
    // 1. 基础原子属性 (与 Core Schema 对应)
    text?: string
    type?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default'
    size?: 'large' | 'default' | 'small'
    plain?: boolean
    round?: boolean
    circle?: boolean
    disabled?: boolean
    loading?: boolean
    icon?: string

    // 2. 样式配置对象 (V2 特性)
    styleConfig?: ButtonStyleConfig
  }>(),
  {
    text: '',
    type: 'primary',
    size: 'default',
    styleConfig: () => ({}),
  },
)

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

// 计算动态样式
const customStyle = computed<CSSProperties>(() => {
  const { styleConfig } = props
  const style: CSSProperties = {}

  if (styleConfig.backgroundColor) {
    style.backgroundColor = styleConfig.backgroundColor
    // 如果设置了背景色且不是 plain 模式，边框色默认跟随背景色
    if (!props.plain) {
      style.borderColor = styleConfig.backgroundColor
    }
  }

  if (styleConfig.textColor) style.color = styleConfig.textColor
  if (styleConfig.fontSize) style.fontSize = `${styleConfig.fontSize}px`
  if (styleConfig.fontWeight) style.fontWeight = styleConfig.fontWeight
  if (styleConfig.borderRadius !== undefined) style.borderRadius = `${styleConfig.borderRadius}px`
  if (styleConfig.borderColor) style.borderColor = styleConfig.borderColor

  return style
})

const handleClick = (e: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', e)
  }
}
</script>

<style scoped>
.v-button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  line-height: 1;
  height: 32px;
  white-space: nowrap;
  cursor: pointer;
  color: #606266;
  text-align: center;
  box-sizing: border-box;
  outline: none;
  margin: 0;
  transition: 0.1s;
  font-weight: 500;
  user-select: none;
  vertical-align: middle;
  background-color: #fff;
  border: 1px solid #dcdfe6;
  padding: 8px 15px;
  font-size: 14px;
  border-radius: 4px;
}

.v-button:hover,
.v-button:focus {
  color: #409eff;
  border-color: #c6e2ff;
  background-color: #ecf5ff;
}

.v-button:active {
  color: #3a8ee6;
  border-color: #3a8ee6;
  outline: none;
}

/* Disabled */
.v-button.is-disabled {
  color: #c0c4cc;
  cursor: not-allowed;
  background-image: none;
  background-color: #fff;
  border-color: #ebeef5;
}

/* Sizes */
.v-button--large {
  height: 40px;
  padding: 12px 19px;
  font-size: 14px;
}
.v-button--small {
  height: 24px;
  padding: 5px 11px;
  font-size: 12px;
}

/* Types (Simplified for Demo) */
.v-button--primary {
  color: #fff;
  background-color: #409eff;
  border-color: #409eff;
}
.v-button--primary:not(.is-disabled):hover {
  background-color: #66b1ff;
  border-color: #66b1ff;
}

/* Round/Circle */
.v-button.is-round {
  border-radius: 20px;
}
.v-button.is-circle {
  border-radius: 50%;
  padding: 8px;
  min-width: 32px;
}
</style>
