<template>
  <NavButtonBase v-bind="buttonProps" @click="handleClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { vNavButton as NavButtonBase } from '@vela/ui'

const props = withDefaults(
  defineProps<{
    id?: string
    label?: string
    showLabel?: boolean
    icon?: string
    iconSize?: number
    backgroundColor?: string
    color?: string
    borderRadius?: number
    paddingX?: number
    paddingY?: number
    fontSize?: number
    shadow?: boolean
    targetPageId?: string
    url?: string
    openInNewTab?: boolean
  }>(),
  {
    id: '',
    label: '跳转',
    showLabel: true,
    icon: 'ArrowRight',
    iconSize: 20,
    backgroundColor: '#409eff',
    color: '#ffffff',
    borderRadius: 8,
    paddingX: 24,
    paddingY: 12,
    fontSize: 14,
    shadow: false,
    targetPageId: '',
    url: '',
    openInNewTab: false,
  },
)

const emit = defineEmits<{
  (e: 'click'): void
  (
    e: 'component-event',
    payload: { componentId: string; eventType: string; actions: unknown[] },
  ): void
}>()

const buttonProps = computed(() => ({
  label: props.label,
  showLabel: props.showLabel,
  icon: props.icon,
  iconSize: props.iconSize,
  backgroundColor: props.backgroundColor,
  color: props.color,
  borderRadius: props.borderRadius,
  paddingX: props.paddingX,
  paddingY: props.paddingY,
  fontSize: props.fontSize,
  shadow: props.shadow,
}))

function handleClick() {
  emit('click')

  const url = String(props.url || '')
  const targetPageId = String(props.targetPageId || '')

  if (url) {
    if (props.openInNewTab) {
      window.open(url, '_blank')
    } else {
      window.location.href = url
    }
    return
  }

  if (targetPageId) {
    emit('component-event', {
      componentId: props.id,
      eventType: 'click',
      actions: [
        {
          id: 'nav-action',
          type: 'navigate-page',
          targetId: targetPageId,
        },
      ],
    })
  }
}
</script>
