<template>
  <el-breadcrumb :separator="separator" class="custom-breadcrumb" :style="containerStyle">
    <el-breadcrumb-item v-for="(item, index) in displayItems" :key="index">
      <span v-if="index === displayItems.length - 1" class="current">{{ item.label }}</span>
      <a v-else class="link" @click="handleItemClick(item)">{{ item.label }}</a>
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'
import { ElBreadcrumb, ElBreadcrumbItem } from 'element-plus'

export interface BreadcrumbItem {
  label: string
  pageId?: string
  url?: string
}

export interface BreadcrumbProps {
  items?: BreadcrumbItem[]
  separator?: string
  fontSize?: number
  color?: string
  activeColor?: string
  linkColor?: string
}

const props = withDefaults(defineProps<BreadcrumbProps>(), {
  items: () => [],
  separator: '/',
  fontSize: 14,
  color: '#606266',
  activeColor: '#909399',
  linkColor: '#409eff',
})

const emit = defineEmits<{
  itemClick: [item: BreadcrumbItem]
}>()

// 默认显示项
const defaultItems: BreadcrumbItem[] = [{ label: '首页', pageId: 'home' }, { label: '当前页面' }]

const displayItems = computed(() => {
  return props.items && props.items.length > 0 ? props.items : defaultItems
})

const containerStyle = computed<CSSProperties>(() => ({
  fontSize: `${props.fontSize}px`,
  '--breadcrumb-color': props.color,
  '--breadcrumb-active-color': props.activeColor,
  '--breadcrumb-link-color': props.linkColor,
}))

function handleItemClick(item: BreadcrumbItem) {
  emit('itemClick', item)
}
</script>

<style scoped>
.custom-breadcrumb {
  padding: 8px 16px;
}

.link {
  cursor: pointer;
  color: var(--breadcrumb-link-color, #409eff);
}

.link:hover {
  text-decoration: underline;
}

.current {
  color: var(--breadcrumb-active-color, #909399);
}
</style>
