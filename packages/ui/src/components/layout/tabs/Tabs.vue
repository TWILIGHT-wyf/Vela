<template>
  <div class="v-tabs-container" :style="containerStyle">
    <el-tabs
      v-model="activeTabValue"
      :type="elTabsType"
      :tab-position="tabPosition"
      :closable="closable"
      @tab-change="handleTabChange"
    >
      <el-tab-pane
        v-for="(tab, idx) in tabs"
        :key="tab.name"
        :label="tab.label"
        :name="String(tab.name)"
        :disabled="Boolean(tab.disabled)"
      >
        <!-- 使用具名插槽，允许外部自定义每个 tab 的内容 -->
        <slot :name="`tab-${idx}`" :tab="tab">
          {{ tab.content }}
        </slot>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'
import { ElTabs, ElTabPane } from 'element-plus'

// Tab 项类型
interface TabItem {
  label: string
  name: string
  content?: string
  disabled?: boolean
}

// 定义纯 UI Props
const props = defineProps<{
  // Tabs 数据
  tabs?: TabItem[]
  activeTab?: string

  // Tabs 配置
  type?: 'line' | 'card'
  tabPosition?: 'top' | 'right' | 'bottom' | 'left'
  closable?: boolean

  // 容器样式
  backgroundColor?: string
  padding?: number
  textColor?: string
}>()

const emit = defineEmits<{
  (e: 'update:activeTab', value: string): void
  (e: 'tab-change', value: string): void
}>()

const elTabsType = computed<'' | 'card'>(() => {
  return props.type === 'card' ? 'card' : ''
})

// 当前激活的 tab
const activeTabValue = ref(props.activeTab ?? '')

// 监听外部 activeTab 变化
watch(
  () => props.activeTab,
  (newVal) => {
    if (newVal) activeTabValue.value = newVal
  },
)

// 初始化 activeTab
watch(
  () => props.tabs,
  (newTabs) => {
    if (newTabs?.length && !activeTabValue.value) {
      activeTabValue.value = String(newTabs[0]?.name ?? '')
    }
  },
  { immediate: true },
)

// Tab 切换处理
const handleTabChange = (tabName: string) => {
  emit('update:activeTab', tabName)
  emit('tab-change', tabName)
}

// 容器样式
const containerStyle = computed<CSSProperties>(() => {
  return {
    backgroundColor: props.backgroundColor ?? '#ffffff',
    padding: `${props.padding ?? 0}px`,
    color: props.textColor ?? '#333333',
    boxSizing: 'border-box',
    width: '100%',
  }
})

// 默认 tabs
const tabs = computed<TabItem[]>(() => {
  return (
    props.tabs ?? [
      { label: 'Tab 1', name: 'tab1', content: 'Content of Tab 1' },
      { label: 'Tab 2', name: 'tab2', content: 'Content of Tab 2' },
      { label: 'Tab 3', name: 'tab3', content: 'Content of Tab 3' },
    ]
  )
})
</script>

<style scoped>
.v-tabs-container {
  box-sizing: border-box;
  width: 100%;
}
</style>
