<template>
  <div class="date-picker-container" :style="containerStyle">
    <el-date-picker
      v-model="internalValue"
      type="date"
      :placeholder="placeholder"
      :format="format"
      :value-format="valueFormat"
      :disabled="disabled"
      :clearable="clearable"
      :size="size"
      :style="pickerStyle"
      @change="handleChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'
import { ElDatePicker } from 'element-plus'

const props = withDefaults(
  defineProps<{
    modelValue?: string | null
    placeholder?: string
    format?: string
    valueFormat?: string
    disabled?: boolean
    clearable?: boolean
    size?: 'large' | 'default' | 'small'
    padding?: number
    backgroundColor?: string
    borderRadius?: number
    opacity?: number
    pickerWidth?: number
  }>(),
  {
    modelValue: null,
    placeholder: '请选择日期',
    format: 'YYYY-MM-DD',
    valueFormat: 'YYYY-MM-DD',
    disabled: false,
    clearable: true,
    size: 'default',
    padding: 8,
    backgroundColor: 'transparent',
    borderRadius: 4,
    opacity: 100,
    pickerWidth: 100,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
  change: [value: string | null]
}>()

const internalValue = ref<string | null>(props.modelValue)

watch(
  () => props.modelValue,
  (newVal) => {
    internalValue.value = newVal
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

const pickerStyle = computed<CSSProperties>(() => ({
  width: `${props.pickerWidth}%`,
}))

function handleChange(value: string | null) {
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<style scoped>
.date-picker-container {
  box-sizing: border-box;
}
</style>
