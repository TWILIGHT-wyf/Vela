<template>
  <div class="props-pane">
    <el-empty v-if="!node" description="请选择一个组件" :image-size="80">
      <template #image>
        <el-icon :size="64"><Select /></el-icon>
      </template>
    </el-empty>

    <el-form v-else label-position="top" size="default" class="props-form">
      <div class="component-info">
        <el-tag type="info" size="small">{{ node.component || node.componentName }}</el-tag>
        <el-text size="small" type="info" v-if="metaProps.length === 0">
          该组件没有可配置的属性
        </el-text>
      </div>

      <!-- 按分组显示属性 -->
      <el-collapse v-if="groupedProps.length > 0" v-model="activeGroups" class="props-collapse">
        <el-collapse-item
          v-for="group in groupedProps"
          :key="group.name"
          :title="group.name"
          :name="group.name"
        >
          <el-form-item
            v-for="prop in group.props"
            :key="prop.name"
            :label="translate(prop.title) || prop.label || prop.name"
          >
            <component
              :is="getSetterComponent(prop.setter)"
              :model-value="getPropValue(prop.name, prop.defaultValue)"
              @update:model-value="setPropValue(prop.name, $event)"
              v-bind="prop.setterProps || {}"
              :properties="prop.properties"
            />
            <div v-if="prop.description" class="prop-description">
              {{ prop.description }}
            </div>
          </el-form-item>
        </el-collapse-item>
      </el-collapse>

      <!-- 无分组的属性 -->
      <template v-else-if="metaProps.length > 0">
        <el-form-item
          v-for="prop in metaProps"
          :key="prop.name"
          :label="translate(prop.title) || prop.label || prop.name"
        >
          <component
            :is="getSetterComponent(prop.setter)"
            :model-value="getPropValue(prop.name, prop.defaultValue)"
            @update:model-value="setPropValue(prop.name, $event)"
            v-bind="prop.setterProps || {}"
          />
          <div v-if="prop.description" class="prop-description">
            {{ prop.description }}
          </div>
        </el-form-item>
      </template>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Component } from 'vue'
import { type NodeSchema, translate } from '@vela/core'
import type { PropConfig } from '@vela/core/types/material'
import { materialList } from '@vela/materials'
import { Select } from '@element-plus/icons-vue'
import { useComponent } from '@/stores/component'

// 导入所有 Setters
import StringSetter from '../setters/StringSetter.vue'
import NumberSetter from '../setters/NumberSetter.vue'
import SelectSetter from '../setters/SelectSetter.vue'
import ColorSetter from '../setters/ColorSetter.vue'
import BooleanSetter from '../setters/BooleanSetter.vue'
import JsonSetter from '../setters/JsonSetter.vue'
import ObjectSetter from '../setters/ObjectSetter.vue'

type NamedPropConfig = PropConfig

interface Props {
  node?: NodeSchema | null
}

const props = defineProps<Props>()

const activeGroups = ref<string[]>(['基础', '样式', '状态'])

// Setter 组件映射（包含回退）
const setterMap: Record<string, Component> = {
  StringSetter,
  NumberSetter,
  SelectSetter,
  ColorSetter,
  BooleanSetter,
  JsonSetter,
  ObjectSetter,
  // 回退映射：使用现有组件处理缺失的 Setter
  SliderSetter: NumberSetter,
  ImageSetter: StringSetter,
  TextAreaSetter: StringSetter,
}

// 使用 Component Store 直接更新
const componentStore = useComponent()

// 获取当前组件的 Meta 定义（只取 props，排除 '样式' 分组）
const metaProps = computed<NamedPropConfig[]>(() => {
  if (!props.node) return []
  const nodeName = props.node!.component || props.node!.componentName
  const meta = materialList.find((m) => m.name === nodeName || m.componentName === nodeName)
  if (!meta?.props) return []
  return Object.entries(meta.props)
    .filter((entry) => entry[1].group !== '样式')
    .map(([name, config]) => {
      return {
        ...config,
        name,
      }
    })
})

// 按 group 分组属性
const groupedProps = computed(() => {
  const propsWithGroup = metaProps.value.filter((p) => p.group)
  if (propsWithGroup.length === 0) return []

  const groups = new Map<string, NamedPropConfig[]>()
  propsWithGroup.forEach((prop) => {
    const groupName = prop.group || '其他'
    if (!groups.has(groupName)) {
      groups.set(groupName, [])
    }
    groups.get(groupName)!.push(prop)
  })

  return Array.from(groups.entries()).map(([name, props]) => ({
    name,
    props,
  }))
})

// ========== 响应式双向绑定（改进后的核心逻辑）==========

/**
 * 获取属性值（响应式读取）
 * 通过订阅 styleVersion 实现响应式更新
 */
function getPropValue(propName: string, defaultValue?: unknown): unknown {
  if (!props.node) return defaultValue

  // 订阅版本号变化以触发响应式更新
  void componentStore.styleVersion[props.node.id]

  const nodeProps = props.node.props || {}
  const value = nodeProps[propName]
  return value !== undefined ? value : defaultValue
}

/**
 * 设置属性值（直接更新 store）
 * 无需本地状态副本，直接写入 store
 */
function setPropValue(propName: string, value: unknown): void {
  if (!props.node) return
  componentStore.updateProps(props.node.id, { [propName]: value })
}

// 映射 Setter 字符串到组件
const getSetterComponent = (setterName?: string): Component => {
  if (!setterName) return StringSetter
  return setterMap[setterName] || StringSetter
}
</script>

<style scoped>
.props-pane {
  padding: 16px;
}

.component-info {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  display: flex;
  align-items: center;
  gap: 8px;
}

.props-form {
  width: 100%;
}

.props-collapse {
  border: none;
}

.props-collapse :deep(.el-collapse-item__header) {
  font-weight: 500;
  font-size: 13px;
  padding-left: 0;
}

.props-collapse :deep(.el-collapse-item__content) {
  padding-left: 0;
}

.props-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.props-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
  font-size: 13px;
}

.props-form :deep(.el-form-item__content) {
  width: 100%;
}

.prop-description {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
  line-height: 1.5;
}
</style>
