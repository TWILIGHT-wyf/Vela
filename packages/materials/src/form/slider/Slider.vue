<template>
  <div class="slider-wrapper">
    <vSlider v-bind="$attrs" />
  </div>
</template>

<script setup lang="ts">
import { vSlider } from '@vela/ui'

defineOptions({
  inheritAttrs: false,
})
</script>

<style scoped>
.slider-wrapper {
  width: 100%;
  height: 100%;
}
</style>
