<template>
  <VCountUp v-bind="countUpProps" />
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import { useComponent } from '@vela/editor/stores/component'
import { storeToRefs } from 'pinia'
import {
  vCountUp as VCountUp,
  useDataSource,
  extractNumber,
  extractWithFallback,
} from '@vela/ui'

const props = defineProps<{ id: string }>()
const { componentStore } = storeToRefs(useComponent())

const comp = computed(() => componentStore.value.find((c) => c.id === props.id))

// 数据源
const dataSourceRef = toRef(() => comp.value?.dataSource)
const { data: remoteData } = useDataSource(dataSourceRef)

// 目标值
const targetValue = computed<number>(() => {
  const ds = comp.value?.dataSource
  const localValue = (comp.value?.props.value as number) ?? 0

  if (ds?.enabled && remoteData.value) {
    return extractNumber(remoteData.value, ds.valuePath, localValue)
  }
  return localValue
})

// 标题
const displayTitle = computed<string>(() => {
  const ds = comp.value?.dataSource
  const localTitle = (comp.value?.props.title as string) ?? ''
  if (ds?.enabled && remoteData.value && ds.titlePath) {
    return extractWithFallback(remoteData.value, ds.titlePath, localTitle) as string
  }
  return localTitle
})

// 聚合所有 Props 传递给 Dumb 组件
const countUpProps = computed((): Record<string, unknown> => {
  const s = comp.value?.style || {}
  const p = comp.value?.props || {}
  return {
    // 核心数据
    value: targetValue.value,
    title: displayTitle.value,
    startValue: p.startValue ?? 0,
    duration: p.duration ?? 2000,
    decimals: p.decimals ?? 0,
    prefix: p.prefix ?? '',
    suffix: p.suffix ?? '',
    showPrefix: p.showPrefix ?? true,
    showSuffix: p.showSuffix ?? true,
    useEasing: p.useEasing ?? true,
    customPrefix: p.customPrefix ?? false,
    customSuffix: p.customSuffix ?? false,
    // 容器样式
    opacity: s.opacity ?? 100,
    visible: s.visible !== false,
    backgroundColor: s.backgroundColor ?? 'transparent',
    borderColor: s.borderColor ?? 'transparent',
    borderWidth: s.borderWidth ?? 0,
    borderRadius: s.borderRadius ?? 0,
    padding: s.padding ?? 10,
    align: s.align ?? 'center',
    // 数值样式
    valueColor: s.valueColor ?? '#303133',
    valueFontSize: s.valueFontSize ?? 32,
    valueFontWeight: s.valueFontWeight ?? 'bold',
    fontFamily: s.fontFamily ?? 'inherit',
    // 前缀样式
    prefixColor: s.prefixColor ?? '#909399',
    prefixFontSize: s.prefixFontSize ?? 16,
    prefixFontWeight: s.prefixFontWeight ?? 'normal',
    // 后缀样式
    suffixColor: s.suffixColor ?? '#909399',
    suffixFontSize: s.suffixFontSize ?? 16,
    suffixFontWeight: s.suffixFontWeight ?? 'normal',
    // 标题样式
    titleColor: s.titleColor ?? '#909399',
    titleFontSize: s.titleFontSize ?? 14,
    titleFontWeight: s.titleFontWeight ?? 'normal',
  }
})
</script>
