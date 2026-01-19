<template>
  <BaseButtonGroup v-bind="buttonGroupProps" @click="handleClick" />
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import { useComponent } from '@vela/editor/stores/component'
import { storeToRefs } from 'pinia'
import {
  vButtonGroup as BaseButtonGroup,
  useDataSource,
  extractWithFallback,
} from '@vela/ui'

// 按钮接口
interface ButtonItem {
  label: string
  value: string | number
  type?: 'default' | 'primary' | 'success' | 'warning' | 'info' | 'danger'
  icon?: string
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

// 按钮数据
const buttons = computed<ButtonItem[]>(() => {
  const ds = comp.value?.dataSource
  const localButtons = comp.value?.props.buttons as ButtonItem[] | string

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
            type: (obj.type as ButtonItem['type']) || undefined,
            icon: obj.icon ? String(obj.icon) : undefined,
            disabled: Boolean(obj.disabled),
          }
        }
        return { label: String(item), value: String(item) }
      })
    }
  }

  // 本地按钮
  if (Array.isArray(localButtons)) return localButtons

  if (typeof localButtons === 'string') {
    return localButtons.split(',').map((s) => {
      const trimmed = s.trim()
      return { label: trimmed, value: trimmed }
    })
  }

  return []
})

// 聚合 props
const buttonGroupProps = computed(() => {
  const p = comp.value?.props || {}
  const s = comp.value?.style || {}

  return {
    buttons: buttons.value,
    type: p.type || 'default',
    size: p.size || 'default',
    disabled: p.disabled ?? false,
    plain: p.plain ?? false,
    round: p.round ?? false,
    circle: p.circle ?? false,
    padding: s.padding || 16,
    backgroundColor: s.backgroundColor || 'transparent',
  }
})

// 事件处理
const handleClick = (button: ButtonItem) => {
  console.log('Button clicked:', button)
}
</script>
