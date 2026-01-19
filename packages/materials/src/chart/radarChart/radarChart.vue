<template>
  <div class="chart-wrapper">
    <RadarChartBase v-bind="$attrs" />
  </div>
</template>

<script setup lang="ts">
import { radarChart as RadarChartBase } from '@vela/ui'

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
