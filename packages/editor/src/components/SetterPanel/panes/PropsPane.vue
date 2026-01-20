<template>
  <div class="props-pane">
    <el-empty v-if="!node" description="请选择一个组件" :image-size="80">
      <template #image>
        <el-icon :size="64"><Select /></el-icon>
      </template>
    </el-empty>

    <el-form v-else label-position="top" size="default" class="props-form">
      <div class="component-info">
        <el-tag type="info" size="small">{{ node.componentName }}</el-tag>
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
            :label="prop.title || prop.name"
          >
            <component
              :is="getSetterComponent(prop.setter)"
              v-model="propValues[prop.name]"
              v-bind="prop.setterProps || {}"
            />
            <div v-if="prop.description" class="prop-description">
              {{ prop.description }}
            </div>
          </el-form-item>
        </el-collapse-item>
      </el-collapse>

      <!-- 无分组的属性 -->
      <template v-else-if="metaProps.length > 0">
        <el-form-item v-for="prop in metaProps" :key="prop.name" :label="prop.title || prop.name">
          <component
            :is="getSetterComponent(prop.setter)"
            v-model="(node.props as any)[prop.name]"
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
import { computed, ref, watch } from 'vue'
import type { Component } from 'vue'
import type { NodeSchema } from '@vela/core'
import type { PropConfig } from '@vela/core/types/material'
import { materialList } from '@vela/materials'
import { Select } from '@element-plus/icons-vue'
import { useCommands, type UpdatePropCommand } from '@/stores/commands'

// 导入所有 Setters
import StringSetter from '../setters/StringSetter.vue'
import NumberSetter from '../setters/NumberSetter.vue'
import SelectSetter from '../setters/SelectSetter.vue'
import ColorSetter from '../setters/ColorSetter.vue'
import BooleanSetter from '../setters/BooleanSetter.vue'
import JsonSetter from '../setters/JsonSetter.vue'
import { ElMessage } from 'element-plus'

// Extended prop config with name field for iteration
interface NamedPropConfig extends PropConfig {
  name: string
}

interface Props {
  node?: NodeSchema | null
}

const props = defineProps<Props>()

const activeGroups = ref<string[]>(['基础', '样式', '状态'])

// 导入所有 Setters
const setterMap: Record<string, Component> = {
  StringSetter,
  NumberSetter,
  SelectSetter,
  ColorSetter,
  BooleanSetter,
  JsonSetter,
}

const { executeCommand } = useCommands()

// 获取当前组件的 Meta 定义（只取 props）
const metaProps = computed<NamedPropConfig[]>(() => {
  if (!props.node) return []
  const meta = materialList.find((m) => m.componentName === props.node!.componentName)
  if (!meta?.props) return []
  return Object.entries(meta.props).map(([name, config]) => ({
    name,
    ...config,
  }))
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

// 属性值映射（用于双向绑定）
const propValues = ref<Record<string, unknown>>({})

// 初始化属性值
if (props.node?.props) {
  propValues.value = { ...props.node.props }
}

// 监听属性值变化，通过 Command Pattern 更新
watch(
  propValues,
  (newValues, oldValues) => {
    Object.entries(newValues).forEach(([propName, newValue]) => {
      const oldValue = oldValues[propName]
      if (newValue !== oldValue) {
        updateProp(propName, newValue)
      }
    })
  },
  { deep: true },
)

// 属性更新函数 - 使用 Command Pattern
function updateProp(propName: string, value: unknown): void {
  if (!props.node) return

  try {
    executeCommand({
      type: 'update-prop',
      id: props.node.id,
      path: propName,
      value,
    } as UpdatePropCommand)
  } catch (error) {
    console.error('[PropsPane] Failed to update prop:', error)
    ElMessage.error('属性更新失败')
  }
}

// 监听节点变化，重置属性值
watch(
  () => props.node?.id,
  () => {
    if (props.node?.props) {
      propValues.value = { ...props.node.props }
    }
  },
  { immediate: true },
)

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

.prop-description {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
  line-height: 1.5;
}
</style>
