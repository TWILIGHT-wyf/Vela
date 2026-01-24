<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'
import { Document, ArrowRight } from '@element-plus/icons-vue'
import { ElScrollbar, ElEmpty, ElIcon } from 'element-plus'

export interface ListItem {
  title?: string
  description?: string
  extra?: string
  [key: string]: unknown
}

const props = withDefaults(
  defineProps<{
    // 数据
    data?: ListItem[]
    // 字段映射
    titleField?: string
    descriptionField?: string
    extraField?: string
    // 配置
    showIcon?: boolean
    showTitle?: boolean
    showDescription?: boolean
    showExtra?: boolean
    showAction?: boolean
    showBorder?: boolean
    showSplit?: boolean
    emptyText?: string
    iconSize?: number
    scrollHeight?: string
    // 样式
    opacity?: number
    visible?: boolean
    backgroundColor?: string
    borderRadius?: number
    itemPadding?: number
    itemPaddingX?: number
    itemBackgroundColor?: string
    splitColor?: string
    borderColor?: string
    iconColor?: string
    titleFontSize?: number
    titleColor?: string
    titleFontWeight?: string
    descriptionFontSize?: number
    descriptionColor?: string
    extraFontSize?: number
    extraColor?: string
  }>(),
  {
    data: () => [],
    titleField: 'title',
    descriptionField: 'description',
    extraField: 'extra',
    showIcon: false,
    showTitle: true,
    showDescription: true,
    showExtra: false,
    showAction: true,
    showBorder: true,
    showSplit: true,
    emptyText: '暂无数据',
    iconSize: 20,
    scrollHeight: '100%',
    opacity: 100,
    visible: true,
    backgroundColor: '#ffffff',
    borderRadius: 4,
    itemPadding: 12,
    itemPaddingX: 16,
    itemBackgroundColor: '#ffffff',
    splitColor: '#e4e7ed',
    borderColor: 'transparent',
    iconColor: '#909399',
    titleFontSize: 15,
    titleColor: '#303133',
    titleFontWeight: '500',
    descriptionFontSize: 13,
    descriptionColor: '#909399',
    extraFontSize: 12,
    extraColor: '#409eff',
  },
)

const emit = defineEmits<{
  (e: 'item-click', item: ListItem, index: number): void
}>()

// 默认数据
const defaultData: ListItem[] = [
  { title: '列表项 1', description: '这是列表项的描述信息', extra: '详情' },
  { title: '列表项 2', description: '这是列表项的描述信息', extra: '详情' },
  { title: '列表项 3', description: '这是列表项的描述信息', extra: '详情' },
]

const listData = computed(() => (props.data.length > 0 ? props.data : defaultData))

const computedScrollHeight = computed(() => {
  const height = props.scrollHeight
  if (typeof height === 'number') return `${height}px`
  if (typeof height === 'string' && (height.endsWith('px') || height.endsWith('%'))) return height
  return '100%'
})

function getItemTitle(item: ListItem): string {
  return String(item[props.titleField] ?? '')
}

function getItemDescription(item: ListItem): string {
  return String(item[props.descriptionField] ?? '')
}

function getItemExtra(item: ListItem): string {
  return String(item[props.extraField] ?? '')
}

function getIcon() {
  return Document
}

// 样式
const containerStyle = computed<CSSProperties>(() => ({
  opacity: props.opacity / 100,
  display: props.visible === false ? 'none' : 'block',
  width: '100%',
  height: '100%',
  backgroundColor: props.backgroundColor,
  borderRadius: `${props.borderRadius}px`,
  overflow: 'hidden',
}))

const getItemStyle = (index: number): CSSProperties => ({
  padding: `${props.itemPadding}px ${props.itemPaddingX}px`,
  backgroundColor: props.itemBackgroundColor,
  borderBottom:
    props.showSplit && index < listData.value.length - 1 ? `1px solid ${props.splitColor}` : 'none',
  borderLeft: props.showBorder ? `3px solid ${props.borderColor}` : 'none',
  cursor: 'pointer',
  transition: 'all 0.2s',
})

const iconStyle = computed<CSSProperties>(() => ({
  color: props.iconColor,
}))

const titleStyle = computed<CSSProperties>(() => ({
  fontSize: `${props.titleFontSize}px`,
  color: props.titleColor,
  fontWeight: props.titleFontWeight,
  marginBottom: props.showDescription ? '4px' : '0',
}))

const descriptionStyle = computed<CSSProperties>(() => ({
  fontSize: `${props.descriptionFontSize}px`,
  color: props.descriptionColor,
  lineHeight: 1.5,
}))

const extraStyle = computed<CSSProperties>(() => ({
  fontSize: `${props.extraFontSize}px`,
  color: props.extraColor,
  marginTop: '4px',
}))

function handleItemClick(item: ListItem, index: number) {
  emit('item-click', item, index)
}
</script>

<template>
  <div class="list-container" :style="containerStyle">
    <el-scrollbar :height="computedScrollHeight">
      <div v-if="listData.length === 0" class="empty-state">
        <el-empty :description="emptyText" :image-size="80" />
      </div>
      <div v-else class="list-wrapper">
        <div
          v-for="(item, index) in listData"
          :key="index"
          class="list-item"
          :style="getItemStyle(index)"
          @click="handleItemClick(item, index)"
        >
          <!-- 带图标的列表项 -->
          <div v-if="showIcon" class="item-icon" :style="iconStyle">
            <el-icon :size="iconSize">
              <component :is="getIcon()" />
            </el-icon>
          </div>

          <!-- 内容区 -->
          <div class="item-content">
            <div v-if="showTitle" class="item-title" :style="titleStyle">
              {{ getItemTitle(item) }}
            </div>
            <div v-if="showDescription" class="item-description" :style="descriptionStyle">
              {{ getItemDescription(item) }}
            </div>
            <div v-if="showExtra" class="item-extra" :style="extraStyle">
              {{ getItemExtra(item) }}
            </div>
          </div>

          <!-- 右侧操作区 -->
          <div v-if="showAction" class="item-action">
            <el-icon>
              <ArrowRight />
            </el-icon>
          </div>
        </div>
      </div>
    </el-scrollbar>
  </div>
</template>

<style scoped>
.list-container {
  box-sizing: border-box;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.list-wrapper {
  width: 100%;
}

.list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  box-sizing: border-box;
}

.list-item:hover {
  background-color: #f5f7fa !important;
}

.item-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-description {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.item-extra {
  margin-top: 4px;
}

.item-action {
  flex-shrink: 0;
  color: #c0c4cc;
  display: flex;
  align-items: center;
}
</style>
