<template>
  <div :style="containerStyle">
    <el-button-group>
      <el-button
        v-for="button in displayButtons"
        :key="button.value"
        :type="button.type || type"
        :size="size"
        :disabled="button.disabled || disabled"
        :plain="plain"
        :round="round"
        :circle="circle"
        :icon="button.icon"
        @click="handleClick(button)"
      >
        {{ button.label }}
      </el-button>
    </el-button-group>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'
import { ElButtonGroup, ElButton } from 'element-plus'

// 按钮接口
export interface ButtonItem {
  label: string
  value: string | number
  type?: 'default' | 'primary' | 'success' | 'warning' | 'info' | 'danger'
  icon?: string
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    buttons?: ButtonItem[]
    type?: 'default' | 'primary' | 'success' | 'warning' | 'info' | 'danger'
    size?: 'large' | 'default' | 'small'
    disabled?: boolean
    plain?: boolean
    round?: boolean
    circle?: boolean
    padding?: number
    backgroundColor?: string
  }>(),
  {
    buttons: () => [],
    type: 'default',
    size: 'default',
    disabled: false,
    plain: false,
    round: false,
    circle: false,
    padding: 16,
    backgroundColor: 'transparent',
  },
)

const emit = defineEmits<{
  click: [button: ButtonItem]
}>()

// 默认按钮数据
const defaultButtons: ButtonItem[] = [
  { label: '按钮 1', value: '1' },
  { label: '按钮 2', value: '2' },
  { label: '按钮 3', value: '3' },
]

// 显示的按钮
const displayButtons = computed(() => {
  return props.buttons.length > 0 ? props.buttons : defaultButtons
})

// 容器样式
const containerStyle = computed<CSSProperties>(() => ({
  padding: `${props.padding}px`,
  backgroundColor: props.backgroundColor,
}))

// 事件处理
const handleClick = (button: ButtonItem) => {
  emit('click', button)
}
</script>

<style scoped>
:deep(.el-button-group) {
  display: flex;
}
</style>
