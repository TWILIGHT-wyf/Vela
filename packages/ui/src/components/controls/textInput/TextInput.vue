<template>
  <div class="text-input-container" :style="containerStyle">
    <el-input
      v-model="internalValue"
      :type="type"
      :placeholder="placeholder"
      :clearable="clearable"
      :disabled="disabled"
      :size="size"
      :maxlength="maxlength"
      :show-word-limit="showWordLimit"
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

const props = withDefaults(
  defineProps<{
    modelValue?: string
    defaultValue?: string
    type?: 'text' | 'password' | 'email' | 'tel' | 'url'
    placeholder?: string
    clearable?: boolean
    disabled?: boolean
    size?: 'large' | 'default' | 'small'
    maxlength?: number
    showWordLimit?: boolean
    padding?: number
    backgroundColor?: string
    borderRadius?: number
    opacity?: number
    inputWidth?: number
  }>(),
  {
    modelValue: '',
    defaultValue: '',
    type: 'text',
    placeholder: '请输入',
    clearable: true,
    disabled: false,
    size: 'default',
    maxlength: undefined,
    showWordLimit: false,
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
  alignItems: 'center',
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
.text-input-container {
  box-sizing: border-box;
}
</style>
