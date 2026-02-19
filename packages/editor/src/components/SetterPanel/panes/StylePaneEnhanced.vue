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
                  @update:model-value="(val: unknown) => setMetaStyleValue(style, val)"
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
          <!-- 布局模式 (仅容器组件) -->
          <el-collapse-item title="布局模式" name="layoutMode" v-if="isContainer">
            <el-form-item label="子节点布局">
              <el-radio-group
                :model-value="layoutModeValue"
                @update:model-value="
                  (val: 'grid' | 'free' | undefined) => setLayoutMode((val as 'grid' | 'free') || 'grid')
                "
              >
                <el-radio-button label="grid">网格编排</el-radio-button>
                <el-radio-button label="free">自由布局</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-collapse-item>

          <!-- 尺寸 -->
          <el-collapse-item
            title="尺寸"
            name="size"
            v-if="!hasAllCustomStyles(['width', 'height'])"
          >
            <el-form-item label="宽度" v-if="!hasCustomStyle('width')">
              <SizeInput
                :model-value="getSizeValue('width')"
                @update:model-value="(val) => setStyleValue('width', val)"
              />
            </el-form-item>

            <el-form-item label="高度" v-if="!hasCustomStyle('height')">
              <SizeInput
                :model-value="getSizeValue('height')"
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
                @update:model-value="(val: string | null) => setStyleValue('backgroundColor', val)"
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

            <div class="spacing-editor">
              <div class="spacing-editor-block" v-if="!hasCustomStyle('margin')">
                <div class="spacing-editor-title">Margin 四边（px）</div>
                <div class="spacing-editor-grid">
                  <label class="spacing-cell">
                    <span>上</span>
                    <el-input-number
                      :model-value="getSpacingSideValue('margin', 'top')"
                      :step="1"
                      :min="-500"
                      :max="1000"
                      controls-position="right"
                      @update:model-value="
                        (val: number | undefined) => setSpacingSideValue('margin', 'top', val)
                      "
                    />
                  </label>
                  <label class="spacing-cell">
                    <span>右</span>
                    <el-input-number
                      :model-value="getSpacingSideValue('margin', 'right')"
                      :step="1"
                      :min="-500"
                      :max="1000"
                      controls-position="right"
                      @update:model-value="
                        (val: number | undefined) => setSpacingSideValue('margin', 'right', val)
                      "
                    />
                  </label>
                  <label class="spacing-cell">
                    <span>下</span>
                    <el-input-number
                      :model-value="getSpacingSideValue('margin', 'bottom')"
                      :step="1"
                      :min="-500"
                      :max="1000"
                      controls-position="right"
                      @update:model-value="
                        (val: number | undefined) => setSpacingSideValue('margin', 'bottom', val)
                      "
                    />
                  </label>
                  <label class="spacing-cell">
                    <span>左</span>
                    <el-input-number
                      :model-value="getSpacingSideValue('margin', 'left')"
                      :step="1"
                      :min="-500"
                      :max="1000"
                      controls-position="right"
                      @update:model-value="
                        (val: number | undefined) => setSpacingSideValue('margin', 'left', val)
                      "
                    />
                  </label>
                </div>
              </div>

              <div class="spacing-editor-block" v-if="!hasCustomStyle('padding')">
                <div class="spacing-editor-title">Padding 四边（px）</div>
                <div class="spacing-editor-grid">
                  <label class="spacing-cell">
                    <span>上</span>
                    <el-input-number
                      :model-value="getSpacingSideValue('padding', 'top')"
                      :step="1"
                      :min="0"
                      :max="500"
                      controls-position="right"
                      @update:model-value="
                        (val: number | undefined) => setSpacingSideValue('padding', 'top', val)
                      "
                    />
                  </label>
                  <label class="spacing-cell">
                    <span>右</span>
                    <el-input-number
                      :model-value="getSpacingSideValue('padding', 'right')"
                      :step="1"
                      :min="0"
                      :max="500"
                      controls-position="right"
                      @update:model-value="
                        (val: number | undefined) => setSpacingSideValue('padding', 'right', val)
                      "
                    />
                  </label>
                  <label class="spacing-cell">
                    <span>下</span>
                    <el-input-number
                      :model-value="getSpacingSideValue('padding', 'bottom')"
                      :step="1"
                      :min="0"
                      :max="500"
                      controls-position="right"
                      @update:model-value="
                        (val: number | undefined) => setSpacingSideValue('padding', 'bottom', val)
                      "
                    />
                  </label>
                  <label class="spacing-cell">
                    <span>左</span>
                    <el-input-number
                      :model-value="getSpacingSideValue('padding', 'left')"
                      :step="1"
                      :min="0"
                      :max="500"
                      controls-position="right"
                      @update:model-value="
                        (val: number | undefined) => setSpacingSideValue('padding', 'left', val)
                      "
                    />
                  </label>
                </div>
              </div>
            </div>
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
const activeNames = ref(['layoutMode', 'size', 'appearance'])

const CONTAINER_COMPONENTS = [
  'Container',
  'Row',
  'Col',
  'Flex',
  'Grid',
  'Panel',
  'Card',
  'Tabs',
  'TabPane',
  'Modal',
  'Page',
]

const isContainer = computed(() => {
  return (
    !!props.node &&
    CONTAINER_COMPONENTS.includes(props.node.component || props.node.componentName || '')
  )
})

const layoutModeValue = computed(() => {
  return (props.node?.container?.mode === 'free' ? 'free' : 'grid') as 'grid' | 'free'
})

function setLayoutMode(mode: 'grid' | 'free') {
  if (!props.node) return
  componentStore.updateContainerLayout(props.node.id, mode)
}

// 获取当前组件的 Meta 样式配置（包含 styles 和 group='样式' 的 props）
const metaStyles = computed<NamedStyleConfig[]>(() => {
  if (!props.node) return []
  const nodeName = props.node!.component || props.node!.componentName
  const meta = materialList.find((m) => m.name === nodeName || m.componentName === nodeName)

  const styles: NamedStyleConfig[] = []

  // 1. Native Styles
  if (meta?.styles) {
    styles.push(
      ...Object.entries(meta.styles).map(([name, config]) => ({
        ...config,
        name,
        isProp: false,
      })),
    )
  }

  // 2. Style Props (group === '样式')
  if (meta?.props) {
    styles.push(
      ...Object.entries(meta.props)
        .filter(([, config]) => config.group === '样式')
        .map(([name, config]) => ({
          ...config,
          name,
          isProp: true,
        })),
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
  void componentStore.styleVersion[props.node.id]

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
  if (styleName === 'margin' || styleName === 'padding') {
    const sideKeys = Object.values(spacingStyleKeyMap[styleName])
    const patch: Record<string, unknown> = { [styleName]: value }
    for (const key of sideKeys) {
      patch[key] = undefined
    }
    componentStore.updateStyle(props.node.id, patch)
    return
  }
  componentStore.updateStyle(props.node.id, { [styleName]: value })
}

function getSizeValue(styleName: 'width' | 'height'): string | number | undefined {
  const value = getStyleValue(styleName)
  return typeof value === 'string' || typeof value === 'number' ? value : undefined
}

type SpacingKind = 'margin' | 'padding'
type SpacingSide = 'top' | 'right' | 'bottom' | 'left'

const spacingStyleKeyMap: Record<SpacingKind, Record<SpacingSide, string>> = {
  margin: {
    top: 'marginTop',
    right: 'marginRight',
    bottom: 'marginBottom',
    left: 'marginLeft',
  },
  padding: {
    top: 'paddingTop',
    right: 'paddingRight',
    bottom: 'paddingBottom',
    left: 'paddingLeft',
  },
}

function parseSpacingNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return 0
    const match = trimmed.match(/^(-?\d+(?:\.\d+)?)(px)?$/i)
    if (match) {
      return Number.parseFloat(match[1])
    }
  }
  return 0
}

function parseSpacingShorthand(value: unknown): [number, number, number, number] | null {
  if (typeof value !== 'string') return null
  const parts = value
    .trim()
    .split(/\s+/)
    .map((item) => parseSpacingNumber(item))

  if (parts.length === 1) return [parts[0], parts[0], parts[0], parts[0]]
  if (parts.length === 2) return [parts[0], parts[1], parts[0], parts[1]]
  if (parts.length === 3) return [parts[0], parts[1], parts[2], parts[1]]
  if (parts.length === 4) return [parts[0], parts[1], parts[2], parts[3]]
  return null
}

function getSpacingSideValue(kind: SpacingKind, side: SpacingSide): number {
  const sideKey = spacingStyleKeyMap[kind][side]
  const sideValue = getStyleValue(sideKey)
  if (sideValue !== undefined && sideValue !== null && sideValue !== '') {
    return parseSpacingNumber(sideValue)
  }

  const shorthand = parseSpacingShorthand(getStyleValue(kind))
  if (shorthand) {
    const idx = side === 'top' ? 0 : side === 'right' ? 1 : side === 'bottom' ? 2 : 3
    return shorthand[idx]
  }

  return 0
}

function setSpacingSideValue(kind: SpacingKind, side: SpacingSide, value: number | undefined): void {
  if (!props.node) return
  const sideKey = spacingStyleKeyMap[kind][side]
  const numeric = Number.isFinite(value) ? Math.round(value as number) : 0
  const bounded = kind === 'padding' ? Math.max(0, Math.min(500, numeric)) : Math.max(-500, numeric)
  componentStore.updateStyle(props.node.id, {
    [kind]: undefined,
    [sideKey]: `${bounded}px`,
  })
}

/**
 * 获取 Meta 定义的样式/属性值
 */
function getMetaStyleValue(style: NamedStyleConfig): unknown {
  if (!props.node) return style.defaultValue

  // 订阅版本号变化以触发响应式更新
  void componentStore.styleVersion[props.node.id]

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

.spacing-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}

.spacing-editor-block {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 10px;
  background: var(--el-fill-color-extra-light);
}

.spacing-editor-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  margin-bottom: 8px;
}

.spacing-editor-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.spacing-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.spacing-cell :deep(.el-input-number) {
  width: 128px;
}
</style>
