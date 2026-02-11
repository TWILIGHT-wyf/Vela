<template>
  <div class="v-badge-container" :style="containerStyle">
    <el-badge
      :value="value"
      :type="type"
      :color="color"
      :is-dot="isDot"
      :max="max"
      :hidden="hidden"
      :show-zero="showZero"
      :offset="offset"
    >
      <slot>
        <span :style="slotContentStyle">{{ slotText || 'Badge Content' }}</span>
      </slot>
    </el-badge>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'
import { ElBadge } from 'element-plus'

// 定义纯 UI Props，无业务逻辑
const props = withDefaults(
  defineProps<{
    // Badge 值
    value?: string | number
    type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
    color?: string
    isDot?: boolean
    max?: number
    hidden?: boolean
    showZero?: boolean
    offset?: [number, number]

    // 默认插槽文本（当没有子组件时显示）
    slotText?: string

    // 容器样式
    opacity?: number
    visible?: boolean
    padding?: number

    // 插槽内容样式
    slotFontSize?: number
    slotColor?: string
    slotPadding?: number
  }>(),
  {
    value: '1',
    type: 'primary',
    color: undefined,
    isDot: false,
    max: 99,
    hidden: false,
    showZero: false,
    slotText: '徽章内容',
    opacity: 100,
    visible: true,
    padding: 4,
    slotFontSize: 14,
    slotColor: '#303133',
    slotPadding: 8,
  },
)

// 容器样式
const containerStyle = computed<CSSProperties>(() => {
  return {
    opacity: props.opacity / 100,
    display: props.visible === false ? 'none' : 'inline-flex',
    padding: `${props.padding}px`,
    boxSizing: 'border-box',
    alignItems: 'center',
    justifyContent: 'center',
  }
})

// 插槽内容样式
const slotContentStyle = computed<CSSProperties>(() => {
  return {
    fontSize: `${props.slotFontSize}px`,
    color: props.slotColor,
    padding: `${props.slotPadding}px`,
  }
})
</script>

<style scoped>
.v-badge-container {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

:deep(.el-badge) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

:deep(.el-badge__content) {
  font-size: inherit !important;
}
</style>
