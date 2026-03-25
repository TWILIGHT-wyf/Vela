<template>
  <div class="setter-panel-root sider-root properties-panel" data-testid="setter-panel">
    <!-- 选中 Page 根节点或无选中时，显示页面设置 -->
    <template v-if="showPageSettings">
      <PageSettingPane />
    </template>

    <!-- 选中普通组件时显示组件设置面板 -->
    <el-tabs
      v-else
      v-model="activeTab"
      class="setter-tabs vela-panel-tabs"
      stretch
      data-testid="setter-tabs"
    >
      <el-tab-pane label="属性" name="props">
        <PropsPane :node="selectedComponent" />
      </el-tab-pane>

      <el-tab-pane label="样式" name="style">
        <StylePaneEnhanced :node="selectedComponent" />
      </el-tab-pane>

      <el-tab-pane label="数据源" name="dataSource">
        <DataSourcePane :node="selectedComponent" />
      </el-tab-pane>

      <el-tab-pane label="事件" name="events">
        <EventPane :node="selectedComponent" />
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
import DataSourcePane from './panes/DataSourcePane.vue'
import EventPane from './panes/EventPane.vue'
import RelationsPane from './panes/RelationsPane.vue'
import PageSettingPane from './panes/PageSettingPane.vue'

const componentStore = useComponent()

const selectedComponent = computed(() => componentStore.selectedNode)

// 判断是否显示页面设置（无选中组件 或 选中的是 Page 根节点）
const showPageSettings = computed(() => {
  if (!selectedComponent.value) return true
  // 如果选中的是 Page 组件（根节点），也显示页面设置
  const name = selectedComponent.value.component || selectedComponent.value.componentName
  return name === 'Page'
})

const activeTab = ref('props')
</script>

<style scoped>
.setter-panel-root {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 标签页样式 */
.setter-tabs {
  /* 通用 tabs 规则抽离到 patterns.css 的 .vela-panel-tabs */
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
