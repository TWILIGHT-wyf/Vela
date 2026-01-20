<template>
  <component
    :is="componentType"
    :ref="setComponentRef"
    :id="component.id"
    :data-component-id="component.id"
    :class="computedClasses"
    :style="computedStyle"
    v-bind="componentProps"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @dblclick="handleDoubleClick"
    @update:modelValue="handleUpdateModelValue"
  >
    <!-- Text组件特殊处理 -->
    <template v-if="component.type === 'Text'">
      {{ component.props?.text }}
    </template>

    <!-- 递归渲染子组件 -->
    <template v-else>
      <RuntimeComponent
        v-for="child in children"
        :key="child.id"
        :component="child"
        :allComponents="allComponents"
        @trigger-event="$emit('trigger-event', $event)"
        @update-prop="$emit('update-prop', $event)"
      />
    </template>
  </component>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch, toRef } from 'vue'
import { componentRegistry } from '@vela/materials/registry'
import type { Component, EventAction } from '@vela/core/types/components'
import { useComponentDataSource } from './useComponentDataSource'

const props = defineProps<{
  component: Component
  allComponents: Component[]
}>()

const emit = defineEmits<{
  'trigger-event': [payload: { componentId: string; eventType: string; actions: EventAction[] }]
  'update-prop': [payload: { componentId: string; path: string; value: unknown }]
}>()

// Data Source Integration
// @ts-ignore - Component type mismatch with NodeSchema
const { dataSourceProps } = useComponentDataSource(toRef(props, 'component'))

const componentRef = ref<HTMLElement | { $el: HTMLElement } | null>(null)
const animationPlaying = ref(false)

// Ref callback for template
function setComponentRef(el: unknown) {
  componentRef.value = el as HTMLElement | { $el: HTMLElement } | null
}

// 获取组件类型
const componentType = computed(() => {
  const typeMap: Record<string, string> = {
    Text: 'div',
    row: 'el-row',
    col: 'el-col',
    Group: 'div',
  }
  // 优先使用 componentName (新版 Schema), 降级使用 type (旧版)
  const type = props.component.componentName || props.component.type

  if (!type) {
    console.warn(`[RuntimeComponent] Component has no type or componentName:`, props.component)
    return 'div'
  }

  const resolved = componentRegistry[type] || typeMap[type]
  if (!resolved) {
    // console.warn(`[RuntimeComponent] Failed to resolve component: ${type}`)
    return 'div'
  }

  return resolved
})

// 子组件
const children = computed(() => {
  return props.allComponents.filter((c) => c.groupId === props.component.id)
})

// 计算样式
const computedStyle = computed(() => {
  const comp = props.component
  const style: Record<string, string | number> = {
    position: 'absolute',
    left: `${comp.position.x}px`,
    top: `${comp.position.y}px`,
    width: `${comp.size.width}px`,
    height: `${comp.size.height}px`,
    transform: `rotate(${comp.rotation || 0}deg)`,
    zIndex: comp.zindex || 0,
  }

  // Text组件特殊样式
  if (comp.type === 'Text' && comp.style) {
    if (comp.style.fontSize) style.fontSize = `${comp.style.fontSize}px`
    if (comp.style.fontColor) style.color = String(comp.style.fontColor)
    if (comp.style.fontWeight) style.fontWeight = String(comp.style.fontWeight)
    if (comp.style.textAlign) style.textAlign = String(comp.style.textAlign)
    if (comp.style.lineHeight) style.lineHeight = String(comp.style.lineHeight)
  }

  // 通用样式
  if (comp.style) {
    if (comp.style.opacity !== undefined) {
      style.opacity = Number(comp.style.opacity) / 100
    }
    // 处理可见性 - 显式设置display以确保toggle正常工作
    if (comp.style.visible === false) {
      style.display = 'none'
    } else if (comp.style.visible === true || comp.style.visible === undefined) {
      // 显式设置为空字符串,移除display限制
      style.display = ''
    }
    if (comp.style.backgroundColor) {
      style.backgroundColor = String(comp.style.backgroundColor)
    }
    if (comp.style.borderRadius) {
      style.borderRadius = `${comp.style.borderRadius}px`
    }
    if (comp.style.border) {
      style.border = String(comp.style.border)
    }
    if (comp.style.boxShadow) {
      style.boxShadow = String(comp.style.boxShadow)
    }
    if (comp.style.padding) {
      style.padding = `${comp.style.padding}px`
    }
  }

  // 动画样式
  if (comp.animation && comp.animation.class) {
    style.animationDuration = `${comp.animation.duration || 0.7}s`
    style.animationDelay = `${comp.animation.delay || 0}s`
    style.animationIterationCount = comp.animation.iterationCount || 1
    style.animationTimingFunction = comp.animation.timingFunction || 'ease'
  }

  return style
})

// 计算class
const computedClasses = computed(() => {
  const classes: string[] = []

  if (props.component.animation && props.component.animation.class) {
    const trigger = props.component.animation.trigger || 'load'

    // load触发的动画直接添加class,自动播放
    if (trigger === 'load') {
      classes.push('animated', props.component.animation.class)
    }
    // hover/click触发的动画只在播放时添加class,避免初始opacity:0等样式导致不可见
    else if ((trigger === 'hover' || trigger === 'click') && animationPlaying.value) {
      classes.push('animated', props.component.animation.class)
    }
  }

  return classes
})

// 组件Props
const componentProps = computed(() => {
  const compProps: Record<string, unknown> = {}
  if (props.component.props) {
    for (const [key, value] of Object.entries(props.component.props)) {
      // Text组件跳过text属性(已用插值渲染)
      if (props.component.type === 'Text' && key === 'text') continue
      compProps[key] = value
    }
  }
  // Merge data source props
  return { ...compProps, ...dataSourceProps.value }
})

function handleUpdateModelValue(val: unknown) {
  emit('update-prop', {
    componentId: props.component.id,
    path: 'props.modelValue',
    value: val,
  })
}

// 页面加载时触发动画
onMounted(() => {
  if (props.component.animation && props.component.animation.trigger === 'load') {
    nextTick(() => {
      // load触发的动画自动播放
    })
  }
})

// 监听动画配置变化
watch(
  () => props.component.animation,
  () => {
    if (props.component.animation?.trigger === 'load') {
      playAnimation()
    }
  },
)

// 播放动画
function playAnimation() {
  animationPlaying.value = true

  // 使用nextTick确保class更新后再设置动画
  nextTick(() => {
    const el = getElement()
    if (!el) return

    el.classList.remove('animation-paused')
    el.style.animation = 'none'
    setTimeout(() => {
      el.style.animation = ''
    }, 10)
  })
}

// 重置动画
function resetAnimation() {
  const el = getElement()
  if (!el) return

  animationPlaying.value = false
  el.classList.add('animation-paused')
  el.style.animation = 'none'
  setTimeout(() => {
    el.style.animation = ''
  }, 10)
}

// 获取DOM元素
function getElement(): HTMLElement | null {
  if (!componentRef.value) return null

  // Vue组件需要访问$el
  if ('$el' in componentRef.value) {
    return componentRef.value.$el as HTMLElement
  }
  // 原生元素直接返回
  return componentRef.value as HTMLElement
}

// 点击事件
function handleClick() {
  const comp = props.component

  // 动画触发
  if (comp.animation && comp.animation.trigger === 'click') {
    playAnimation()
  }

  // 业务事件
  if (comp.events?.click && comp.events.click.length > 0) {
    emit('trigger-event', {
      componentId: comp.id,
      eventType: 'click',
      actions: comp.events.click,
    })
  }
}

// 鼠标进入
function handleMouseEnter() {
  const comp = props.component

  // 动画触发
  if (comp.animation && comp.animation.trigger === 'hover') {
    playAnimation()
  }

  // 业务事件
  if (comp.events?.hover && comp.events.hover.length > 0) {
    emit('trigger-event', {
      componentId: comp.id,
      eventType: 'hover',
      actions: comp.events.hover,
    })
  }
}

// 鼠标离开
function handleMouseLeave() {
  const comp = props.component

  // 动画重置
  if (comp.animation && comp.animation.trigger === 'hover') {
    resetAnimation()
  }
}

// 双击事件
function handleDoubleClick() {
  const comp = props.component

  if (comp.events?.doubleClick && comp.events.doubleClick.length > 0) {
    emit('trigger-event', {
      componentId: comp.id,
      eventType: 'doubleClick',
      actions: comp.events.doubleClick,
    })
  }
}
</script>

<style scoped>
/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.anim-fade {
  animation: fadeIn 0.8s ease both;
}

@keyframes zoomIn {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  60% {
    opacity: 1;
  }
  100% {
    transform: scale(1);
  }
}
.anim-zoom {
  animation: zoomIn 0.7s cubic-bezier(0.4, 0, 0.2, 1) both;
}

@keyframes slideLeft {
  0% {
    transform: translateX(40px);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}
.anim-slide-left {
  animation: slideLeft 0.6s ease-out both;
}

@keyframes slideUp {
  0% {
    transform: translateY(40px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}
.anim-slide-up {
  animation: slideUp 0.6s ease-out both;
}

@keyframes bounceIn {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  60% {
    transform: scale(1.1);
    opacity: 1;
  }
  80% {
    transform: scale(0.95);
  }
  100% {
    transform: scale(1);
  }
}
.anim-bounce {
  animation: bounceIn 0.7s cubic-bezier(0.68, -0.55, 0.27, 1.55) both;
}

@keyframes rotateIn {
  0% {
    transform: rotate(-180deg);
    opacity: 0;
  }
  100% {
    transform: rotate(0deg);
    opacity: 1;
  }
}
.anim-rotate {
  animation: rotateIn 0.7s ease-out both;
}

.animation-paused {
  animation-play-state: paused !important;
}

.animated {
  animation-fill-mode: both;
}

/* 高亮效果 */
.highlight-effect {
  outline: 3px solid #409eff;
  outline-offset: 2px;
  box-shadow: 0 0 10px rgba(64, 158, 255, 0.5);
  transition: all 0.3s ease;
}

/* 展开效果 */
.expanded {
  transform: scale(1.1);
  z-index: 1000;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}
</style>
