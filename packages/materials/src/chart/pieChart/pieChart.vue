<template>
  <div class="chart-wrapper">
    <PieChartBase v-bind="$attrs" />
  </div>
</template>

<script setup lang="ts">
/**
 * PieChart - 纯 Props 模式的饼图组件
 *
 * 设计原则：
 * - 不依赖任何 Editor Store，保持物料库独立
 * - 所有数据通过 props 传入（由 FreeRenderer 层处理数据源适配）
 * - 使用 inheritAttrs: false + v-bind="$attrs" 透传所有属性
 */
import { pieChart as PieChartBase } from '@vela/ui'

defineOptions({
  inheritAttrs: false,
})
</script>

<style scoped>
.chart-wrapper {
  width: 100%;
  height: 100%;
}
</style>
