<template>
  <component
    :is="componentType"
    :ref="setComponentRef"
    :id="node.id"
    :data-id="node.id"
    :data-component="resolvedComponent"
    :class="computedClasses"
    :style="computedStyle as any"
    v-bind="componentProps"
    v-on="eventHandlers"
  >
    <!-- Text component special handling -->
    <template v-if="resolvedComponent === 'Text'">
      {{ resolvedTextContent }}
    </template>

    <!-- Recursive children rendering -->
    <template v-else-if="node.children && node.children.length">
      <RuntimeComponent
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :mode="mode"
        @trigger-event="$emit('trigger-event', $event)"
        @update-prop="$emit('update-prop', $event)"
      />
    </template>

    <!-- Default slot for external content -->
    <slot v-else />
  </component>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch, toRef } from 'vue'
import { getComponent, hasComponent } from '@vela/materials'
import { getNodeComponent, type NodeSchema } from '@vela/core'
import { isWrapperComponent } from '@vela/core/contracts'
import { useComponentStyle } from '../composables/useComponentStyle'
import { useComponentDataSource } from './useComponentDataSource'
import type { RuntimeMode } from '../types'

/**
 * Unified Runtime Component
 *
 * Renders a NodeSchema as a Vue component with full support for:
 * - Dynamic component resolution from @vela/materials
 * - Layout and visual styles via useComponentStyle
 * - Animations (init, visible, hover, click triggers)
 * - Event handling (in runtime mode)
 * - Data source integration
 *
 * Modes:
 * - 'runtime': Full interaction, events enabled (default)
 * - 'editor': Read-only, no event handling, for canvas preview
 * - 'preview': Full interaction but may have debug features
 */

const props = withDefaults(
  defineProps<{
    node: NodeSchema
    /**
     * Operating mode
     * - 'runtime': Full interaction (default)
     * - 'editor': Read-only, no events
     * - 'preview': Full interaction with debug
     */
    mode?: RuntimeMode
    /**
     * Whether to include layout styles (position, left, top, width, height, transform)
     * Set to false when an external wrapper handles layout (e.g., in editor mode)
     * @default true
     */
    includeLayout?: boolean
  }>(),
  {
    mode: 'runtime',
    includeLayout: true,
  },
)

const emit = defineEmits<{
  'trigger-event': [payload: { componentId: string; eventType: string; actions: unknown[] }]
  'update-prop': [payload: { componentId: string; path: string; value: unknown }]
}>()

// ========== Component Resolution ==========
const resolvedComponent = computed(() => getNodeComponent(props.node))

const componentType = computed(() => {
  const name = resolvedComponent.value

  if (isWrapperComponent(name)) {
    return 'div'
  }

  // Built-in type mapping: wrapper/structural components resolve to div
  const typeMap: Record<string, string> = {
    Text: 'div',
    Page: 'div',
  }

  // Try material registry first
  if (hasComponent(name)) {
    return getComponent(name)
  }

  // Fallback to type map or div
  const resolved = typeMap[name]
  if (!resolved && props.mode !== 'editor') {
    console.warn(`[RuntimeComponent] Component "${name}" not found, falling back to div`)
  }

  return resolved || 'div'
})

// ========== Styles (via shared composable) ==========
const nodeRef = toRef(props, 'node')
const { computedStyle: baseComputedStyle, locked } = useComponentStyle(nodeRef, {
  includeLayout: props.includeLayout,
  includeAnimation: true,
})

// ========== Data Source ==========
const { dataSourceProps } = useComponentDataSource(nodeRef)

// ========== Animation State ==========
const componentRef = ref<HTMLElement | { $el: HTMLElement } | null>(null)
const animationPlaying = ref(false)

function setComponentRef(el: unknown) {
  componentRef.value = el as HTMLElement | { $el: HTMLElement } | null
}

// ========== Computed Styles ==========
const computedStyle = computed(() => {
  const style = { ...baseComputedStyle.value }

  // Editor mode: show locked indicator
  if (props.mode === 'editor' && locked.value) {
    style.cursor = 'not-allowed'
  }

  return style
})

// ========== Computed Classes ==========
const computedClasses = computed(() => {
  const classes: string[] = ['runtime-component']

  const animation = props.node.animation
  const className =
    animation?.className || (animation as unknown as { class?: string } | undefined)?.class

  if (animation && className) {
    const trigger = animation.trigger || 'init'
    const isAutoTriggered = trigger === 'init' || trigger === 'visible'

    // Init/visible animations play automatically.
    if (isAutoTriggered) {
      classes.push('animated', className)
    }
    // Hover/click animations only play when triggered.
    else if ((trigger === 'hover' || trigger === 'click') && animationPlaying.value) {
      classes.push('animated', className)
    }
  }

  // Editor mode indicator
  if (props.mode === 'editor') {
    classes.push('runtime-component--editor')
  }

  return classes
})

const resolvedTextContent = computed(() => {
  if (props.node.component !== 'Text') return ''
  const propsRecord = (props.node.props || {}) as Record<string, unknown>
  return propsRecord.content ?? propsRecord.text ?? propsRecord.value ?? ''
})

// ========== Component Props ==========
const componentProps = computed(() => {
  const compProps: Record<string, unknown> = {}

  if (props.node.props) {
    for (const [key, value] of Object.entries(props.node.props)) {
      if (resolvedComponent.value === 'Text') {
        if (key === 'content') {
          compProps.content = value
          continue
        }
        if (key === 'text' || key === 'value') {
          // Backward compatible aliases -> canonical content
          if (compProps.content === undefined) {
            compProps.content = value
          }
          continue
        }
      }
      compProps[key] = value
    }
  }

  // Merge data source props
  return { ...compProps, ...dataSourceProps.value }
})

// ========== Event Handlers (conditional based on mode) ==========
const isInteractive = computed(() => props.mode !== 'editor')

const eventHandlers = computed(() => {
  // In editor mode, no event handlers
  if (!isInteractive.value) {
    return {}
  }

  const handlers: Record<string, (e?: Event) => void> = {}
  const events = props.node.events

  // Only bind handlers if there are configured events or animations
  const hasClickEvent = events?.click && events.click.length > 0
  const hasHoverEvent = events?.hover && events.hover.length > 0
  const hasDblClickEvent = events?.doubleClick && events.doubleClick.length > 0
  const hasClickAnimation = props.node.animation?.trigger === 'click'
  const hasHoverAnimation = props.node.animation?.trigger === 'hover'

  // Click handler
  if (hasClickEvent || hasClickAnimation) {
    handlers.click = handleClick
  }

  // Hover handlers
  if (hasHoverEvent || hasHoverAnimation) {
    handlers.mouseenter = handleMouseEnter
    handlers.mouseleave = handleMouseLeave
  }

  // Double click handler
  if (hasDblClickEvent) {
    handlers.dblclick = handleDoubleClick
  }

  // Model value update (for form components)
  handlers['update:modelValue'] = handleUpdateModelValue

  return handlers
})

// ========== Event Handler Implementations ==========
function handleClick() {
  const node = props.node

  // Animation trigger
  if (node.animation?.trigger === 'click') {
    playAnimation()
  }

  // Business events
  if (node.events?.click && node.events.click.length > 0) {
    emit('trigger-event', {
      componentId: node.id,
      eventType: 'click',
      actions: node.events.click,
    })
  }
}

function handleMouseEnter() {
  const node = props.node

  // Animation trigger
  if (node.animation?.trigger === 'hover') {
    playAnimation()
  }

  // Business events
  if (node.events?.hover && node.events.hover.length > 0) {
    emit('trigger-event', {
      componentId: node.id,
      eventType: 'hover',
      actions: node.events.hover,
    })
  }
}

function handleMouseLeave() {
  const node = props.node

  // Reset hover animation
  if (node.animation?.trigger === 'hover') {
    resetAnimation()
  }
}

function handleDoubleClick() {
  const node = props.node

  if (node.events?.doubleClick && node.events.doubleClick.length > 0) {
    emit('trigger-event', {
      componentId: node.id,
      eventType: 'doubleClick',
      actions: node.events.doubleClick,
    })
  }
}

function handleUpdateModelValue(val: unknown) {
  emit('update-prop', {
    componentId: props.node.id,
    path: 'props.modelValue',
    value: val,
  })
}

// ========== Animation Utilities ==========
function getElement(): HTMLElement | null {
  if (!componentRef.value) return null

  if ('$el' in componentRef.value) {
    return componentRef.value.$el as HTMLElement
  }
  return componentRef.value as HTMLElement
}

function playAnimation() {
  animationPlaying.value = true

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

function shouldAutoPlayAnimation(): boolean {
  const trigger = props.node.animation?.trigger || 'init'
  return trigger === 'init' || trigger === 'visible'
}

// ========== Lifecycle ==========
onMounted(() => {
  // Auto-play init/visible-triggered animations
  if (shouldAutoPlayAnimation() && isInteractive.value) {
    playAnimation()
  }
})

// Watch for animation config changes
watch(
  () => props.node.animation,
  () => {
    if (shouldAutoPlayAnimation() && isInteractive.value) {
      playAnimation()
    }
  },
)
</script>

<style scoped>
.runtime-component {
  box-sizing: border-box;
}

/* Editor mode - no pointer events on content, let overlay handle */
.runtime-component--editor {
  /* Content still renders, but interactions handled by overlay */
}

/* Animation effects */
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

/* Highlight effect (for event actions) */
.highlight-effect {
  outline: 3px solid #409eff;
  outline-offset: 2px;
  box-shadow: 0 0 10px rgba(64, 158, 255, 0.5);
  transition: all 0.3s ease;
}

/* Expanded effect */
.expanded {
  transform: scale(1.1);
  z-index: 1000;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}
</style>
