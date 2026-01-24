<template>
  <div class="pagination-container" :style="containerStyle">
    <el-pagination
      v-model:current-page="internalPage"
      v-model:page-size="internalSize"
      :page-sizes="pageSizes"
      :layout="layout"
      :total="total"
      :background="background"
      :small="small"
      @current-change="handlePageChange"
      @size-change="handleSizeChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'
import { ElPagination } from 'element-plus'

export interface PaginationProps {
  currentPage?: number
  pageSize?: number
  total?: number
  pageSizes?: number[]
  layout?: string
  background?: boolean
  small?: boolean
  backgroundColor?: string
}

const props = withDefaults(defineProps<PaginationProps>(), {
  currentPage: 1,
  pageSize: 10,
  total: 100,
  pageSizes: () => [10, 20, 50, 100],
  layout: 'prev, pager, next, sizes, total',
  background: true,
  small: false,
  backgroundColor: 'transparent',
})

const emit = defineEmits<{
  'update:currentPage': [page: number]
  'update:pageSize': [size: number]
  pageChange: [page: number]
  sizeChange: [size: number]
}>()

const internalPage = ref(props.currentPage)
const internalSize = ref(props.pageSize)

// 监听外部 props 变化
watch(
  () => props.currentPage,
  (val) => {
    internalPage.value = val
  },
)

watch(
  () => props.pageSize,
  (val) => {
    internalSize.value = val
  },
)

const containerStyle = computed<CSSProperties>(() => ({
  '--el-pagination-bg-color': props.backgroundColor,
}))

function handlePageChange(page: number) {
  emit('update:currentPage', page)
  emit('pageChange', page)
}

function handleSizeChange(size: number) {
  emit('update:pageSize', size)
  emit('sizeChange', size)
}
</script>

<style scoped>
.pagination-container {
  display: flex;
  justify-content: center;
  padding: 8px;
}

:deep(.el-pagination) {
  justify-content: center;
}
</style>
