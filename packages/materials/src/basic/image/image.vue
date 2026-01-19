<template>
  <div class="image-wrapper">
    <vImage v-bind="$attrs" />
  </div>
</template>

<script setup lang="ts">
import { vImage } from '@vela/ui'

defineOptions({
  inheritAttrs: false,
})
</script>

<style scoped>
.image-wrapper {
  width: 100%;
  height: 100%;
}
</style>
