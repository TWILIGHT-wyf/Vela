<template>
  <div class="number-input-container" :style="containerStyle">
    <el-input-number
      v-model="internalValue"
      :min="min"
      :max="max"
      :step="step"
      :precision="precision"
      :controls="controls"
      :disabled="disabled"
      :size="size"
      :placeholder="placeholder"
      :style="inputStyle"
      @change="handleChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'
import { ElInputNumber } from 'element-plus'

const props = withDefaults(
  defineProps<{
    modelValue?: number
    defaultValue?: number
    min?: number
    max?: number
    step?: number
    precision?: number
    controls?: boolean
    placeholder?: string
    disabled?: boolean
    size?: 'large' | 'default' | 'small'
    padding?: number
    backgroundColor?: string
    borderRadius?: number
    opacity?: number
    inputWidth?: number
  }>(),
  {
    modelValue: undefined,
    defaultValue: undefined,
    min: undefined,
    max: undefined,
    step: 1,
    precision: undefined,
    controls: true,
    placeholder: '请输入数字',
    disabled: false,
    size: 'default',
    padding: 8,
    backgroundColor: 'transparent',
    borderRadius: 4,
    opacity: 100,
    inputWidth: 100,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  change: [value: number | undefined]
}>()

const internalValue = ref<number | undefined>(props.modelValue ?? props.defaultValue)

watch(
  () => [props.modelValue, props.defaultValue],
  ([modelValue, defaultValue]) => {
    internalValue.value = modelValue ?? defaultValue
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

function handleChange(value: number | undefined) {
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<style scoped>
.number-input-container {
  box-sizing: border-box;
}
</style>
