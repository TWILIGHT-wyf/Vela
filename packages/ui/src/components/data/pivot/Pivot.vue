<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'
import type { TableColumnCtx } from 'element-plus'
import { ElTable, ElTableColumn, ElEmpty } from 'element-plus'

export interface PivotColumn {
  prop: string
  label: string
  width?: number
  align?: string
  sortable?: boolean
}

const props = withDefaults(
  defineProps<{
    // 数据
    data?: Record<string, unknown>[]
    // 配置
    rowHeaders?: string[] | string
    dataColumns?: PivotColumn[]
    columnLabels?: Record<string, string>
    stripe?: boolean
    border?: boolean
    size?: 'large' | 'default' | 'small'
    showSummary?: boolean
    emptyText?: string
    height?: string
    maxHeight?: string
    rowHeaderWidth?: number
    fixedRowHeaders?: boolean
    rowHeaderAlign?: string
    valueFormat?: 'number' | 'percent' | 'currency'
    highlightThreshold?: number
    // 样式
    opacity?: number
    visible?: boolean
    backgroundColor?: string
    borderRadius?: number
    padding?: number
    headerBackgroundColor?: string
    headerColor?: string
    hoverBackgroundColor?: string
    borderColor?: string
    highlightColor?: string
  }>(),
  {
    data: () => [],
    rowHeaders: () => ['category', 'region'],
    dataColumns: () => [],
    columnLabels: () => ({}),
    stripe: true,
    border: true,
    size: 'default',
    showSummary: true,
    emptyText: '暂无数据',
    height: 'auto',
    maxHeight: '',
    rowHeaderWidth: 120,
    fixedRowHeaders: true,
    rowHeaderAlign: 'left',
    valueFormat: 'number',
    highlightThreshold: 0,
    opacity: 100,
    visible: true,
    backgroundColor: '#ffffff',
    borderRadius: 4,
    padding: 0,
    headerBackgroundColor: '#f5f7fa',
    headerColor: '#909399',
    hoverBackgroundColor: '#f5f7fa',
    borderColor: '#ebeef5',
    highlightColor: '#67c23a',
  },
)

// 默认数据
const defaultData = [
  { category: '产品A', region: '华东', q1: 1200, q2: 1500, q3: 1800, q4: 2100 },
  { category: '产品A', region: '华南', q1: 1100, q2: 1300, q3: 1600, q4: 1900 },
  { category: '产品B', region: '华东', q1: 900, q2: 1100, q3: 1300, q4: 1500 },
  { category: '产品B', region: '华南', q1: 800, q2: 1000, q3: 1200, q4: 1400 },
]

const pivotData = computed(() => (props.data.length > 0 ? props.data : defaultData))

const rowHeadersList = computed(() => {
  if (Array.isArray(props.rowHeaders)) return props.rowHeaders
  if (typeof props.rowHeaders === 'string') return props.rowHeaders.split(',').map((s) => s.trim())
  return ['category', 'region']
})

const computedDataColumns = computed<PivotColumn[]>(() => {
  if (props.dataColumns.length > 0) return props.dataColumns

  // 从第一行数据推断列
  if (pivotData.value.length > 0) {
    const firstRow = pivotData.value[0]
    if (!firstRow) return []
    const cols: PivotColumn[] = []

    Object.keys(firstRow).forEach((key) => {
      if (!rowHeadersList.value.includes(key)) {
        cols.push({
          prop: key,
          label: key.toUpperCase(),
          width: 100,
          align: 'center',
          sortable: true,
        })
      }
    })

    return cols
  }

  return []
})

function getColumnLabel(prop: string): string {
  return props.columnLabels[prop] || prop
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '-'

  const numValue = Number(value)
  if (isNaN(numValue)) return String(value)

  switch (props.valueFormat) {
    case 'number':
      return numValue.toLocaleString()
    case 'percent':
      return `${(numValue * 100).toFixed(2)}%`
    case 'currency':
      return `¥${numValue.toLocaleString()}`
    default:
      return String(value)
  }
}

function getCellStyle(value: unknown): CSSProperties {
  const numValue = Number(value)

  if (!isNaN(numValue) && props.highlightThreshold > 0) {
    if (numValue >= props.highlightThreshold) {
      return {
        color: props.highlightColor,
        fontWeight: 'bold',
      }
    }
  }

  return {}
}

function getSummaries(param: {
  columns: TableColumnCtx<Record<string, unknown>>[]
  data: Record<string, unknown>[]
}) {
  const { columns, data } = param
  const sums: string[] = []

  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = '合计'
      return
    }

    if (rowHeadersList.value.includes(column.property)) {
      sums[index] = ''
      return
    }

    const values = data.map((item) => Number(item[column.property]))
    if (values.every((value) => !isNaN(value))) {
      const sum = values.reduce((prev, curr) => prev + curr, 0)
      sums[index] = formatValue(sum)
    } else {
      sums[index] = '-'
    }
  })

  return sums
}

// 样式
const containerStyle = computed<CSSProperties>(() => ({
  opacity: props.opacity / 100,
  display: props.visible === false ? 'none' : 'block',
  width: '100%',
  height: '100%',
  backgroundColor: props.backgroundColor,
  borderRadius: `${props.borderRadius}px`,
  padding: `${props.padding}px`,
  overflow: 'hidden',
  boxSizing: 'border-box',
}))

const tableStyle = computed<CSSProperties>(
  () =>
    ({
      '--el-table-header-bg-color': props.headerBackgroundColor,
      '--el-table-header-text-color': props.headerColor,
      '--el-table-row-hover-bg-color': props.hoverBackgroundColor,
      '--el-table-border-color': props.borderColor,
    }) as CSSProperties,
)
</script>

<template>
  <div class="pivot-container" :style="containerStyle">
    <div v-if="pivotData.length === 0" class="empty-state">
      <el-empty :description="emptyText" :image-size="80" />
    </div>
    <el-table
      v-else
      :data="pivotData"
      :stripe="stripe"
      :border="border"
      :size="size"
      :show-summary="showSummary"
      :summary-method="getSummaries"
      :height="height === 'auto' ? undefined : height"
      :max-height="maxHeight || undefined"
      :style="tableStyle"
    >
      <!-- 行表头列 -->
      <el-table-column
        v-for="rowHeader in rowHeadersList"
        :key="rowHeader"
        :prop="rowHeader"
        :label="getColumnLabel(rowHeader)"
        :width="rowHeaderWidth"
        :fixed="fixedRowHeaders"
        :align="rowHeaderAlign"
      />

      <!-- 数据列 -->
      <el-table-column
        v-for="col in computedDataColumns"
        :key="col.prop"
        :prop="col.prop"
        :label="col.label"
        :width="col.width"
        :align="col.align || 'center'"
        :sortable="col.sortable"
      >
        <template #default="{ row }">
          <span :style="getCellStyle(row[col.prop])">
            {{ formatValue(row[col.prop]) }}
          </span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
.pivot-container {
  box-sizing: border-box;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}
</style>
