<template>
  <div class="chart-wrapper">
    <ScatterChartBase v-bind="$attrs" />
  </div>
</template>

<script setup lang="ts">
import { scatterChart as ScatterChartBase } from '@vela/ui'

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
