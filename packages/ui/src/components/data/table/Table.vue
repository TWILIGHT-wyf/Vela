<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'
import { ElTable, ElTableColumn } from 'element-plus'
import type { TableColumn } from '@vela/core/types'

const props = withDefaults(
  defineProps<{
    // 数据
    data?: Record<string, unknown>[]
    columns?: TableColumn[]
    // 配置
    stripe?: boolean
    border?: boolean
    size?: 'large' | 'default' | 'small'
    autoHeight?: boolean
    maxHeight?: number
    highlightCurrentRow?: boolean
    showHeader?: boolean
    emptyText?: string
    // 样式
    opacity?: number
    visible?: boolean
    headerBackgroundColor?: string
    headerTextColor?: string
    headerFontSize?: number
    headerFontWeight?: string
    fontSize?: number
    textColor?: string
    rowBackgroundColor?: string
  }>(),
  {
    data: () => [],
    columns: () => [],
    stripe: true,
    border: true,
    size: 'default',
    autoHeight: false,
    maxHeight: undefined,
    highlightCurrentRow: true,
    showHeader: true,
    emptyText: '暂无数据',
    opacity: 100,
    visible: true,
    headerBackgroundColor: '#f5f7fa',
    headerTextColor: '#606266',
    headerFontSize: 14,
    headerFontWeight: 'bold',
    fontSize: 14,
    textColor: '#606266',
    rowBackgroundColor: '#ffffff',
  },
)

const emit = defineEmits<{
  (e: 'row-click', row: Record<string, unknown>): void
}>()

// 默认数据
const defaultData = [
  { name: '数据1', value: 100, status: '正常' },
  { name: '数据2', value: 200, status: '正常' },
  { name: '数据3', value: 150, status: '警告' },
]

const defaultColumns: TableColumn[] = [
  { prop: 'name', label: '名称', align: 'left' },
  { prop: 'value', label: '数值', align: 'right' },
  { prop: 'status', label: '状态', align: 'center' },
]

const tableData = computed(() => (props.data.length > 0 ? props.data : defaultData))
const tableColumns = computed(() => (props.columns.length > 0 ? props.columns : defaultColumns))

// 样式
const containerStyle = computed<CSSProperties>(() => ({
  opacity: props.opacity / 100,
  display: props.visible === false ? 'none' : 'block',
  width: '100%',
  height: '100%',
}))

const headerCellStyle = computed(() => ({
  backgroundColor: props.headerBackgroundColor,
  color: props.headerTextColor,
  fontSize: `${props.headerFontSize}px`,
  fontWeight: props.headerFontWeight,
}))

const cellStyle = computed(() => ({
  fontSize: `${props.fontSize}px`,
  color: props.textColor,
}))

const rowStyle = computed(() => ({
  backgroundColor: props.rowBackgroundColor,
}))

function handleRowClick(row: Record<string, unknown>) {
  emit('row-click', row)
}
</script>

<template>
  <div class="table-container" :style="containerStyle">
    <el-table
      :data="tableData"
      :stripe="stripe"
      :border="border"
      :size="size"
      :height="autoHeight ? undefined : '100%'"
      :max-height="maxHeight"
      :highlight-current-row="highlightCurrentRow"
      :show-header="showHeader"
      :empty-text="emptyText"
      :header-cell-style="headerCellStyle"
      :cell-style="cellStyle"
      :row-style="rowStyle"
      @row-click="handleRowClick"
    >
      <el-table-column
        v-for="(col, index) in tableColumns"
        :key="index"
        :prop="col.prop"
        :label="col.label"
        :width="col.width"
        :min-width="col.minWidth"
        :align="col.align"
        :sortable="col.sortable"
        :fixed="col.fixed || undefined"
      >
        <template v-if="col.type === 'index'" #default="scope">
          {{ scope.$index + 1 }}
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
.table-container {
  box-sizing: border-box;
  padding: 0;
}

:deep(.el-table) {
  width: 100%;
  height: 100%;
}
</style>
