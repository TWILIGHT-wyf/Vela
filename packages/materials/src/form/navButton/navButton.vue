<template>
  <NavButtonBase v-bind="buttonProps" @click="handleClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useComponent } from '@vela/editor/stores/component'
import { storeToRefs } from 'pinia'
import { vNavButton as NavButtonBase } from '@vela/ui'

const props = defineProps<{
  id: string
}>()

const emit = defineEmits<{
  (
    e: 'component-event',
    payload: { componentId: string; eventType: string; actions: unknown[] },
  ): void
}>()

const { componentStore } = storeToRefs(useComponent())
const comp = computed(() => componentStore.value.find((c) => c.id === props.id))

// 聚合 props 传给基础组件
const buttonProps = computed(() => {
  const p = comp.value?.props || {}
  const s = comp.value?.style || {}

  return {
    label: String(p.label || '跳转'),
    showLabel: p.showLabel !== false,
    icon: String(p.icon || 'ArrowRight'),
    iconSize: Number(p.iconSize) || 20,
    backgroundColor: typeof s.backgroundColor === 'string' ? s.backgroundColor : '#409eff',
    color: typeof s.color === 'string' ? s.color : '#ffffff',
    borderRadius: Number(s.borderRadius) || 8,
    paddingX: Number(s.paddingX) || 24,
    paddingY: Number(s.paddingY) || 12,
    fontSize: Number(p.fontSize) || 14,
    shadow: Boolean(s.shadow),
  }
})

// 点击处理
function handleClick() {
  const events = comp.value?.events
  const p = comp.value?.props || {}

  // 如果配置了事件，触发事件
  if (events?.click?.length) {
    emit('component-event', {
      componentId: props.id,
      eventType: 'click',
      actions: events.click,
    })
    return
  }

  // 默认行为：跳转
  const url = String(p.url || '')
  const targetPageId = String(p.targetPageId || '')
  const openInNewTab = Boolean(p.openInNewTab)

  if (url) {
    if (openInNewTab) {
      window.open(url, '_blank')
    } else {
      window.location.href = url
    }
  } else if (targetPageId) {
    // 页面跳转通过事件系统处理
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
