<template>
  <BreadcrumbBase v-bind="breadcrumbProps" @item-click="handleItemClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { vBreadcrumb as BreadcrumbBase } from '@vela/ui'

interface BreadcrumbItem {
  label: string
  pageId?: string
  url?: string
}

const props = withDefaults(
  defineProps<{
    id?: string
    items?: BreadcrumbItem[]
    separator?: string
    fontSize?: number
    color?: string
    activeColor?: string
    linkColor?: string
  }>(),
  {
    id: '',
    items: () => [],
    separator: '/',
    fontSize: 14,
    color: '#606266',
    activeColor: '#909399',
    linkColor: '#409eff',
  },
)

const emit = defineEmits<{
  (e: 'itemClick', item: BreadcrumbItem): void
  (
    e: 'component-event',
    payload: { componentId: string; eventType: string; actions: unknown[] },
  ): void
}>()

const breadcrumbProps = computed(() => ({
  items: props.items,
  separator: props.separator,
  fontSize: props.fontSize,
  color: props.color,
  activeColor: props.activeColor,
  linkColor: props.linkColor,
}))

function handleItemClick(item: BreadcrumbItem) {
  emit('itemClick', item)
  if (item.pageId) {
    emit('component-event', {
      componentId: props.id,
      eventType: 'click',
      actions: [{ id: 'nav', type: 'navigate', targetId: item.pageId }],
    })
    return
  }
  if (item.url) {
    window.open(item.url, '_blank')
  }
}
</script>
