<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'
import { Clock } from '@element-plus/icons-vue'
import { ElScrollbar, ElEmpty, ElTimeline, ElTimelineItem, ElCard } from 'element-plus'

export interface TimelineItem {
  title?: string
  content?: string
  timestamp?: string
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  color?: string
  extra?: string
  icon?: unknown
}

const props = withDefaults(
  defineProps<{
    // 数据
    data?: TimelineItem[]
    // 配置
    showCard?: boolean
    showTitle?: boolean
    showTimestamp?: boolean
    showExtra?: boolean
    timestampPlacement?: 'top' | 'bottom'
    itemSize?: 'normal' | 'large'
    hollow?: boolean
    cardShadow?: 'always' | 'hover' | 'never'
    emptyText?: string
    scrollHeight?: string
    // 样式
    backgroundColor?: string
    borderRadius?: number
    padding?: number
    opacity?: number
    visible?: boolean
    // 时间轴样式
    timelinePadding?: number
    // 卡片样式
    cardMargin?: number
    cardBorderRadius?: number
    // 标题样式
    headerFontSize?: number
    headerFontWeight?: string
    headerColor?: string
    titleFontSize?: number
    titleFontWeight?: string
    titleColor?: string
    // 内容样式
    contentFontSize?: number
    contentColor?: string
    textFontSize?: number
    textColor?: string
    // 额外信息样式
    extraFontSize?: number
    extraColor?: string
  }>(),
  {
    data: () => [],
    showCard: true,
    showTitle: true,
    showTimestamp: true,
    showExtra: false,
    timestampPlacement: 'top',
    itemSize: 'normal',
    hollow: false,
    cardShadow: 'hover',
    emptyText: '暂无数据',
    scrollHeight: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 4,
    padding: 16,
    opacity: 100,
    visible: true,
    timelinePadding: 0,
    cardMargin: 12,
    cardBorderRadius: 4,
    headerFontSize: 15,
    headerFontWeight: '600',
    headerColor: '#303133',
    titleFontSize: 15,
    titleFontWeight: '600',
    titleColor: '#303133',
    contentFontSize: 14,
    contentColor: '#606266',
    textFontSize: 14,
    textColor: '#606266',
    extraFontSize: 12,
    extraColor: '#909399',
  },
)

// 默认示例数据
const defaultData: TimelineItem[] = [
  {
    title: '活动开始',
    content: '这是活动的开始阶段',
    timestamp: '2024-01-01 10:00',
    type: 'primary',
  },
  { title: '进行中', content: '活动正在进行中', timestamp: '2024-01-02 14:30', type: 'success' },
  { title: '活动结束', content: '活动已经顺利结束', timestamp: '2024-01-03 18:00', type: 'info' },
]

const timelineData = computed(() => (props.data.length > 0 ? props.data : defaultData))

function getTitle(item: TimelineItem): string {
  return item.title ?? ''
}

function getContent(item: TimelineItem): string {
  return item.content ?? ''
}

function getTimestamp(item: TimelineItem): string {
  return item.timestamp ?? ''
}

function getExtra(item: TimelineItem): string {
  return item.extra ?? ''
}

function getItemType(
  item: TimelineItem,
  index: number,
): 'primary' | 'success' | 'warning' | 'danger' | 'info' {
  if (item.type && ['primary', 'success', 'warning', 'danger', 'info'].includes(item.type)) {
    return item.type
  }
  const types: ('primary' | 'success' | 'warning' | 'danger' | 'info')[] = [
    'primary',
    'success',
    'info',
    'warning',
    'danger',
  ]
  return types[index % types.length]
}

function getItemColor(item: TimelineItem): string | undefined {
  return item.color
}

function getItemIcon(item: TimelineItem) {
  return item.icon || Clock
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

const timelineStyle = computed<CSSProperties>(() => ({
  paddingLeft: `${props.timelinePadding}px`,
}))

const cardStyle = computed<CSSProperties>(() => ({
  marginBottom: `${props.cardMargin}px`,
  borderRadius: `${props.cardBorderRadius}px`,
}))

const headerStyle = computed<CSSProperties>(() => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: `${props.headerFontSize}px`,
  fontWeight: props.headerFontWeight,
  color: props.headerColor,
}))

const contentStyle = computed<CSSProperties>(() => ({
  fontSize: `${props.contentFontSize}px`,
  color: props.contentColor,
  lineHeight: 1.6,
}))

const extraStyle = computed<CSSProperties>(() => ({
  marginTop: '8px',
  fontSize: `${props.extraFontSize}px`,
  color: props.extraColor,
}))

const titleStyle = computed<CSSProperties>(() => ({
  fontSize: `${props.titleFontSize}px`,
  fontWeight: props.titleFontWeight,
  color: props.titleColor,
  marginBottom: '4px',
}))

const textStyle = computed<CSSProperties>(() => ({
  fontSize: `${props.textFontSize}px`,
  color: props.textColor,
  lineHeight: 1.6,
}))

const extraTextStyle = computed<CSSProperties>(() => ({
  marginTop: '6px',
  fontSize: `${props.extraFontSize}px`,
  color: props.extraColor,
}))
</script>

<template>
  <div class="timeline-container" :style="containerStyle">
    <el-scrollbar :height="scrollHeight">
      <div v-if="timelineData.length === 0" class="empty-state">
        <el-empty :description="emptyText" :image-size="80" />
      </div>
      <el-timeline v-else :style="timelineStyle">
        <el-timeline-item
          v-for="(item, index) in timelineData"
          :key="index"
          :timestamp="getTimestamp(item)"
          :placement="timestampPlacement"
          :type="getItemType(item, index)"
          :color="getItemColor(item)"
          :size="itemSize"
          :hollow="hollow"
          :icon="getItemIcon(item)"
        >
          <el-card v-if="showCard" :shadow="cardShadow" :style="cardStyle">
            <template #header>
              <div class="card-header" :style="headerStyle">
                <span class="card-title">{{ getTitle(item) }}</span>
                <span v-if="showTimestamp" class="card-time">{{ getTimestamp(item) }}</span>
              </div>
            </template>
            <div class="card-content" :style="contentStyle">
              {{ getContent(item) }}
            </div>
            <div v-if="showExtra && getExtra(item)" class="card-extra" :style="extraStyle">
              {{ getExtra(item) }}
            </div>
          </el-card>

          <div v-else class="timeline-content">
            <div v-if="showTitle" class="content-title" :style="titleStyle">
              {{ getTitle(item) }}
            </div>
            <div class="content-text" :style="textStyle">
              {{ getContent(item) }}
            </div>
            <div v-if="showExtra && getExtra(item)" class="content-extra" :style="extraTextStyle">
              {{ getExtra(item) }}
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
    </el-scrollbar>
  </div>
</template>

<style scoped>
.timeline-container {
  box-sizing: border-box;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  flex: 1;
}

.card-time {
  font-size: 13px;
  color: #909399;
  font-weight: normal;
  margin-left: 12px;
}

.card-content {
  margin: 0;
}

.card-extra {
  padding-top: 8px;
  border-top: 1px solid #ebeef5;
}

.timeline-content {
  padding: 8px 0;
}

.content-title {
  margin-bottom: 4px;
}

.content-text {
  margin: 0;
}

.content-extra {
  padding-top: 6px;
}
</style>
