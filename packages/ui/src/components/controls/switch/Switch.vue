<template>
  <div :style="containerStyle">
    <el-switch
      v-model="internalValue"
      :size="size"
      :disabled="disabled"
      :loading="loading"
      :active-text="activeText"
      :inactive-text="inactiveText"
      :active-value="activeValue"
      :inactive-value="inactiveValue"
      :inline-prompt="inlinePrompt"
      :active-icon="activeIcon"
      :inactive-icon="inactiveIcon"
      @change="handleChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CSSProperties, Component } from 'vue'
import { ElSwitch } from 'element-plus'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean | string | number
    size?: 'large' | 'default' | 'small'
    disabled?: boolean
    loading?: boolean
    activeText?: string
    inactiveText?: string
    activeValue?: boolean | string | number
    inactiveValue?: boolean | string | number
    inlinePrompt?: boolean
    activeIcon?: string | Component
    inactiveIcon?: string | Component
    padding?: number
    backgroundColor?: string
    activeColor?: string
    inactiveColor?: string
    borderColor?: string
  }>(),
  {
    modelValue: false,
    size: 'default',
    disabled: false,
    loading: false,
    activeText: '',
    inactiveText: '',
    activeValue: true,
    inactiveValue: false,
    inlinePrompt: false,
    activeIcon: undefined,
    inactiveIcon: undefined,
    padding: 16,
    backgroundColor: 'transparent',
    activeColor: '#409eff',
    inactiveColor: '#dcdfe6',
    borderColor: '#dcdfe6',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean | string | number]
  change: [value: boolean | string | number]
}>()

// 内部值
const internalValue = ref<boolean | string | number>(props.modelValue)

// 监听外部值变化
watch(
  () => props.modelValue,
  (newVal) => {
    internalValue.value = newVal
  },
)

// 样式
const containerStyle = computed<CSSProperties>(
  () =>
    ({
      padding: `${props.padding}px`,
      backgroundColor: props.backgroundColor,
      '--el-switch-on-color': props.activeColor,
      '--el-switch-off-color': props.inactiveColor,
      '--el-switch-border-color': props.borderColor,
    }) as CSSProperties,
)

// 事件处理
const handleChange = (value: boolean | string | number) => {
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<style scoped>
:deep(.el-switch) {
  --el-switch-on-color: v-bind('containerStyle["--el-switch-on-color"]');
  --el-switch-off-color: v-bind('containerStyle["--el-switch-off-color"]');
  --el-switch-border-color: v-bind('containerStyle["--el-switch-border-color"]');
}
</style>
