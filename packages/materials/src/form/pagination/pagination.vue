<template>
  <PaginationBase
    v-bind="paginationProps"
    @page-change="handlePageChange"
    @size-change="handleSizeChange"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useComponent } from '@vela/editor/stores/component'
import { storeToRefs } from 'pinia'
import { vPagination as PaginationBase } from '@vela/ui'

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

const currentPage = ref(1)
const pageSize = ref(10)

// 同步 props 中的初始值
watch(
  () => comp.value?.props.currentPage,
  (val) => {
    if (val) currentPage.value = Number(val)
  },
  { immediate: true },
)

watch(
  () => comp.value?.props.pageSize,
  (val) => {
    if (val) pageSize.value = Number(val)
  },
  { immediate: true },
)

// 聚合 props
const paginationProps = computed(() => {
  const p = comp.value?.props || {}
  const s = comp.value?.style || {}

  const pageSizes = Array.isArray(p.pageSizes) ? p.pageSizes : [10, 20, 50, 100]

  return {
    currentPage: currentPage.value,
    pageSize: pageSize.value,
    total: Number(p.total) || 100,
    pageSizes: pageSizes as number[],
    layout: String(p.layout || 'prev, pager, next, sizes, total'),
    background: p.background !== false,
    small: Boolean(p.small),
    backgroundColor: typeof s.backgroundColor === 'string' ? s.backgroundColor : 'transparent',
  }
})

function handlePageChange(page: number) {
  currentPage.value = page
  const events = comp.value?.events?.custom?.['page-change']
  if (events?.length) {
    emit('component-event', {
      componentId: props.id,
      eventType: 'page-change',
      actions: events,
    })
  }
}

function handleSizeChange(size: number) {
  pageSize.value = size
  const events = comp.value?.events?.custom?.['size-change']
  if (events?.length) {
    emit('component-event', {
      componentId: props.id,
      eventType: 'size-change',
      actions: events,
    })
  }
}
</script>
