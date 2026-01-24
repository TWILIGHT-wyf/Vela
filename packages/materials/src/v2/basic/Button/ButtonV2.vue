<template>
  <WrappedButton v-bind="$attrs">
    <!-- Slot 透传 -->
    <template v-for="(_, name) in $slots" #[name]="slotData">
      <slot :name="name" v-bind="slotData" />
    </template>
  </WrappedButton>
</template>

<script setup lang="ts">
import { vNextButton } from '@vela/ui'
import { defineMaterial } from '../../../utils'

// 使用 HOC 包装纯 UI 组件
const WrappedButton = defineMaterial(vNextButton, {
  name: 'ButtonV2',
  connectEvent: true, // 启用事件系统 (点击跳转等)
  fillContainer: false, // 按钮通常不需要强制填满容器，而是由自身布局决定
})

defineOptions({
  inheritAttrs: false,
})
</script>
