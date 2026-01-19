<template>
  <BreadcrumbBase v-bind="breadcrumbProps" @item-click="handleItemClick" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useComponent } from '@vela/editor/stores/component'
import { storeToRefs } from 'pinia'
import { vBreadcrumb as BreadcrumbBase } from '@vela/ui'

interface BreadcrumbItem {
  label: string
  pageId?: string
  url?: string
}

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

// 解析面包屑项
function parseItems(): BreadcrumbItem[] {
  const raw = comp.value?.props.items
  if (Array.isArray(raw)) {
    return raw.map(
      (item): BreadcrumbItem => ({
        label: String((item as Record<string, unknown>)?.label || ''),
        pageId: (item as Record<string, unknown>)?.pageId as string | undefined,
        url: (item as Record<string, unknown>)?.url as string | undefined,
      }),
    )
  }
  return []
}

// 聚合 props
const breadcrumbProps = computed(() => {
  const p = comp.value?.props || {}
  const s = comp.value?.style || {}

  return {
    items: parseItems(),
    separator: String(p.separator || '/'),
    fontSize: Number(s.fontSize) || 14,
    color: typeof s.color === 'string' ? s.color : '#606266',
    activeColor: typeof s.activeColor === 'string' ? s.activeColor : '#909399',
    linkColor: typeof s.linkColor === 'string' ? s.linkColor : '#409eff',
  }
})

function handleItemClick(item: BreadcrumbItem) {
  if (item.pageId) {
    emit('component-event', {
      componentId: props.id,
      eventType: 'click',
      actions: [{ id: 'nav', type: 'navigate-page', targetId: item.pageId }],
    })
  } else if (item.url) {
    window.open(item.url, '_blank')
  }
}
</script>
