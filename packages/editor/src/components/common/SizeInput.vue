<template>
  <div class="size-input">
    <!-- Mode Selector -->
    <el-dropdown trigger="click" @command="handleModeChange" class="mode-select">
      <div class="mode-label">
        <el-icon v-if="currentMode === 'fixed'"><DCaret /></el-icon>
        <span v-else-if="currentMode === 'relative'">%</span>
        <el-icon v-else-if="currentMode === 'fill'"><FullScreen /></el-icon>
        <span v-else>A</span>
        <el-icon class="arrow-icon"><ArrowDown /></el-icon>
      </div>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="fixed">
            <el-icon><DCaret /></el-icon> Fixed (px)
          </el-dropdown-item>
          <el-dropdown-item command="relative"> % Relative </el-dropdown-item>
          <el-dropdown-item command="fill">
            <el-icon><FullScreen /></el-icon> Fill Container
          </el-dropdown-item>
          <el-dropdown-item command="auto"> Auto </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <!-- Value Input -->
    <div class="input-wrapper">
      <el-input-number
        v-if="currentMode === 'fixed'"
        v-model="numericValue"
        controls-position="right"
        size="small"
        @change="emitValue"
        class="no-border-input"
        style="width: 100%"
      />
      <el-input
        v-else-if="currentMode === 'relative'"
        v-model="inputValue"
        size="small"
        @change="emitValue"
        class="no-border-input"
        style="width: 100%"
      >
        <template #append>%</template>
      </el-input>
      <div v-else class="readonly-value">
        {{ currentMode === 'fill' ? '100%' : 'auto' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { DCaret, ArrowDown, FullScreen } from '@element-plus/icons-vue'

const props = defineProps<{
  modelValue?: string | number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
}>()

type SizeMode = 'fixed' | 'relative' | 'fill' | 'auto'

const currentMode = ref<SizeMode>('fixed')
const numericValue = ref<number>(100)
const inputValue = ref<string>('100')

// Parse initial value
watch(
  () => props.modelValue,
  (val) => {
    if (val === undefined || val === null) {
      currentMode.value = 'auto'
      return
    }

    if (typeof val === 'number') {
      currentMode.value = 'fixed'
      numericValue.value = val
    } else {
      const strVal = String(val)
      if (strVal === 'auto') {
        currentMode.value = 'auto'
      } else if (strVal === '100%') {
        // Could be fill or relative 100%, treat as fill for simplicity if exactly 100%
        // But users might want relative 100%, let's check intent?
        // For UI simplicity, map 100% to Fill often makes sense, or treat as Relative.
        // Let's treat '100%' as Fill mode visualization
        currentMode.value = 'fill'
      } else if (strVal.endsWith('%')) {
        currentMode.value = 'relative'
        inputValue.value = strVal.replace('%', '')
      } else if (!isNaN(parseFloat(strVal))) {
        // "100px" or just "100" string
        currentMode.value = 'fixed'
        numericValue.value = parseFloat(strVal)
      } else {
        currentMode.value = 'auto'
      }
    }
  },
  { immediate: true },
)

function handleModeChange(mode: SizeMode) {
  currentMode.value = mode
  emitValue()
}

function emitValue() {
  let finalValue: string | number

  switch (currentMode.value) {
    case 'fixed':
      finalValue = numericValue.value
      break
    case 'relative':
      finalValue = `${inputValue.value}%`
      break
    case 'fill':
      finalValue = '100%'
      break
    case 'auto':
      finalValue = 'auto'
      break
  }

  emit('update:modelValue', finalValue)
}
</script>

<style scoped>
.size-input {
  display: flex;
  align-items: center;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  background-color: var(--el-bg-color);
  width: 100%;
  height: 32px; /* Standard small input height */
  transition: border-color 0.2s;
}

.size-input:hover {
  border-color: var(--el-border-color-hover);
}

.size-input:focus-within {
  border-color: var(--el-color-primary);
}

.mode-select {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 100%;
  border-right: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
}

.mode-label {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
}

.arrow-icon {
  font-size: 10px;
  transform: scale(0.8);
}

.input-wrapper {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.readonly-value {
  padding: 0 12px;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
  user-select: none;
}

/* Remove default borders from Element inputs inside wrapper */
.no-border-input :deep(.el-input__wrapper) {
  box-shadow: none !important;
  background: transparent !important;
  padding: 0 8px;
}

.no-border-input :deep(.el-input__inner) {
  text-align: left;
}
</style>
