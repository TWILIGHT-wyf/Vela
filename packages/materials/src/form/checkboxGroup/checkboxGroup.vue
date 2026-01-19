<template>
  <BaseCheckboxGroup v-bind="checkboxProps" @change="handleChange" />
</template>

<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue'
import { useComponent } from '@vela/editor/stores/component'
import { storeToRefs } from 'pinia'
import {
  vCheckboxGroup as BaseCheckboxGroup,
  useDataSource,
  extractWithFallback,
} from '@vela/ui'

// 选项接口
interface CheckboxOption {
  label: string
  value: string | number
  disabled?: boolean
}

const props = defineProps<{
  id: string
}>()

const { componentStore } = storeToRefs(useComponent())

// 从 store 获取组件配置
const comp = computed(() => componentStore.value.find((c) => c.id === props.id))

// 数据源
const dataSourceRef = toRef(() => comp.value?.dataSource)
const { data: remoteData } = useDataSource(dataSourceRef)

// 字段映射
const labelField = computed(() => String(comp.value?.props.labelField || 'label'))
const valueField = computed(() => String(comp.value?.props.valueField || 'value'))

// 选项数据
const options = computed<CheckboxOption[]>(() => {
  const ds = comp.value?.dataSource
  const localOptions = comp.value?.props.options as CheckboxOption[] | string

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

// 复选框值
const checkboxValue = ref<(string | number)[]>([])

// 监听默认值变化
watch(
  () => comp.value?.props.defaultValue,
  (newVal) => {
    if (newVal) {
      if (typeof newVal === 'string') {
        checkboxValue.value = newVal.split(',').map((s) => s.trim())
      } else if (Array.isArray(newVal)) {
        checkboxValue.value = newVal.map((v) => (typeof v === 'number' ? v : String(v))) as (
          | string
          | number
        )[]
      }
    }
  },
  { immediate: true },
)

// 聚合 props
const checkboxProps = computed(() => {
  const p = comp.value?.props || {}
  const s = comp.value?.style || {}

  return {
    modelValue: checkboxValue.value,
    options: options.value,
    size: p.size || 'default',
    disabled: p.disabled ?? false,
    min: p.min,
    max: p.max,
    layout: p.layout || 'default',
    showBorder: p.showBorder ?? false,
    direction: s.direction || 'horizontal',
    gap: s.gap || 12,
    padding: s.padding || 16,
    backgroundColor: s.backgroundColor || 'transparent',
    checkedColor: s.checkedColor || '#409eff',
    borderColor: s.borderColor || '#dcdfe6',
    textColor: s.textColor || '#606266',
  }
})

// 事件处理
const handleChange = (value: (string | number)[]) => {
  checkboxValue.value = value
  console.log('CheckboxGroup change:', value)
}
</script>
