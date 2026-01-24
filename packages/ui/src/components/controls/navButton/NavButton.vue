<template>
  <div class="nav-button" :style="containerStyle" @click="handleClick">
    <el-icon v-if="icon" class="nav-icon" :size="iconSize">
      <component :is="iconComponent" />
    </el-icon>
    <span v-if="showLabel" class="nav-label">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'
import * as Icons from '@element-plus/icons-vue'
import { ElIcon } from 'element-plus'

export interface NavButtonProps {
  label?: string
  showLabel?: boolean
  icon?: string
  iconSize?: number
  backgroundColor?: string
  color?: string
  borderRadius?: number
  paddingX?: number
  paddingY?: number
  fontSize?: number
  shadow?: boolean
}

const props = withDefaults(defineProps<NavButtonProps>(), {
  label: '跳转',
  showLabel: true,
  icon: 'ArrowRight',
  iconSize: 20,
  backgroundColor: '#409eff',
  color: '#ffffff',
  borderRadius: 8,
  paddingX: 24,
  paddingY: 12,
  fontSize: 14,
  shadow: false,
})

const emit = defineEmits<{
  click: []
}>()

// 图标组件
const iconComponent = computed(() => {
  const name = props.icon
  return (Icons as Record<string, unknown>)[name] || Icons.ArrowRight
})

// 样式
const containerStyle = computed<CSSProperties>(() => ({
  backgroundColor: props.backgroundColor,
  color: props.color,
  borderRadius: `${props.borderRadius}px`,
  padding: `${props.paddingY}px ${props.paddingX}px`,
  fontSize: `${props.fontSize}px`,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  transition: 'all 0.2s ease',
  boxShadow: props.shadow ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
}))

function handleClick() {
  emit('click')
}
</script>

<style scoped>
.nav-button {
  user-select: none;
  font-weight: 500;
}

.nav-button:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}

.nav-button:active {
  transform: translateY(0);
  filter: brightness(0.95);
}

.nav-icon {
  flex-shrink: 0;
}

.nav-label {
  white-space: nowrap;
}
</style>
