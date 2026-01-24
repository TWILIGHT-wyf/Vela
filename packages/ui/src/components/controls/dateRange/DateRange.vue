<template>
  <div class="date-range-container" :style="containerStyle">
    <el-date-picker
      v-model="internalValue"
      type="daterange"
      :range-separator="rangeSeparator"
      :start-placeholder="startPlaceholder"
      :end-placeholder="endPlaceholder"
      :format="format"
      :value-format="valueFormat"
      :disabled="disabled"
      :clearable="clearable"
      :size="size"
      :editable="editable"
      :shortcuts="computedShortcuts"
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
    modelValue?: [Date, Date] | null
    rangeSeparator?: string
    startPlaceholder?: string
    endPlaceholder?: string
    format?: string
    valueFormat?: string
    disabled?: boolean
    clearable?: boolean
    size?: 'large' | 'default' | 'small'
    editable?: boolean
    enableShortcuts?: boolean
    padding?: number
    backgroundColor?: string
    borderRadius?: number
    opacity?: number
    pickerWidth?: number
    borderColor?: string
    focusBorderColor?: string
    hoverBorderColor?: string
  }>(),
  {
    modelValue: null,
    rangeSeparator: '至',
    startPlaceholder: '开始日期',
    endPlaceholder: '结束日期',
    format: 'YYYY-MM-DD',
    valueFormat: 'YYYY-MM-DD',
    disabled: false,
    clearable: true,
    size: 'default',
    editable: false,
    enableShortcuts: true,
    padding: 8,
    backgroundColor: 'transparent',
    borderRadius: 4,
    opacity: 100,
    pickerWidth: 100,
    borderColor: '#dcdfe6',
    focusBorderColor: '#409eff',
    hoverBorderColor: '#c0c4cc',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: [Date, Date] | null]
  change: [value: [Date, Date] | null]
}>()

// 内部值
const internalValue = ref<[Date, Date] | null>(props.modelValue)

// 监听外部值变化
watch(
  () => props.modelValue,
  (newVal) => {
    internalValue.value = newVal
  },
)

// 快捷选项
const computedShortcuts = computed(() => {
  if (!props.enableShortcuts) return []

  return [
    {
      text: '最近一周',
      value: () => {
        const end = new Date()
        const start = new Date()
        start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
        return [start, end]
      },
    },
    {
      text: '最近一个月',
      value: () => {
        const end = new Date()
        const start = new Date()
        start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
        return [start, end]
      },
    },
    {
      text: '最近三个月',
      value: () => {
        const end = new Date()
        const start = new Date()
        start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
        return [start, end]
      },
    },
    {
      text: '本月',
      value: () => {
        const now = new Date()
        const start = new Date(now.getFullYear(), now.getMonth(), 1)
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        return [start, end]
      },
    },
    {
      text: '本年',
      value: () => {
        const now = new Date()
        const start = new Date(now.getFullYear(), 0, 1)
        const end = new Date(now.getFullYear(), 11, 31)
        return [start, end]
      },
    },
  ]
})

// 样式
const containerStyle = computed<CSSProperties>(() => ({
  opacity: props.opacity / 100,
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  height: '100%',
  padding: `${props.padding}px`,
  backgroundColor: props.backgroundColor,
  borderRadius: `${props.borderRadius}px`,
}))

const pickerStyle = computed<CSSProperties>(
  () =>
    ({
      width: `${props.pickerWidth}%`,
      '--el-input-border-color': props.borderColor,
      '--el-input-focus-border-color': props.focusBorderColor,
      '--el-input-hover-border-color': props.hoverBorderColor,
    }) as CSSProperties,
)

// 事件
function handleChange(value: [Date, Date] | null) {
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<style scoped>
.date-range-container {
  box-sizing: border-box;
}
</style>
