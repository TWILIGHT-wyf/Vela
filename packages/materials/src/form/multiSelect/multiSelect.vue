<template>
  <BaseMultiSelect v-bind="multiSelectProps" @change="handleChange" />
</template>

<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue'
import { useComponent } from '@vela/editor/stores/component'
import { storeToRefs } from 'pinia'
import {
  vMultiSelect as BaseMultiSelect,
  useDataSource,
  extractWithFallback,
} from '@vela/ui'

interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
}

const props = defineProps<{ id: string }>()
const { componentStore } = storeToRefs(useComponent())

const comp = computed(() => componentStore.value.find((c) => c.id === props.id))

// 数据源
const dataSourceRef = toRef(() => comp.value?.dataSource)
const { data: remoteData } = useDataSource(dataSourceRef)

// 选中值
const selectedValues = ref<(string | number)[]>([])

// 监听默认值变化
watch(
  () => comp.value?.props.defaultValue,
  (newVal) => {
    if (Array.isArray(newVal)) {
      selectedValues.value = newVal as (string | number)[]
    }
  },
  { immediate: true },
)

// 字段映射
const labelField = computed(() => (comp.value?.props.labelField as string) ?? 'label')
const valueField = computed(() => (comp.value?.props.valueField as string) ?? 'value')

// 选项数据
const options = computed<SelectOption[]>(() => {
  const ds = comp.value?.dataSource
  const localOptions = comp.value?.props.options as SelectOption[] | string

  // 如果启用了数据源
  if (ds?.enabled && remoteData.value) {
    const extracted = extractWithFallback(remoteData.value, ds.dataPath, [])
    if (Array.isArray(extracted)) {
      return extracted.map((item: unknown) => {
        if (typeof item === 'object' && item !== null) {
          const obj = item as Record<string, unknown>
          return {
            label: String(obj[labelField.value] ?? obj.label ?? ''),
            value: (obj[valueField.value] ?? obj.value ?? '') as string | number,
            disabled: Boolean(obj.disabled),
          }
        }
        return { label: String(item), value: String(item) }
      })
    }
  }

  // 本地选项
  if (Array.isArray(localOptions)) return localOptions

  if (typeof localOptions === 'string') {
    return localOptions.split(',').map((s) => {
      const trimmed = s.trim()
      return { label: trimmed, value: trimmed }
    })
  }

  return []
})

// 聚合 props
const multiSelectProps = computed(() => {
  const p = comp.value?.props || {}
  const s = comp.value?.style || {}

  return {
    modelValue: selectedValues.value,
    options: options.value,
    placeholder: p.placeholder ?? '请选择',
    clearable: p.clearable ?? true,
    filterable: p.filterable ?? false,
    disabled: p.disabled ?? false,
    size: p.size ?? 'default',
    collapseTags: p.collapseTags ?? true,
    collapseTagsTooltip: p.collapseTagsTooltip ?? true,
    maxCollapseTags: p.maxCollapseTags ?? 2,
    multipleLimit: p.multipleLimit ?? 0,
    padding: s.padding ?? 8,
    backgroundColor: s.backgroundColor ?? 'transparent',
    borderRadius: s.borderRadius ?? 4,
    opacity: s.opacity ?? 100,
    selectWidth: s.selectWidth ?? 100,
    borderColor: s.borderColor ?? '#dcdfe6',
    focusBorderColor: s.focusBorderColor ?? '#409eff',
    hoverBorderColor: s.hoverBorderColor ?? '#c0c4cc',
    tagBackgroundColor: s.tagBackgroundColor ?? '#f0f2f5',
    tagTextColor: s.tagTextColor ?? '#606266',
  }
})

// 事件
function handleChange(value: (string | number)[]) {
  selectedValues.value = value
  console.log('Multi-select changed:', value)
}
</script>
