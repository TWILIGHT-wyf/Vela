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
                :label="translate(style.title) || style.label || style.name"
              >
                <component
                  :is="getSetterComponent(style.setter)"
                  :model-value="getMetaStyleValue(style)"
                  v-bind="style.setterProps || {}"
                  @update:model-value="(val: any) => setMetaStyleValue(style, val)"
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
              <SizeInput
                :model-value="getStyleValue('width')"
                @update:model-value="(val) => setStyleValue('width', val)"
              />
            </el-form-item>

            <el-form-item label="高度" v-if="!hasCustomStyle('height')">
              <SizeInput
                :model-value="getStyleValue('height')"
                @update:model-value="(val) => setStyleValue('height', val)"
              />
            </el-form-item>
          </el-collapse-item>

          <!-- 定位 -->
          <el-collapse-item
            title="定位"
            name="position"
            v-if="!hasAllCustomStyles(['position', 'left', 'top'])"
          >
            <el-form-item label="定位方式" v-if="!hasCustomStyle('position')">
              <el-select
                :model-value="getStyleValue('position')"
                @update:model-value="(val: string) => setStyleValue('position', val)"
                clearable
              >
                <el-option label="相对定位" value="relative" />
                <el-option label="绝对定位" value="absolute" />
                <el-option label="固定定位" value="fixed" />
                <el-option label="静态" value="static" />
              </el-select>
            </el-form-item>

            <template v-if="currentPosition === 'absolute' || currentPosition === 'fixed'">
              <el-form-item label="Left" v-if="!hasCustomStyle('left')">
                <el-input
                  :model-value="getStyleValue('left')"
                  placeholder="0px"
                  @update:model-value="(val: string) => setStyleValue('left', val)"
                />
              </el-form-item>
              <el-form-item label="Top" v-if="!hasCustomStyle('top')">
                <el-input
                  :model-value="getStyleValue('top')"
                  placeholder="0px"
                  @update:model-value="(val: string) => setStyleValue('top', val)"
                />
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
              <el-color-picker
                :model-value="getStyleValue('backgroundColor')"
                show-alpha
                @update:model-value="
                  (val: string | null) => setStyleValue('backgroundColor', val)
                "
              />
            </el-form-item>

            <el-form-item label="文字颜色" v-if="!hasCustomStyle('color')">
              <el-color-picker
                :model-value="getStyleValue('color')"
                show-alpha
                @update:model-value="(val: string | null) => setStyleValue('color', val)"
              />
            </el-form-item>

            <el-form-item label="边框" v-if="!hasCustomStyle('border')">
              <el-input
                :model-value="getStyleValue('border')"
                placeholder="1px solid #ddd"
                @update:model-value="(val: string) => setStyleValue('border', val)"
              />
            </el-form-item>

            <el-form-item label="圆角" v-if="!hasCustomStyle('borderRadius')">
              <el-input
                :model-value="getStyleValue('borderRadius')"
                placeholder="4px"
                @update:model-value="(val: string) => setStyleValue('borderRadius', val)"
              />
            </el-form-item>

            <el-form-item label="透明度" v-if="!hasCustomStyle('opacity')">
              <el-slider
                :model-value="opacityPercent"
                :min="0"
                :max="100"
                @update:model-value="setOpacity"
              />
            </el-form-item>
          </el-collapse-item>

          <!-- 间距 -->
          <el-collapse-item
            title="间距"
            name="spacing"
            v-if="!hasAllCustomStyles(['margin', 'padding'])"
          >
            <el-form-item label="外边距 (Margin)" v-if="!hasCustomStyle('margin')">
              <el-input
                :model-value="getStyleValue('margin')"
                placeholder="10px 20px"
                @update:model-value="(val: string) => setStyleValue('margin', val)"
              />
            </el-form-item>

            <el-form-item label="内边距 (Padding)" v-if="!hasCustomStyle('padding')">
              <el-input
                :model-value="getStyleValue('padding')"
                placeholder="10px 20px"
                @update:model-value="(val: string) => setStyleValue('padding', val)"
              />
            </el-form-item>
          </el-collapse-item>

          <!-- 字体 -->
          <el-collapse-item
            title="字体"
            name="font"
            v-if="!hasAllCustomStyles(['fontSize', 'fontWeight', 'textAlign'])"
          >
            <el-form-item label="字体大小" v-if="!hasCustomStyle('fontSize')">
              <el-input
                :model-value="getStyleValue('fontSize')"
                placeholder="14px"
                @update:model-value="(val: string) => setStyleValue('fontSize', val)"
              />
            </el-form-item>

            <el-form-item label="字体粗细" v-if="!hasCustomStyle('fontWeight')">
              <el-select
                :model-value="getStyleValue('fontWeight')"
                clearable
                @update:model-value="(val: string) => setStyleValue('fontWeight', val)"
              >
                <el-option label="正常" value="normal" />
                <el-option label="粗体" value="bold" />
                <el-option label="100" value="100" />
                <el-option label="400" value="400" />
                <el-option label="600" value="600" />
                <el-option label="900" value="900" />
              </el-select>
            </el-form-item>

            <el-form-item label="文本对齐" v-if="!hasCustomStyle('textAlign')">
              <el-select
                :model-value="getStyleValue('textAlign')"
                clearable
                @update:model-value="(val: string) => setStyleValue('textAlign', val)"
              >
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
import { ref, computed } from 'vue'
import type { Component } from 'vue'
import { type NodeSchema, translate } from '@vela/core'
import type { PropConfig } from '@vela/core/types/material'
import { materialList } from '@vela/materials'
import { Select } from '@element-plus/icons-vue'
import { useComponent } from '@/stores/component'
import SizeInput from '@/components/common/SizeInput.vue'

// 导入所有 Setters
import StringSetter from '../setters/StringSetter.vue'
import NumberSetter from '../setters/NumberSetter.vue'
import SelectSetter from '../setters/SelectSetter.vue'
import ColorSetter from '../setters/ColorSetter.vue'
import BooleanSetter from '../setters/BooleanSetter.vue'
import ObjectSetter from '../setters/ObjectSetter.vue'
import JsonSetter from '../setters/JsonSetter.vue'

// Extended style config with name field for iteration
interface NamedStyleConfig extends PropConfig {
  isProp?: boolean
}

interface Props {
  node?: NodeSchema | null
}

const props = defineProps<Props>()

const componentStore = useComponent()

const activeGroups = ref<string[]>(['尺寸', '布局', '外观'])
const activeNames = ref(['size', 'appearance'])

// 获取当前组件的 Meta 样式配置（包含 styles 和 group='样式' 的 props）
const metaStyles = computed<NamedStyleConfig[]>(() => {
  if (!props.node) return []
  const meta = materialList.find((m) => m.componentName === props.node!.componentName)

  const styles: NamedStyleConfig[] = []

  // 1. Native Styles
  if (meta?.styles) {
    styles.push(
      ...Object.entries(meta.styles).map(([name, config]) => {
        const { name: _n, ...rest } = config
        return {
          name,
          ...rest,
          isProp: false,
        }
      }),
    )
  }

  // 2. Style Props (group === '样式')
  if (meta?.props) {
    styles.push(
      ...Object.entries(meta.props)
        .filter(([_, config]) => config.group === '样式')
        .map(([name, config]) => {
          const { name: _n, ...rest } = config
          return {
            name,
            ...rest,
            isProp: true,
          }
        }),
    )
  }

  return styles
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

// ========== 响应式双向绑定（改进后的核心逻辑）==========

/**
 * 获取样式值（响应式读取）
 * 通过订阅 styleVersion 实现响应式更新
 */
function getStyleValue(styleName: string, defaultValue?: unknown): unknown {
  if (!props.node) return defaultValue

  // 订阅版本号变化以触发响应式更新
  const _v = componentStore.styleVersion[props.node.id]

  const nodeStyle = props.node.style || {}
  const value = nodeStyle[styleName as keyof typeof nodeStyle]
  return value !== undefined ? value : defaultValue
}

/**
 * 设置样式值（直接更新 store）
 * 无需本地状态副本，直接写入 store
 */
function setStyleValue(styleName: string, value: unknown): void {
  if (!props.node) return
  componentStore.updateStyle(props.node.id, { [styleName]: value })
}

/**
 * 获取 Meta 定义的样式/属性值
 */
function getMetaStyleValue(style: NamedStyleConfig): unknown {
  if (!props.node) return style.defaultValue

  // 订阅版本号变化以触发响应式更新
  const _v = componentStore.styleVersion[props.node.id]

  if (style.isProp) {
    const nodeProps = props.node.props || {}
    const value = nodeProps[style.name]
    return value !== undefined ? value : style.defaultValue
  } else {
    const nodeStyle = props.node.style || {}
    const value = nodeStyle[style.name as keyof typeof nodeStyle]
    return value !== undefined ? value : style.defaultValue
  }
}

/**
 * 设置 Meta 定义的样式/属性值
 */
function setMetaStyleValue(style: NamedStyleConfig, value: unknown): void {
  if (!props.node) return

  if (style.isProp) {
    componentStore.updateProps(props.node.id, { [style.name]: value })
  } else {
    componentStore.updateStyle(props.node.id, { [style.name]: value })
  }
}

// 当前定位方式（用于条件渲染）
const currentPosition = computed(() => {
  return getStyleValue('position') as string | undefined
})

// 透明度百分比值
const opacityPercent = computed(() => {
  const opacity = getStyleValue('opacity')
  if (opacity === undefined) return 100
  return Math.round(parseFloat(String(opacity)) * 100)
})

// 设置透明度
function setOpacity(val: number | number[]): void {
  const opacity = Array.isArray(val) ? val[0] : val
  setStyleValue('opacity', (opacity / 100).toString())
}

// Setter 组件映射（包含回退）
const setterMap: Record<string, Component> = {
  StringSetter,
  NumberSetter,
  SelectSetter,
  ColorSetter,
  BooleanSetter,
  ObjectSetter,
  JsonSetter,
  // 回退映射：使用现有组件处理缺失的 Setter
  SliderSetter: NumberSetter,
  ImageSetter: StringSetter,
  TextAreaSetter: StringSetter,
}

const getSetterComponent = (setterName?: string): Component => {
  if (!setterName) return StringSetter
  return setterMap[setterName] || StringSetter
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

.style-form :deep(.el-form-item__content) {
  width: 100%;
}

.style-description {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
  line-height: 1.5;
}
</style>
