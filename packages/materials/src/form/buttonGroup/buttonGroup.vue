<template>
  <BaseButtonGroup v-bind="buttonGroupProps" @click="handleClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { vButtonGroup as BaseButtonGroup, useDataSource, extractWithFallback } from '@vela/ui'

interface ButtonItem {
  label: string
  value: string | number
  type?: 'default' | 'primary' | 'success' | 'warning' | 'info' | 'danger'
  icon?: string
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
    buttons?: ButtonItem[] | string
    type?: 'default' | 'primary' | 'success' | 'warning' | 'info' | 'danger'
    size?: 'large' | 'default' | 'small'
    disabled?: boolean
    plain?: boolean
    round?: boolean
    circle?: boolean
    padding?: number
    backgroundColor?: string
    labelField?: string
    valueField?: string
    dataSource?: DataSourceLike
  }>(),
  {
    buttons: () => [],
    type: 'default',
    size: 'default',
    disabled: false,
    plain: false,
    round: false,
    circle: false,
    padding: 16,
    backgroundColor: 'transparent',
    labelField: 'label',
    valueField: 'value',
  },
)

const emit = defineEmits<{
  click: [button: ButtonItem]
}>()

const dataSourceRef = computed(() => props.dataSource)
const { data: remoteData } = useDataSource(dataSourceRef)

const resolvedButtons = computed<ButtonItem[]>(() => {
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
            type: (obj.type as ButtonItem['type']) || undefined,
            icon: obj.icon ? String(obj.icon) : undefined,
            disabled: Boolean(obj.disabled),
          }
        }
        return { label: String(item), value: String(item) }
      })
    }
  }

  if (Array.isArray(props.buttons)) {
    return props.buttons
  }
  if (typeof props.buttons === 'string') {
    return props.buttons.split(',').map((item) => {
      const text = item.trim()
      return { label: text, value: text }
    })
  }
  return []
})

const buttonGroupProps = computed(() => ({
  buttons: resolvedButtons.value,
  type: props.type,
  size: props.size,
  disabled: props.disabled,
  plain: props.plain,
  round: props.round,
  circle: props.circle,
  padding: props.padding,
  backgroundColor: props.backgroundColor,
}))

function handleClick(button: ButtonItem) {
  emit('click', button)
}
</script>
