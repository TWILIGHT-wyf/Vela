<template>
  <div class="object-setter">
    <!-- 折叠面板风格 -->
    <template v-if="properties && Object.keys(properties).length > 0">
      <div v-for="(propSchema, key) in properties" :key="key" class="object-property-item">
        <div class="property-label">
          <span>{{ propSchema.label || propSchema.title || key }}</span>
          <span v-if="propSchema.description" class="property-desc-icon">?</span>
        </div>

        <div class="property-input">
          <!-- 递归渲染 -->
          <component
            :is="getSetterComponent(propSchema.setter)"
            :model-value="internalValue[key]"
            v-bind="propSchema.setterProps || {}"
            :properties="propSchema.properties"
            @update:model-value="(val: unknown) => updateProperty(key, val)"
          />
        </div>

        <div v-if="propSchema.description" class="property-desc">
          {{ propSchema.description }}
        </div>
      </div>
    </template>
    <div v-else class="empty-object">无配置项</div>
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import type { PropSchema } from '@vela/core'

const props = defineProps<{
  modelValue?: Record<string, unknown>
  properties?: Record<string, PropSchema>
}>()

const emit = defineEmits(['update:modelValue'])

const internalValue = computed({
  get: () => props.modelValue || {},
  set: (val) => emit('update:modelValue', val),
})

// 更新单个属性，触发整体更新（不可变更新）
const updateProperty = (key: string, value: unknown) => {
  const newValue = {
    ...internalValue.value,
    [key]: value,
  }
  emit('update:modelValue', newValue)
}

// 异步加载组件以避免循环依赖（特别是如果 ObjectSetter 需要被 PropsPane 引用）
// 或者直接静态引用
import StringSetter from './StringSetter.vue'
import NumberSetter from './NumberSetter.vue'
import BooleanSetter from './BooleanSetter.vue'
import SelectSetter from './SelectSetter.vue'
import ColorSetter from './ColorSetter.vue'
import JsonSetter from './JsonSetter.vue'
// 自引用
import ObjectSetter from './ObjectSetter.vue'

const setterMap: Record<string, Component> = {
  StringSetter,
  NumberSetter,
  BooleanSetter,
  SelectSetter,
  ColorSetter,
  JsonSetter,
  ObjectSetter,
}

function getSetterComponent(setterName?: string) {
  return setterMap[setterName || 'StringSetter'] || StringSetter
}
</script>

<style scoped>
.object-setter {
  padding-left: 10px;
  border-left: 2px solid var(--el-border-color-lighter);
  margin-top: 4px;
}

.object-property-item {
  margin-bottom: 12px;
}

.object-property-item:last-child {
  margin-bottom: 0;
}

.property-label {
  font-size: 12px;
  color: var(--el-text-color-regular);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.property-desc {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  margin-top: 2px;
}
</style>
