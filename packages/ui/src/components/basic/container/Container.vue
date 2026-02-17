<template>
  <component
    :is="tag"
    class="v-container"
    :role="role || undefined"
    :aria-label="ariaLabel || undefined"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
interface Props {
  tag?: 'div' | 'section' | 'article' | 'main' | 'aside' | 'header' | 'footer' | 'nav' | 'form'
  role?: string
  ariaLabel?: string
}

withDefaults(defineProps<Props>(), {
  tag: 'div',
  role: '',
  ariaLabel: '',
})

defineOptions({
  inheritAttrs: true,
})
</script>

<style scoped>
.v-container {
  box-sizing: border-box;
  /* 默认样式 */
  position: relative;
  min-height: 50px; /* 给一个最小高度方便拖拽 */
}
</style>
