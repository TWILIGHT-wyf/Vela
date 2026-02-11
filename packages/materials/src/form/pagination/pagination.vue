<template>
  <PaginationBase
    v-bind="paginationProps"
    @page-change="handlePageChange"
    @size-change="handleSizeChange"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { vPagination as PaginationBase } from '@vela/ui'

const props = withDefaults(
  defineProps<{
    currentPage?: number
    pageSize?: number
    total?: number
    pageSizes?: number[]
    layout?: string
    background?: boolean
    small?: boolean
    backgroundColor?: string
  }>(),
  {
    currentPage: 1,
    pageSize: 10,
    total: 100,
    pageSizes: () => [10, 20, 50, 100],
    layout: 'prev, pager, next, sizes, total',
    background: true,
    small: false,
    backgroundColor: 'transparent',
  },
)

const emit = defineEmits<{
  (e: 'update:currentPage', page: number): void
  (e: 'update:pageSize', size: number): void
  (e: 'page-change', page: number): void
  (e: 'size-change', size: number): void
}>()

const innerCurrentPage = ref(1)
const innerPageSize = ref(10)

// 同步 props 中的初始值
watch(
  () => props.currentPage,
  (val) => {
    if (val !== undefined && val !== null) {
      innerCurrentPage.value = Number(val)
    }
  },
  { immediate: true },
)

watch(
  () => props.pageSize,
  (val) => {
    if (val !== undefined && val !== null) {
      innerPageSize.value = Number(val)
    }
  },
  { immediate: true },
)

// 聚合 props
const paginationProps = computed(() => {
  const pageSizes = Array.isArray(props.pageSizes) ? props.pageSizes : [10, 20, 50, 100]

  return {
    currentPage: innerCurrentPage.value,
    pageSize: innerPageSize.value,
    total: Number(props.total) || 100,
    pageSizes: pageSizes as number[],
    layout: String(props.layout || 'prev, pager, next, sizes, total'),
    background: props.background !== false,
    small: Boolean(props.small),
    backgroundColor:
      typeof props.backgroundColor === 'string' ? props.backgroundColor : 'transparent',
  }
})

function handlePageChange(page: number) {
  innerCurrentPage.value = page
  emit('update:currentPage', page)
  emit('page-change', page)
}

function handleSizeChange(size: number) {
  innerPageSize.value = size
  emit('update:pageSize', size)
  emit('size-change', size)
}
</script>
