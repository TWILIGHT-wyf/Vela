<template>
  <div :style="containerStyle">
    <el-input
      v-model="internalValue"
      :placeholder="placeholder"
      :size="size"
      :clearable="clearable"
      :disabled="disabled"
      :prefix-icon="prefixIcon"
      :suffix-icon="suffixIcon"
      :maxlength="maxlength"
      :show-word-limit="showWordLimit"
      :style="inputStyle"
      @input="handleInput"
      @change="handleChange"
      @clear="handleClear"
      @focus="handleFocus"
      @blur="handleBlur"
    >
      <template v-if="showSearchButton" #append>
        <el-button :icon="SearchIcon" :type="buttonType" @click="handleSearch">
          {{ buttonText }}
        </el-button>
      </template>
    </el-input>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CSSProperties, Component } from 'vue'
import { Search as SearchIcon } from '@element-plus/icons-vue'
import { ElInput, ElButton } from 'element-plus'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    size?: 'large' | 'default' | 'small'
    clearable?: boolean
    disabled?: boolean
    prefixIcon?: string | Component
    suffixIcon?: string | Component
    maxlength?: number
    showWordLimit?: boolean
    showSearchButton?: boolean
    buttonText?: string
    buttonType?: 'default' | 'primary' | 'success' | 'warning' | 'info' | 'danger'
    padding?: number
    backgroundColor?: string
    borderColor?: string
    borderFocusColor?: string
    borderHoverColor?: string
    textColor?: string
    placeholderColor?: string
    fontSize?: number
    inputWidth?: string
  }>(),
  {
    modelValue: '',
    placeholder: '请输入搜索内容',
    size: 'default',
    clearable: true,
    disabled: false,
    prefixIcon: undefined,
    suffixIcon: undefined,
    maxlength: undefined,
    showWordLimit: false,
    showSearchButton: true,
    buttonText: '搜索',
    buttonType: 'primary',
    padding: 16,
    backgroundColor: 'transparent',
    borderColor: '#dcdfe6',
    borderFocusColor: '#409eff',
    borderHoverColor: '#c0c4cc',
    textColor: '#606266',
    placeholderColor: '#a8abb2',
    fontSize: 14,
    inputWidth: '100%',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  input: [value: string]
  change: [value: string]
  clear: []
  search: [value: string]
  focus: []
  blur: []
}>()

// 内部值
const internalValue = ref(props.modelValue)

// 监听外部值变化
watch(
  () => props.modelValue,
  (newVal) => {
    internalValue.value = newVal
  },
)

// 样式
const containerStyle = computed<CSSProperties>(() => ({
  padding: `${props.padding}px`,
  backgroundColor: props.backgroundColor,
}))

const inputStyle = computed<CSSProperties>(
  () =>
    ({
      width: props.inputWidth,
      fontSize: `${props.fontSize}px`,
      '--el-input-border-color': props.borderColor,
      '--el-input-focus-border-color': props.borderFocusColor,
      '--el-input-hover-border-color': props.borderHoverColor,
      '--el-input-text-color': props.textColor,
      '--el-input-placeholder-color': props.placeholderColor,
    }) as CSSProperties,
)

// 事件处理
const handleInput = (value: string) => {
  emit('update:modelValue', value)
  emit('input', value)
}

const handleChange = (value: string) => {
  emit('change', value)
}

const handleClear = () => {
  emit('clear')
}

const handleSearch = () => {
  emit('search', internalValue.value)
}

const handleFocus = () => {
  emit('focus')
}

const handleBlur = () => {
  emit('blur')
}
</script>

<style scoped>
.el-input {
  width: v-bind('inputStyle.width');
  font-size: v-bind('inputStyle.fontSize');
}

:deep(.el-input__wrapper) {
  --el-input-border-color: v-bind('inputStyle["--el-input-border-color"]');
  --el-input-focus-border-color: v-bind('inputStyle["--el-input-focus-border-color"]');
  --el-input-hover-border-color: v-bind('inputStyle["--el-input-hover-border-color"]');
}

:deep(.el-input__inner) {
  color: v-bind('inputStyle["--el-input-text-color"]');
}

:deep(.el-input__inner::placeholder) {
  color: v-bind('inputStyle["--el-input-placeholder-color"]');
}
</style>
