<template>
  <el-col
    :span="span"
    :offset="offset"
    :push="push"
    :pull="pull"
    :xs="xs"
    :sm="sm"
    :md="md"
    :lg="lg"
    :xl="xl"
    :tag="tag"
    :style="containerStyle"
    class="v-col"
  >
    <slot>
      <div class="v-col-placeholder" :style="placeholderStyle">
        {{ placeholder }}
      </div>
    </slot>
  </el-col>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'
import { ElCol } from 'element-plus'

// 响应式尺寸类型
type ResponsiveSize = number | { span?: number; offset?: number; push?: number; pull?: number }

// 定义纯 UI Props
const props = withDefaults(
  defineProps<{
    // Col 布局属性
    span?: number
    offset?: number
    push?: number
    pull?: number
    xs?: ResponsiveSize
    sm?: ResponsiveSize
    md?: ResponsiveSize
    lg?: ResponsiveSize
    xl?: ResponsiveSize
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
    span: 24,
    offset: 0,
    push: 0,
    pull: 0,
    tag: 'div',
    padding: 0,
    backgroundColor: 'transparent',
    borderRadius: 0,
    borderWidth: 0,
    borderColor: '#dcdfe6',
    minHeight: 'auto',
    placeholder: '列布局容器 - 可拖入其他组件',
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
.v-col {
  box-sizing: border-box;
}

.v-col-placeholder {
  width: 100%;
}
</style>
