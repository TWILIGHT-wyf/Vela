<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'
import { ElScrollbar, ElEmpty, ElCard, ElTag } from 'element-plus'

export interface CardItem {
  title?: string
  description?: string
  footer?: string
  tags?: string[] | string
  image?: string
  [key: string]: unknown
}

const props = withDefaults(
  defineProps<{
    // 数据
    data?: CardItem[]
    // 字段映射
    titleField?: string
    descriptionField?: string
    footerField?: string
    tagsField?: string
    imageField?: string
    // 配置
    showImage?: boolean
    showTitle?: boolean
    showDescription?: boolean
    showTags?: boolean
    showFooter?: boolean
    cardShadow?: 'always' | 'hover' | 'never'
    tagSize?: 'large' | 'default' | 'small'
    emptyText?: string
    scrollHeight?: string
    columns?: number
    gap?: number
    // 样式
    opacity?: number
    visible?: boolean
    backgroundColor?: string
    borderRadius?: number
    padding?: number
    cardBorderRadius?: number
    cardPadding?: number
    imageHeight?: number
    imageBorderRadius?: number
    titleFontSize?: number
    titleColor?: string
    titleFontWeight?: string
    descriptionFontSize?: number
    descriptionColor?: string
    footerFontSize?: number
    footerColor?: string
    footerBorderColor?: string
  }>(),
  {
    data: () => [],
    titleField: 'title',
    descriptionField: 'description',
    footerField: 'footer',
    tagsField: 'tags',
    imageField: 'image',
    showImage: false,
    showTitle: true,
    showDescription: true,
    showTags: false,
    showFooter: false,
    cardShadow: 'hover',
    tagSize: 'small',
    emptyText: '暂无数据',
    scrollHeight: '100%',
    columns: 3,
    gap: 16,
    opacity: 100,
    visible: true,
    backgroundColor: '#f5f7fa',
    borderRadius: 4,
    padding: 16,
    cardBorderRadius: 4,
    cardPadding: 14,
    imageHeight: 150,
    imageBorderRadius: 4,
    titleFontSize: 16,
    titleColor: '#303133',
    titleFontWeight: '600',
    descriptionFontSize: 13,
    descriptionColor: '#606266',
    footerFontSize: 12,
    footerColor: '#909399',
    footerBorderColor: '#ebeef5',
  },
)

const emit = defineEmits<{
  (e: 'card-click', item: CardItem, index: number): void
}>()

// 默认数据
const defaultData: CardItem[] = [
  {
    title: '卡片 1',
    description: '这是卡片的描述信息',
    footer: '2024-01-01',
    tags: ['标签1', '标签2'],
  },
  { title: '卡片 2', description: '这是卡片的描述信息', footer: '2024-01-02', tags: ['标签3'] },
  {
    title: '卡片 3',
    description: '这是卡片的描述信息',
    footer: '2024-01-03',
    tags: ['标签4', '标签5'],
  },
]

const cardData = computed(() => (props.data.length > 0 ? props.data : defaultData))

function getTitle(item: CardItem): string {
  return String(item[props.titleField] ?? '')
}

function getDescription(item: CardItem): string {
  return String(item[props.descriptionField] ?? '')
}

function getFooter(item: CardItem): string {
  return String(item[props.footerField] ?? '')
}

function getTags(item: CardItem): string[] {
  const tags = item[props.tagsField]
  if (Array.isArray(tags)) return tags.map(String)
  if (typeof tags === 'string') return tags.split(',').map((s) => s.trim())
  return []
}

function getImage(item: CardItem): string {
  return String(item[props.imageField] ?? '')
}

function getTagType(index: number): 'primary' | 'success' | 'info' | 'warning' | 'danger' {
  const types: ('primary' | 'success' | 'info' | 'warning' | 'danger')[] = [
    'primary',
    'success',
    'info',
    'warning',
    'danger',
  ]
  return types[index % types.length]
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

const gridStyle = computed<CSSProperties>(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${props.columns}, 1fr)`,
  gap: `${props.gap}px`,
}))

const cardStyle = computed<CSSProperties>(() => ({
  cursor: 'pointer',
  transition: 'all 0.3s',
  borderRadius: `${props.cardBorderRadius}px`,
}))

const cardBodyStyle = computed(() => ({
  padding: `${props.cardPadding}px`,
}))

const imageStyle = computed<CSSProperties>(() => ({
  width: '100%',
  height: `${props.imageHeight}px`,
  marginBottom: '12px',
  borderRadius: `${props.imageBorderRadius}px`,
  overflow: 'hidden',
}))

const titleStyle = computed<CSSProperties>(() => ({
  fontSize: `${props.titleFontSize}px`,
  color: props.titleColor,
  fontWeight: props.titleFontWeight,
  marginBottom: '8px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}))

const descriptionStyle = computed<CSSProperties>(() => ({
  fontSize: `${props.descriptionFontSize}px`,
  color: props.descriptionColor,
  lineHeight: 1.6,
  marginBottom: '8px',
}))

const footerStyle = computed<CSSProperties>(() => ({
  fontSize: `${props.footerFontSize}px`,
  color: props.footerColor,
  marginTop: '8px',
  paddingTop: '8px',
  borderTop: `1px solid ${props.footerBorderColor}`,
}))

const tagStyle = computed<CSSProperties>(() => ({
  marginRight: '6px',
  marginTop: '6px',
}))

function handleCardClick(item: CardItem, index: number) {
  emit('card-click', item, index)
}
</script>

<template>
  <div class="card-grid-container" :style="containerStyle">
    <el-scrollbar :height="scrollHeight">
      <div v-if="cardData.length === 0" class="empty-state">
        <el-empty :description="emptyText" :image-size="80" />
      </div>
      <div v-else class="grid-wrapper" :style="gridStyle">
        <el-card
          v-for="(item, index) in cardData"
          :key="index"
          :shadow="cardShadow"
          :body-style="cardBodyStyle"
          class="grid-card"
          :style="cardStyle"
          @click="handleCardClick(item, index)"
        >
          <!-- 卡片图片 -->
          <div v-if="showImage && getImage(item)" class="card-image" :style="imageStyle">
            <img :src="getImage(item)" :alt="getTitle(item)" />
          </div>

          <!-- 卡片内容 -->
          <div class="card-content">
            <!-- 标题 -->
            <div v-if="showTitle" class="card-title" :style="titleStyle">
              {{ getTitle(item) }}
            </div>

            <!-- 描述 -->
            <div v-if="showDescription" class="card-description" :style="descriptionStyle">
              {{ getDescription(item) }}
            </div>

            <!-- 标签 -->
            <div v-if="showTags && getTags(item).length > 0" class="card-tags">
              <el-tag
                v-for="(tag, tagIndex) in getTags(item)"
                :key="tagIndex"
                :type="getTagType(tagIndex)"
                :size="tagSize"
                :style="tagStyle"
              >
                {{ tag }}
              </el-tag>
            </div>

            <!-- 底部信息 -->
            <div v-if="showFooter" class="card-footer" :style="footerStyle">
              {{ getFooter(item) }}
            </div>
          </div>
        </el-card>
      </div>
    </el-scrollbar>
  </div>
</template>

<style scoped>
.card-grid-container {
  box-sizing: border-box;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.grid-wrapper {
  width: 100%;
}

.grid-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-content {
  display: flex;
  flex-direction: column;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  margin-top: 4px;
  margin-right: -6px;
}
</style>
