<template>
  <BaseDateRange v-bind="dateRangeProps" @change="handleChange" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useComponent } from '@vela/editor/stores/component'
import { storeToRefs } from 'pinia'
import { vDateRange as BaseDateRange } from '@vela/ui'

const props = defineProps<{ id: string }>()
const { componentStore } = storeToRefs(useComponent())

const comp = computed(() => componentStore.value.find((c) => c.id === props.id))

// 日期范围值
const dateRange = ref<[Date, Date] | null>(null)

// 监听默认值变化
watch(
  () => comp.value?.props.defaultValue,
  (newVal) => {
    if (Array.isArray(newVal) && newVal.length === 2) {
      dateRange.value = [new Date(newVal[0] as string), new Date(newVal[1] as string)]
    }
  },
  { immediate: true },
)

// 聚合 props
const dateRangeProps = computed(() => {
  const p = comp.value?.props || {}
  const s = comp.value?.style || {}

  return {
    modelValue: dateRange.value,
    rangeSeparator: p.rangeSeparator ?? '至',
    startPlaceholder: p.startPlaceholder ?? '开始日期',
    endPlaceholder: p.endPlaceholder ?? '结束日期',
    format: p.format ?? 'YYYY-MM-DD',
    valueFormat: p.valueFormat ?? 'YYYY-MM-DD',
    disabled: p.disabled ?? false,
    clearable: p.clearable ?? true,
    size: p.size ?? 'default',
    editable: p.editable ?? false,
    enableShortcuts: p.enableShortcuts ?? true,
    padding: s.padding ?? 8,
    backgroundColor: s.backgroundColor ?? 'transparent',
    borderRadius: s.borderRadius ?? 4,
    opacity: s.opacity ?? 100,
    pickerWidth: s.pickerWidth ?? 100,
    borderColor: s.borderColor ?? '#dcdfe6',
    focusBorderColor: s.focusBorderColor ?? '#409eff',
    hoverBorderColor: s.hoverBorderColor ?? '#c0c4cc',
  }
})

// 事件
function handleChange(value: [Date, Date] | null) {
  dateRange.value = value
  console.log('Date range changed:', value)
}
</script>
