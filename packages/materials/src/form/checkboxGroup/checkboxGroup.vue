<template>
  <BaseCheckboxGroup v-bind="checkboxProps" @change="handleChange" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { vCheckboxGroup as BaseCheckboxGroup, useDataSource, extractWithFallback } from '@vela/ui'

interface CheckboxOption {
  label: string
  value: string | number
  disabled?: boolean
}

type DataSourceLike = {
  enabled?: boolean
  dataPath?: string
  labelField?: string
  valueField?: string
  [key: string]: unknown
}

const props = withDefaults(
  defineProps<{
    modelValue?: (string | number)[]
    defaultValue?: (string | number)[] | string
    options?: CheckboxOption[] | string
    size?: 'large' | 'default' | 'small'
    disabled?: boolean
    min?: number
    max?: number
    layout?: 'default' | 'button'
    showBorder?: boolean
    direction?: 'horizontal' | 'vertical'
    gap?: number
    padding?: number
    backgroundColor?: string
    checkedColor?: string
    borderColor?: string
    textColor?: string
    labelField?: string
    valueField?: string
    dataSource?: DataSourceLike
  }>(),
  {
    modelValue: () => [],
    defaultValue: () => [],
    options: () => [],
    size: 'default',
    disabled: false,
    min: undefined,
    max: undefined,
    layout: 'default',
    showBorder: false,
    direction: 'horizontal',
    gap: 12,
    padding: 16,
    backgroundColor: 'transparent',
    checkedColor: '#409eff',
    borderColor: '#dcdfe6',
    textColor: '#606266',
    labelField: 'label',
    valueField: 'value',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: (string | number)[]]
  change: [value: (string | number)[]]
}>()

const dataSourceRef = computed(() => props.dataSource)
const { data: remoteData } = useDataSource(dataSourceRef)

const resolvedOptions = computed<CheckboxOption[]>(() => {
  if (props.dataSource?.enabled && remoteData.value) {
    const extracted = extractWithFallback(remoteData.value, props.dataSource.dataPath, [])
    if (Array.isArray(extracted)) {
      const labelField = props.labelField || props.dataSource.labelField || 'label'
      const valueField = props.valueField || props.dataSource.valueField || 'value'
      return extracted.map((item: unknown) => {
        if (typeof item === 'object' && item !== null) {
          const obj = item as Record<string, unknown>
          return {
            label: String(obj[labelField] ?? obj.label ?? ''),
            value: (obj[valueField] ?? obj.value ?? '') as string | number,
            disabled: Boolean(obj.disabled),
          }
        }
        return { label: String(item), value: String(item) }
      })
    }
  }

  if (Array.isArray(props.options)) {
    return props.options
  }
  if (typeof props.options === 'string') {
    return props.options.split(',').map((item) => {
      const text = item.trim()
      return { label: text, value: text }
    })
  }
  return []
})

const innerValue = ref<(string | number)[]>([])

watch(
  () => props.modelValue,
  (value) => {
    innerValue.value = Array.isArray(value) ? [...value] : []
  },
  { immediate: true },
)

watch(
  () => props.defaultValue,
  (value) => {
    if (Array.isArray(props.modelValue) && props.modelValue.length > 0) {
      return
    }
    if (typeof value === 'string') {
      innerValue.value = value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    } else if (Array.isArray(value)) {
      innerValue.value = value.map((item) => (typeof item === 'number' ? item : String(item)))
    }
  },
  { immediate: true },
)

const checkboxProps = computed(() => ({
  modelValue: innerValue.value,
  options: resolvedOptions.value,
  size: props.size,
  disabled: props.disabled,
  min: props.min,
  max: props.max,
  layout: props.layout,
  showBorder: props.showBorder,
  direction: props.direction,
  gap: props.gap,
  padding: props.padding,
  backgroundColor: props.backgroundColor,
  checkedColor: props.checkedColor,
  borderColor: props.borderColor,
  textColor: props.textColor,
}))

function handleChange(value: (string | number)[]) {
  innerValue.value = value
  emit('update:modelValue', value)
  emit('change', value)
}
</script>
