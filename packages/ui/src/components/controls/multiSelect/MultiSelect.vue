<template>
  <div class="multi-select-container" :style="containerStyle">
    <el-select
      v-model="internalValue"
      multiple
      :placeholder="placeholder"
      :clearable="clearable"
      :filterable="filterable"
      :disabled="disabled"
      :size="size"
      :collapse-tags="collapseTags"
      :collapse-tags-tooltip="collapseTagsTooltip"
      :max-collapse-tags="maxCollapseTags"
      :multiple-limit="multipleLimit"
      :style="selectStyle"
      @change="handleChange"
    >
      <el-option
        v-for="option in displayOptions"
        :key="option.value"
        :label="option.label"
        :value="option.value"
        :disabled="option.disabled"
      />
    </el-select>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'
import { ElSelect, ElOption } from 'element-plus'

// 选项接口
export interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue?: (string | number)[]
    options?: SelectOption[]
    placeholder?: string
    clearable?: boolean
    filterable?: boolean
    disabled?: boolean
    size?: 'large' | 'default' | 'small'
    collapseTags?: boolean
    collapseTagsTooltip?: boolean
    maxCollapseTags?: number
    multipleLimit?: number
    padding?: number
    backgroundColor?: string
    borderRadius?: number
    opacity?: number
    selectWidth?: number
    borderColor?: string
    focusBorderColor?: string
    hoverBorderColor?: string
    tagBackgroundColor?: string
    tagTextColor?: string
  }>(),
  {
    modelValue: () => [],
    options: () => [],
    placeholder: '请选择',
    clearable: true,
    filterable: false,
    disabled: false,
    size: 'default',
    collapseTags: true,
    collapseTagsTooltip: true,
    maxCollapseTags: 2,
    multipleLimit: 0,
    padding: 8,
    backgroundColor: 'transparent',
    borderRadius: 4,
    opacity: 100,
    selectWidth: 100,
    borderColor: '#dcdfe6',
    focusBorderColor: '#409eff',
    hoverBorderColor: '#c0c4cc',
    tagBackgroundColor: '#f0f2f5',
    tagTextColor: '#606266',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: (string | number)[]]
  change: [value: (string | number)[]]
}>()

// 默认选项
const defaultOptions: SelectOption[] = [
  { label: '选项 1', value: '1' },
  { label: '选项 2', value: '2' },
  { label: '选项 3', value: '3' },
  { label: '选项 4', value: '4' },
  { label: '选项 5', value: '5' },
]

// 显示的选项
const displayOptions = computed(() => {
  return props.options.length > 0 ? props.options : defaultOptions
})

// 内部值
const internalValue = ref<(string | number)[]>([...props.modelValue])

// 监听外部值变化
watch(
  () => props.modelValue,
  (newVal) => {
    internalValue.value = [...newVal]
  },
)

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

const selectStyle = computed<CSSProperties>(
  () =>
    ({
      width: `${props.selectWidth}%`,
      '--el-input-border-color': props.borderColor,
      '--el-input-focus-border-color': props.focusBorderColor,
      '--el-input-hover-border-color': props.hoverBorderColor,
      '--el-tag-bg-color': props.tagBackgroundColor,
      '--el-tag-text-color': props.tagTextColor,
    }) as CSSProperties,
)

// 事件
function handleChange(value: (string | number)[]) {
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<style scoped>
.multi-select-container {
  box-sizing: border-box;
}
</style>
