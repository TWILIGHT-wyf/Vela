<template>
  <div class="chart-wrapper">
    <DoughnutChartBase v-bind="$attrs" />
  </div>
</template>

<script setup lang="ts">
import { doughnutChart as DoughnutChartBase } from '@vela/ui'

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
