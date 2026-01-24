<template>
  <div class="setter-panel-root">
    <!-- 选中 Page 根节点或无选中时，显示页面设置 -->
    <template v-if="showPageSettings">
      <PageSettingPane />
    </template>

    <!-- 选中普通组件时显示组件设置面板 -->
    <el-tabs v-else v-model="activeTab" class="setter-tabs" stretch>
      <el-tab-pane label="属性" name="props">
        <PropsPane :node="selectedComponent" />
      </el-tab-pane>

      <el-tab-pane label="样式" name="style">
        <StylePaneEnhanced :node="selectedComponent" />
      </el-tab-pane>

      <el-tab-pane label="事件" name="events">
        <EventPane :node="selectedComponent" />
      </el-tab-pane>

      <el-tab-pane label="动画" name="animation">
        <AnimationPane />
      </el-tab-pane>

      <el-tab-pane label="联动" name="relations">
        <RelationsPane />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useComponent } from '@/stores/component'
import PropsPane from './panes/PropsPane.vue'
import StylePaneEnhanced from './panes/StylePaneEnhanced.vue'
import EventPane from './panes/EventPane.vue'
import AnimationPane from './panes/AnimationPane.vue'
import RelationsPane from './panes/RelationsPane.vue'
import PageSettingPane from './panes/PageSettingPane.vue'

const componentStore = useComponent()

const selectedComponent = computed(() => componentStore.selectedNode)

// 判断是否显示页面设置（无选中组件 或 选中的是 Page 根节点）
const showPageSettings = computed(() => {
  if (!selectedComponent.value) return true
  // 如果选中的是 Page 组件（根节点），也显示页面设置
  return selectedComponent.value.componentName === 'Page'
})

const activeTab = ref('props')
</script>

<style scoped>
.setter-panel-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 标签页样式 */
.setter-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.setter-tabs :deep(.el-tabs__header) {
  margin: 0;
  padding: 0 10px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border-light);
}

.setter-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 0;
}

.setter-tabs :deep(.el-tabs__item) {
  height: 48px;
  font-weight: 500;
  color: var(--text-secondary);
  font-size: 13px;
  padding: 0 12px;
}

.setter-tabs :deep(.el-tabs__item.is-active) {
  color: var(--color-primary);
  font-weight: 600;
}

.advanced-content :deep(.el-collapse-item__header) {
  font-weight: 500;
  padding-left: 0;
  border-bottom: 1px solid var(--border-light);
}

.setter-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 0;
}

.setter-tabs :deep(.el-tabs__item) {
  height: 44px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  padding: 0 10px;
}

.setter-tabs :deep(.el-tabs__item.is-active) {
  color: var(--el-color-primary);
  font-weight: 600;
}

.setter-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
}

.setter-tabs :deep(.el-tab-pane) {
  height: 100%;
  overflow-y: auto;
}

/* 高级功能内容 */
.advanced-content {
  padding: 16px;
}

.advanced-content :deep(.el-collapse) {
  border: none;
}

.advanced-content :deep(.el-collapse-item__header) {
  font-weight: 500;
  padding-left: 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.advanced-content :deep(.el-collapse-item__content) {
  padding: 16px 0;
}

/* 空状态样式 */
.setter-panel-root :deep(.el-empty) {
  padding: 60px 20px;
}

.setter-panel-root :deep(.el-empty__description) {
  margin-top: 16px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}
</style>
