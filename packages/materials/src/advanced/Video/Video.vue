<template>
  <div class="video-wrapper">
    <vVideo v-bind="$attrs" />
  </div>
</template>

<script setup lang="ts">
import { vVideo } from '@vela/ui'

defineOptions({
  inheritAttrs: false,
})
</script>

<style scoped>
.video-wrapper {
  width: 100%;
  height: 100%;
}
</style>
