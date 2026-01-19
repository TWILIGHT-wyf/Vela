<template>
  <BaseBadge v-bind="badgeProps">
    <!-- 子组件渲染 -->
    <div v-if="hasChildren" class="badge-children-wrapper" :style="childrenContainerStyle">
      <template v-if="comp?.layout?.mode === 'absolute'">
        <!-- 绝对定位模式：用 Shape 包裹使子组件可拖拽 -->
        <Shape v-for="childId in comp?.children" :key="childId" :id="childId">
          <component
            :is="getComponentByType(getChildComponent(childId)?.type || '')"
            :id="childId"
            :style="{ width: '100%', height: '100%' }"
          />
        </Shape>
      </template>
      <template v-else>
        <!-- 其他布局模式：直接渲染 -->
        <div
          v-for="childId in comp?.children"
          :key="childId"
          class="child-item"
          :style="getChildItemStyle(childId)"
        >
          <component
            :is="getComponentByType(getChildComponent(childId)?.type || '')"
            :id="childId"
            :style="getChildComponentStyle(childId)"
          />
        </div>
      </template>
    </div>
  </BaseBadge>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import type { CSSProperties } from 'vue'
import { useComponent } from '@vela/editor/stores/component'
import { storeToRefs } from 'pinia'
import { vBadge as BaseBadge, useDataSource, extractWithFallback } from '@vela/ui'
import { componentRegistry } from '@vela/materials/registry'
import Shape from '@vela/editor/components/Canvas/modes/Free/Shape/Shape.vue'

const props = defineProps<{ id: string }>()
const { componentStore } = storeToRefs(useComponent())

const comp = computed(() => componentStore.value.find((c) => c.id === props.id))

// 数据源
const dataSourceRef = toRef(() => comp.value?.dataSource)
const { data: remoteData } = useDataSource(dataSourceRef)

// 显示值
const displayValue = computed<string | number>(() => {
  const ds = comp.value?.dataSource
  const localValue = (comp.value?.props.value as string | number) ?? ''

  if (ds?.enabled && remoteData.value) {
    return extractWithFallback(remoteData.value, ds.valuePath, localValue) as string | number
  }
  return localValue
})

// 处理显示值
const processedValue = computed(() => {
  const isDot = (comp.value?.props.dot as boolean) ?? false
  const maxValue = (comp.value?.props.maxValue as number) ?? 99
  if (isDot) return ''
  const val = displayValue.value
  if (typeof val === 'number' && val > maxValue) {
    return `${maxValue}+`
  }
  return val
})

// 聚合所有 Props 传递给 Base 组件
const badgeProps = computed((): Record<string, unknown> => {
  const s = comp.value?.style || {}
  const p = comp.value?.props || {}
  return {
    value: processedValue.value,
    type: p.type ?? 'primary',
    isDot: p.dot ?? false,
    max: p.maxValue ?? 99,
    hidden: p.hidden ?? false,
    showZero: p.showZero ?? false,
    offset: [(p.offsetX as number) ?? 0, (p.offsetY as number) ?? 0],
    slotText: hasChildren.value ? undefined : (p.slotText ?? ''),
    // 容器样式
    opacity: s.opacity ?? 100,
    visible: s.visible !== false,
    padding: s.padding ?? 4,
    // 插槽内容样式
    slotFontSize: s.slotFontSize ?? 14,
    slotColor: s.slotColor ?? '#303133',
    slotPadding: s.slotPadding ?? 8,
  }
})

// 子组件相关
const hasChildren = computed(() => {
  return comp.value?.children && comp.value.children.length > 0
})

const getChildComponent = (childId: string) => {
  return componentStore.value.find((c) => c.id === childId)
}

const getComponentByType = (type: string) => {
  return componentRegistry[type] || 'div'
}

// 子组件容器样式(根据布局模式)
const childrenContainerStyle = computed<CSSProperties>(() => {
  const layout = comp.value?.layout
  const mode = layout?.mode || 'absolute'
  const gap = layout?.gap ?? 8
  const padding = layout?.padding ?? 0
  const align = layout?.align || 'start'

  const baseStyle: CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    padding: `${padding}px`,
    boxSizing: 'border-box',
  }

  switch (mode) {
    case 'horizontal':
      return {
        ...baseStyle,
        display: 'flex',
        flexDirection: 'row',
        gap: `${gap}px`,
        alignItems:
          align === 'stretch'
            ? 'stretch'
            : align === 'center'
              ? 'center'
              : align === 'end'
                ? 'flex-end'
                : 'flex-start',
      }
    case 'vertical':
      return {
        ...baseStyle,
        display: 'flex',
        flexDirection: 'column',
        gap: `${gap}px`,
        alignItems:
          align === 'stretch'
            ? 'stretch'
            : align === 'center'
              ? 'center'
              : align === 'end'
                ? 'flex-end'
                : 'flex-start',
      }
    case 'grid':
      return {
        ...baseStyle,
        display: 'grid',
        gridTemplateColumns: `repeat(${layout?.columns || 2}, 1fr)`,
        gap: `${gap}px`,
        alignItems:
          align === 'stretch'
            ? 'stretch'
            : align === 'center'
              ? 'center'
              : align === 'end'
                ? 'end'
                : 'start',
      }
    case 'absolute':
    default:
      return baseStyle
  }
})

// 子组件项样式
const getChildItemStyle = (childId: string): CSSProperties => {
  const layout = comp.value?.layout
  const mode = layout?.mode || 'absolute'
  const child = getChildComponent(childId)

  if (mode === 'absolute' && child) {
    return {
      position: 'absolute',
      left: `${child.position.x}px`,
      top: `${child.position.y}px`,
      width: `${child.size.width}px`,
      height: `${child.size.height}px`,
    }
  }

  return {}
}

// 子组件内部样式
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getChildComponentStyle = (_childId: string): CSSProperties => {
  return {
    width: '100%',
    height: '100%',
  }
}
</script>

<style scoped>
.badge-children-wrapper {
  box-sizing: border-box;
}

.child-item {
  box-sizing: border-box;
}
</style>
