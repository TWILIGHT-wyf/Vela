<template>
  <div class="v-text" :style="textStyle">
    {{ content }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'

// 定义纯 UI Props，无业务逻辑
const props = withDefaults(
  defineProps<{
    // 内容
    content?: string

    // 样式配置
    fontSize?: number | string // 标准化类型
    color?: string // 标准化命名：原 fontColor
    fontWeight?: 'normal' | 'bold' | 'lighter' | number | string
    textAlign?: 'left' | 'center' | 'right' | 'justify'
    letterSpacing?: number | string
    lineHeight?: number | string
    paddingX?: number
    paddingY?: number
    opacity?: number
    visible?: boolean
    locked?: boolean
  }>(),
  {
    content: '文本内容',
    fontSize: 16,
    color: '#000000',
    fontWeight: 'normal',
    textAlign: 'left',
    letterSpacing: 0,
    lineHeight: 1.2,
    paddingX: 0,
    paddingY: 0,
    opacity: 100,
    visible: true,
    locked: false,
  },
)

// 计算文本样式
const textStyle = computed<CSSProperties>(() => {
  return {
    opacity: props.opacity / 100,
    display: props.visible === false ? 'none' : 'block',
    fontSize: typeof props.fontSize === 'number' ? `${props.fontSize}px` : props.fontSize,
    color: props.color,
    fontWeight: props.fontWeight,
    textAlign: props.textAlign,
    letterSpacing:
      typeof props.letterSpacing === 'number' ? `${props.letterSpacing}px` : props.letterSpacing,
    lineHeight: props.lineHeight,
    padding: `${props.paddingY}px ${props.paddingX}px`,
    width: '100%',
    height: '100%',
    userSelect: props.locked ? 'none' : 'text',
    pointerEvents: props.locked ? 'none' : 'auto',
    overflow: 'hidden',
    boxSizing: 'border-box',
  }
})
</script>

<style scoped>
.v-text {
  word-break: break-word;
  white-space: pre-wrap;
}
</style>
