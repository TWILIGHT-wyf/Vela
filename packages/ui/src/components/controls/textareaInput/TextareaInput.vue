<template>
  <div class="textarea-input-container" :style="containerStyle">
    <el-input
      v-model="internalValue"
      type="textarea"
      :placeholder="placeholder"
      :disabled="disabled"
      :size="size"
      :rows="rows"
      :autosize="autosize"
      :maxlength="maxlength"
      :show-word-limit="showWordLimit"
      :resize="resize"
      :style="inputStyle"
      @input="handleInput"
      @change="handleChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'
import { ElInput } from 'element-plus'

type AutoSize = boolean | { minRows?: number; maxRows?: number }

const props = withDefaults(
  defineProps<{
    modelValue?: string
    defaultValue?: string
    placeholder?: string
    disabled?: boolean
    size?: 'large' | 'default' | 'small'
    rows?: number
    autosize?: AutoSize
    maxlength?: number
    showWordLimit?: boolean
    resize?: 'none' | 'both' | 'horizontal' | 'vertical'
    padding?: number
    backgroundColor?: string
    borderRadius?: number
    opacity?: number
    inputWidth?: number
  }>(),
  {
    modelValue: '',
    defaultValue: '',
    placeholder: '请输入',
    disabled: false,
    size: 'default',
    rows: 4,
    autosize: false,
    maxlength: undefined,
    showWordLimit: false,
    resize: 'vertical',
    padding: 8,
    backgroundColor: 'transparent',
    borderRadius: 4,
    opacity: 100,
    inputWidth: 100,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  input: [value: string]
  change: [value: string]
}>()

const internalValue = ref(props.modelValue || props.defaultValue || '')

watch(
  () => [props.modelValue, props.defaultValue],
  ([modelValue, defaultValue]) => {
    internalValue.value = modelValue ?? defaultValue ?? ''
  },
)

const containerStyle = computed<CSSProperties>(() => ({
  opacity: props.opacity / 100,
  display: 'flex',
  alignItems: 'stretch',
  width: '100%',
  height: '100%',
  padding: `${props.padding}px`,
  backgroundColor: props.backgroundColor,
  borderRadius: `${props.borderRadius}px`,
  boxSizing: 'border-box',
}))

const inputStyle = computed<CSSProperties>(() => ({
  width: `${props.inputWidth}%`,
}))

function handleInput(value: string) {
  emit('update:modelValue', value)
  emit('input', value)
}

function handleChange(value: string) {
  emit('change', value)
}
</script>

<style scoped>
.textarea-input-container {
  box-sizing: border-box;
}
</style>
