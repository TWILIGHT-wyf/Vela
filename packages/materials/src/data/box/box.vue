<template>
  <VBox v-bind="boxProps" />
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import { useComponent } from '@vela/editor/stores/component'
import { storeToRefs } from 'pinia'
import { vBox as VBox, useDataSource, extractWithFallback } from '@vela/ui'

const props = defineProps<{ id: string }>()
const { componentStore } = storeToRefs(useComponent())

const comp = computed(() => componentStore.value.find((c) => c.id === props.id))

// 数据源
const dataSourceRef = toRef(() => comp.value?.dataSource)
const { data: remoteData } = useDataSource(dataSourceRef)

// 显示内容
const displayContent = computed<string>(() => {
  const ds = comp.value?.dataSource
  const localContent = (comp.value?.props.content as string) ?? '占位盒'

  if (ds?.enabled && remoteData.value) {
    return extractWithFallback(remoteData.value, ds.dataPath, localContent) as string
  }
  return localContent
})

// 聚合所有 Props 传递给 Dumb 组件
const boxProps = computed((): Record<string, unknown> => {
  const s = comp.value?.style || {}
  return {
    content: displayContent.value,
    // 容器样式
    opacity: s.opacity ?? 100,
    visible: s.visible !== false,
    backgroundColor: s.backgroundColor ?? '#ffffff',
    borderColor: s.borderColor ?? '#dcdfe6',
    borderWidth: s.borderWidth ?? 1,
    borderStyle: s.borderStyle ?? 'solid',
    borderRadius: s.borderRadius ?? 4,
    padding: s.padding ?? 16,
    boxShadow: s.boxShadow ?? 'none',
    // 文字样式
    fontSize: s.fontSize ?? 14,
    textColor: s.textColor ?? '#606266',
    fontWeight: s.fontWeight ?? 'normal',
    textAlign: s.textAlign ?? 'center',
    lineHeight: s.lineHeight ?? 1.5,
  }
})
</script>
