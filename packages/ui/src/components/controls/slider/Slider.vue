<template>
  <div :style="containerStyle">
    <el-slider
      v-model="internalValue"
      :min="min"
      :max="max"
      :step="step"
      :disabled="disabled"
      :show-stops="showStops"
      :show-tooltip="showTooltip"
      :format-tooltip="formatTooltipFn"
      :range="range"
      :vertical="vertical"
      :height="height"
      :marks="marks"
      @change="handleChange"
      @input="handleInput"
    />
    <div v-if="showValue" :style="valueStyle" class="slider-value">
      {{ displayValue }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'
import { ElSlider } from 'element-plus'

const props = withDefaults(
  defineProps<{
    modelValue?: number | number[]
    min?: number
    max?: number
    step?: number
    disabled?: boolean
    showStops?: boolean
    showTooltip?: boolean
    range?: boolean
    vertical?: boolean
    height?: string
    marks?: Record<number, string | { style?: CSSProperties; label: string }>
    showValue?: boolean
    valueFormat?: string
    padding?: number
    backgroundColor?: string
    activeColor?: string
    inactiveColor?: string
    buttonSize?: number
    valueFontSize?: number
    valueColor?: string
    valueAlign?: 'left' | 'center' | 'right'
  }>(),
  {
    modelValue: 0,
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
    showStops: false,
    showTooltip: true,
    range: false,
    vertical: false,
    height: '200px',
    marks: undefined,
    showValue: true,
    valueFormat: '{value}',
    padding: 16,
    backgroundColor: 'transparent',
    activeColor: '#409eff',
    inactiveColor: '#e4e7ed',
    buttonSize: 20,
    valueFontSize: 14,
    valueColor: '#606266',
    valueAlign: 'center',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: number | number[]]
  change: [value: number | number[]]
  input: [value: number | number[]]
}>()

// 内部值
const internalValue = ref<number | number[]>(
  props.range
    ? Array.isArray(props.modelValue)
      ? [...props.modelValue]
      : [props.min, props.max]
    : Array.isArray(props.modelValue)
      ? props.modelValue[0]
      : props.modelValue,
)

// 监听外部值变化
watch(
  () => props.modelValue,
  (newVal) => {
    if (props.range) {
      internalValue.value = Array.isArray(newVal) ? [...newVal] : [props.min, props.max]
    } else {
      internalValue.value = Array.isArray(newVal) ? newVal[0] : newVal
    }
  },
)

// 样式
const containerStyle = computed<CSSProperties>(
  () =>
    ({
      padding: `${props.padding}px`,
      backgroundColor: props.backgroundColor,
      '--el-slider-main-bg-color': props.activeColor,
      '--el-slider-runway-bg-color': props.inactiveColor,
      '--el-slider-button-size': `${props.buttonSize}px`,
    }) as CSSProperties,
)

const valueStyle = computed<CSSProperties>(() => ({
  marginTop: '8px',
  fontSize: `${props.valueFontSize}px`,
  color: props.valueColor,
  textAlign: props.valueAlign,
}))

// 格式化提示
const formatTooltipFn = (val: number) => {
  return props.valueFormat.replace('{value}', String(val))
}

// 显示值
const displayValue = computed(() => {
  if (Array.isArray(internalValue.value)) {
    return `${internalValue.value[0]} - ${internalValue.value[1]}`
  }
  return formatTooltipFn(internalValue.value)
})

// 事件处理
const handleChange = (value: number | number[]) => {
  emit('update:modelValue', value)
  emit('change', value)
}

const handleInput = (value: number | number[]) => {
  emit('input', value)
}
</script>

<style scoped>
.slider-value {
  margin-top: 8px;
}

:deep(.el-slider) {
  --el-slider-main-bg-color: v-bind('containerStyle["--el-slider-main-bg-color"]');
  --el-slider-runway-bg-color: v-bind('containerStyle["--el-slider-runway-bg-color"]');
  --el-slider-button-size: v-bind('containerStyle["--el-slider-button-size"]');
}
</style>
