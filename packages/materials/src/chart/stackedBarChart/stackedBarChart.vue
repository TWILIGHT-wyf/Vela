<template>
  <div class="chart-wrapper">
    <StackedBarChartBase v-bind="$attrs" />
  </div>
</template>

<script setup lang="ts">
import { stackedBarChart as StackedBarChartBase } from '@vela/ui'

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
