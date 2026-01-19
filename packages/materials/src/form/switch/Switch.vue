<template>
  <div class="switch-wrapper">
    <vSwitch v-bind="$attrs" />
  </div>
</template>

<script setup lang="ts">
import { vSwitch } from '@vela/ui'

defineOptions({
  inheritAttrs: false,
})
</script>

<style scoped>
.switch-wrapper {
  width: 100%;
  height: 100%;
}
</style>
