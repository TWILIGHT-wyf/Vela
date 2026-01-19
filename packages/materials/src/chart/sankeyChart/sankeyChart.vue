<template>
  <div class="chart-wrapper">
    <SankeyChartBase v-bind="$attrs" />
  </div>
</template>

<script setup lang="ts">
import { sankeyChart as SankeyChartBase } from '@vela/ui'

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
