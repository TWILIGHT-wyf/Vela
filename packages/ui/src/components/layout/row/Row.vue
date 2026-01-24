<template>
  <el-row
    :gutter="gutter"
    :justify="justify"
    :align="align"
    :tag="tag"
    :style="containerStyle"
    class="v-row"
  >
    <slot>
      <div class="v-row-placeholder" :style="placeholderStyle">
        {{ placeholder }}
      </div>
    </slot>
  </el-row>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'
import { ElRow } from 'element-plus'

// 定义纯 UI Props
const props = withDefaults(
  defineProps<{
    // Row 布局属性
    gutter?: number
    justify?: 'start' | 'end' | 'center' | 'space-around' | 'space-between' | 'space-evenly'
    align?: 'top' | 'middle' | 'bottom'
    tag?: string

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
    gutter: 0,
    justify: 'start',
    align: 'top',
    tag: 'div',
    padding: 0,
    backgroundColor: 'transparent',
    borderRadius: 0,
    borderWidth: 0,
    borderColor: '#dcdfe6',
    minHeight: 'auto',
    placeholder: '行布局容器 - 可拖入其他组件',
    textColor: '#909399',
    fontSize: 14,
  },
)

// 容器样式
const containerStyle = computed<CSSProperties>(() => {
  return {
    padding: `${props.padding}px`,
    backgroundColor: props.backgroundColor,
    borderRadius: `${props.borderRadius}px`,
    borderWidth: `${props.borderWidth}px`,
    borderStyle: props.borderWidth ? 'solid' : 'none',
    borderColor: props.borderColor,
    minHeight: props.minHeight,
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
.v-row {
  width: 100%;
  box-sizing: border-box;
}

.v-row-placeholder {
  width: 100%;
}
</style>
