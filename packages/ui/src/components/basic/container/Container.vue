<template>
  <div class="v-container">
    <slot />
  </div>
</template>

<script setup lang="ts">
// Container 组件是一个纯粹的容器，样式通过 style 透传 (继承自 $attrs)
// 不需要定义任何 CSS 相关的 Props
defineOptions({
  inheritAttrs: true, // 允许 attrs (style, class, id) 自动绑定到根元素
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
