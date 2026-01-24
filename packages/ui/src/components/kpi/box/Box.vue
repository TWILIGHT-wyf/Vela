<template>
  <div class="v-box-container" :style="containerStyle">
    <div class="v-box-content" :style="contentStyle">
      {{ content }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'

const props = withDefaults(
  defineProps<{
    // 内容
    content?: string

    // 容器样式
    opacity?: number
    visible?: boolean
    backgroundColor?: string
    borderColor?: string
    borderWidth?: number
    borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none'
    borderRadius?: number
    padding?: number
    boxShadow?: string

    // 文字样式
    fontSize?: number
    textColor?: string
    fontWeight?: 'normal' | 'bold' | 'lighter' | number
    textAlign?: 'left' | 'center' | 'right' | 'justify'
    lineHeight?: number
  }>(),
  {
    content: 'Box Content',
    opacity: 100,
    visible: true,
    backgroundColor: '#ffffff',
    borderColor: '#dcdfe6',
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: 4,
    padding: 16,
    boxShadow: 'none',
    fontSize: 14,
    textColor: '#606266',
    fontWeight: 'normal',
    textAlign: 'center',
    lineHeight: 1.5,
  },
)

// 计算容器样式
const containerStyle = computed<CSSProperties>(() => {
  return {
    opacity: ((props.opacity ?? 100) as number) / 100,
    display: props.visible === false ? 'none' : 'flex',
    backgroundColor: props.backgroundColor ?? '#ffffff',
    borderColor: props.borderColor ?? '#dcdfe6',
    borderWidth: `${props.borderWidth ?? 1}px`,
    borderStyle: props.borderStyle ?? 'solid',
    borderRadius: `${props.borderRadius ?? 4}px`,
    padding: `${props.padding ?? 16}px`,
    boxShadow: props.boxShadow ?? 'none',
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    alignItems: 'center',
    justifyContent: 'center',
  }
})

// 计算内容样式
const contentStyle = computed<CSSProperties>(() => {
  return {
    fontSize: `${props.fontSize ?? 14}px`,
    color: props.textColor ?? '#606266',
    fontWeight: props.fontWeight ?? 'normal',
    textAlign: props.textAlign ?? 'center',
    lineHeight: props.lineHeight ?? 1.5,
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
  }
})
</script>

<style scoped>
.v-box-container {
  box-sizing: border-box;
}

.v-box-content {
  word-break: break-word;
  white-space: pre-wrap;
}
</style>
