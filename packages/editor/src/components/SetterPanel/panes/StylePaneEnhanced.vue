<template>
  <div class="style-pane-enhanced">
    <el-empty v-if="!node" description="请选择一个组件" :image-size="80">
      <template #image>
        <el-icon :size="64"><Select /></el-icon>
      </template>
    </el-empty>

    <div v-else class="style-content">
      <!-- 使用 Meta 配置的样式 (优先级高) -->
      <template v-if="metaStyles.length > 0">
        <el-collapse v-model="activeGroups" class="style-collapse">
          <el-collapse-item
            v-for="group in groupedStyles"
            :key="group.name"
            :title="group.name"
            :name="group.name"
          >
            <el-form label-position="top" size="default" class="style-form">
              <el-form-item
                v-for="style in group.styles"
                :key="style.name"
                :label="style.title || style.name"
              >
                <component
                  :is="getSetterComponent(style.setter)"
                  v-model="nodeStyle[style.name]"
                  v-bind="style.setterProps || {}"
                  @update:model-value="() => updateStyle(style.name)"
                />
                <div v-if="style.description" class="style-description">
                  {{ style.description }}
                </div>
              </el-form-item>
            </el-form>
          </el-collapse-item>
        </el-collapse>

        <el-divider v-if="metaStyles.length > 0">通用样式</el-divider>
      </template>

      <!-- 通用样式面板（总是显示，但在有自定义配置时去重） -->
      <el-form label-position="top" size="default" class="style-form">
        <el-collapse v-model="activeNames" class="style-collapse">
          <!-- 尺寸 -->
          <el-collapse-item
            title="尺寸"
            name="size"
            v-if="!hasAllCustomStyles(['width', 'height'])"
          >
            <el-form-item label="宽度" v-if="!hasCustomStyle('width')">
              <el-input v-model="nodeStyle.width" placeholder="auto / 100px / 50%" />
            </el-form-item>

            <el-form-item label="高度" v-if="!hasCustomStyle('height')">
              <el-input v-model="nodeStyle.height" placeholder="auto / 100px / 50%" />
            </el-form-item>
          </el-collapse-item>

          <!-- 定位 -->
          <el-collapse-item
            title="定位"
            name="position"
            v-if="!hasAllCustomStyles(['position', 'left', 'top'])"
          >
            <el-form-item label="定位方式" v-if="!hasCustomStyle('position')">
              <el-select v-model="nodeStyle.position" clearable>
                <el-option label="相对定位" value="relative" />
                <el-option label="绝对定位" value="absolute" />
                <el-option label="固定定位" value="fixed" />
                <el-option label="静态" value="static" />
              </el-select>
            </el-form-item>

            <template v-if="nodeStyle.position === 'absolute' || nodeStyle.position === 'fixed'">
              <el-form-item label="Left" v-if="!hasCustomStyle('left')">
                <el-input v-model="nodeStyle.left" placeholder="0px" />
              </el-form-item>
              <el-form-item label="Top" v-if="!hasCustomStyle('top')">
                <el-input v-model="nodeStyle.top" placeholder="0px" />
              </el-form-item>
            </template>
          </el-collapse-item>

          <!-- 外观 -->
          <el-collapse-item
            title="外观"
            name="appearance"
            v-if="
              !hasAllCustomStyles(['backgroundColor', 'color', 'border', 'borderRadius', 'opacity'])
            "
          >
            <el-form-item label="背景色" v-if="!hasCustomStyle('backgroundColor')">
              <el-color-picker v-model="nodeStyle.backgroundColor" show-alpha />
            </el-form-item>

            <el-form-item label="文字颜色" v-if="!hasCustomStyle('color')">
              <el-color-picker v-model="nodeStyle.color" show-alpha />
            </el-form-item>

            <el-form-item label="边框" v-if="!hasCustomStyle('border')">
              <el-input v-model="nodeStyle.border" placeholder="1px solid #ddd" />
            </el-form-item>

            <el-form-item label="圆角" v-if="!hasCustomStyle('borderRadius')">
              <el-input v-model="nodeStyle.borderRadius" placeholder="4px" />
            </el-form-item>

            <el-form-item label="透明度" v-if="!hasCustomStyle('opacity')">
              <el-slider v-model="opacityValue" :min="0" :max="100" @input="updateOpacity" />
            </el-form-item>
          </el-collapse-item>

          <!-- 间距 -->
          <el-collapse-item
            title="间距"
            name="spacing"
            v-if="!hasAllCustomStyles(['margin', 'padding'])"
          >
            <el-form-item label="外边距 (Margin)" v-if="!hasCustomStyle('margin')">
              <el-input v-model="nodeStyle.margin" placeholder="10px 20px" />
            </el-form-item>

            <el-form-item label="内边距 (Padding)" v-if="!hasCustomStyle('padding')">
              <el-input v-model="nodeStyle.padding" placeholder="10px 20px" />
            </el-form-item>
          </el-collapse-item>

          <!-- 字体 -->
          <el-collapse-item
            title="字体"
            name="font"
            v-if="!hasAllCustomStyles(['fontSize', 'fontWeight', 'textAlign'])"
          >
            <el-form-item label="字体大小" v-if="!hasCustomStyle('fontSize')">
              <el-input v-model="nodeStyle.fontSize" placeholder="14px" />
            </el-form-item>

            <el-form-item label="字体粗细" v-if="!hasCustomStyle('fontWeight')">
              <el-select v-model="nodeStyle.fontWeight" clearable>
                <el-option label="正常" value="normal" />
                <el-option label="粗体" value="bold" />
                <el-option label="100" value="100" />
                <el-option label="400" value="400" />
                <el-option label="600" value="600" />
                <el-option label="900" value="900" />
              </el-select>
            </el-form-item>

            <el-form-item label="文本对齐" v-if="!hasCustomStyle('textAlign')">
              <el-select v-model="nodeStyle.textAlign" clearable>
                <el-option label="左对齐" value="left" />
                <el-option label="居中" value="center" />
                <el-option label="右对齐" value="right" />
              </el-select>
            </el-form-item>
          </el-collapse-item>
        </el-collapse>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Component } from 'vue'
import type { NodeSchema } from '@vela/core'
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

// Extended style config with name field for iteration
interface NamedStyleConfig extends PropConfig {
  name: string
}

interface Props {
  node?: NodeSchema | null
}

const props = defineProps<Props>()

const componentStore = useComponent()

const activeGroups = ref<string[]>(['尺寸', '布局', '外观'])
const activeNames = ref(['size', 'appearance'])
const opacityValue = ref(100)

// 获取当前组件的 Meta 样式配置
const metaStyles = computed<NamedStyleConfig[]>(() => {
  if (!props.node) return []
  const meta = materialList.find((m) => m.componentName === props.node!.componentName)
  if (!meta?.styles) return []

  return Object.entries(meta.styles).map(([name, config]) => ({
    name,
    ...config,
  }))
})

// 按 group 分组样式
const groupedStyles = computed(() => {
  if (metaStyles.value.length === 0) return []

  const groups = new Map<string, NamedStyleConfig[]>()

  metaStyles.value.forEach((style) => {
    const groupName = style.group || '其他'
    if (!groups.has(groupName)) {
      groups.set(groupName, [])
    }
    groups.get(groupName)!.push(style)
  })

  return Array.from(groups.entries()).map(([name, styles]) => ({
    name,
    styles,
  }))
})

// 响应式样式对象
const nodeStyle = computed(() => {
  if (!props.node) {
    return {}
  }
  if (!props.node.style) {
    props.node.style = {}
  }
  return props.node.style as Record<string, any>
})

// 更新样式时通知 store
function updateStyle(styleName: string) {
  if (!props.node) return
  componentStore.updateStyle(props.node.id, {
    [styleName]: nodeStyle.value[styleName],
  })
}

// 映射 Setter 字符串到组件
const setterMap: Record<string, Component> = {
  StringSetter,
  NumberSetter,
  SelectSetter,
  ColorSetter,
  BooleanSetter,
}

const getSetterComponent = (setterName?: string): Component => {
  if (!setterName) return StringSetter
  return setterMap[setterName] || StringSetter
}

// 监听透明度值
watch(
  () => props.node?.style?.opacity,
  (val) => {
    if (val !== undefined) {
      opacityValue.value = parseFloat(val as string) * 100
    }
  },
  { immediate: true },
)

const updateOpacity = (val: number | number[]) => {
  const opacity = Array.isArray(val) ? val[0] : val
  if (props.node && props.node.style) {
    props.node.style.opacity = (opacity / 100).toString()
    componentStore.updateStyle(props.node.id, {
      opacity: (opacity / 100).toString(),
    })
  }
}

// Helper functions for template
const hasCustomStyle = (name: string) => {
  return metaStyles.value.some((s) => s.name === name)
}

const hasAllCustomStyles = (names: string[]) => {
  return names.every((name) => hasCustomStyle(name))
}
</script>

<style scoped>
.style-pane-enhanced {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.style-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.style-form {
  width: 100%;
}

.style-collapse {
  border: none;
}

.style-collapse :deep(.el-collapse-item__header) {
  font-weight: 500;
  font-size: 13px;
  padding-left: 0;
  background: transparent;
}

.style-collapse :deep(.el-collapse-item__content) {
  padding-left: 0;
}

.style-form :deep(.el-form-item) {
  margin-bottom: 16px;
}

.style-form :deep(.el-form-item__label) {
  font-size: 13px;
  color: var(--el-text-color-regular);
  margin-bottom: 6px;
}

.style-description {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
  line-height: 1.5;
}
</style>
