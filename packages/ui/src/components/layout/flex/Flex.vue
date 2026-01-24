<template>
  <div class="v-flex-container" :style="containerStyle">
    <slot>
      <div class="v-flex-placeholder" :style="placeholderStyle">
        {{ placeholder }}
      </div>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'

// 定义纯 UI Props
const props = withDefaults(
  defineProps<{
    // Flex 布局属性
    flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
    justifyContent?:
      | 'flex-start'
      | 'flex-end'
      | 'center'
      | 'space-between'
      | 'space-around'
      | 'space-evenly'
    alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline'
    flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
    gap?: number

    // 容器样式
    padding?: number
    backgroundColor?: string
    borderRadius?: number
    borderWidth?: number
    borderColor?: string
    minHeight?: string

    // 占位文本
    placeholder?: string
    textColor?: string
    fontSize?: number
  }>(),
  {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    flexWrap: 'nowrap',
    gap: 0,
    padding: 16,
    backgroundColor: 'transparent',
    borderRadius: 0,
    borderWidth: 0,
    borderColor: '#dcdfe6',
    minHeight: '100px',
    placeholder: 'Flex Container',
    textColor: '#909399',
    fontSize: 14,
  },
)

// 容器样式
const containerStyle = computed<CSSProperties>(() => {
  return {
    display: 'flex',
    flexDirection: props.flexDirection,
    justifyContent: props.justifyContent,
    alignItems: props.alignItems,
    flexWrap: props.flexWrap,
    gap: `${props.gap}px`,
    padding: `${props.padding}px`,
    backgroundColor: props.backgroundColor,
    borderRadius: `${props.borderRadius}px`,
    borderWidth: `${props.borderWidth}px`,
    borderStyle: props.borderWidth ? 'solid' : 'none',
    borderColor: props.borderColor,
    minHeight: props.minHeight,
    width: '100%',
    boxSizing: 'border-box',
  }
})

// 占位样式
const placeholderStyle = computed<CSSProperties>(() => {
  return {
    width: '100%',
    minHeight: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: props.textColor,
    fontSize: `${props.fontSize}px`,
  }
})
</script>

<style scoped>
.v-flex-container {
  box-sizing: border-box;
}

.v-flex-placeholder {
  width: 100%;
}
</style>
