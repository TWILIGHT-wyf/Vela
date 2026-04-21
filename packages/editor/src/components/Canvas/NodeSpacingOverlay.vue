<template>
  <template v-for="side in sides" :key="side">
    <div
      v-if="show && isSideVisible(side)"
      class="box-overlay"
      :class="[`${kind}-overlay`, `${kind}-overlay-${side}`]"
      :style="getSideStyle(side)"
      @mousedown.stop.prevent="emit('start', side, $event)"
      @dragstart.stop.prevent
    >
      <span v-if="showLabel(side)" class="overlay-label">
        {{ formatLabel(side) }}
      </span>
    </div>
  </template>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'

const sides = ['top', 'right', 'bottom', 'left'] as const

export type BoxSpacingSide = (typeof sides)[number]

const props = defineProps<{
  kind: 'margin' | 'padding'
  values: Record<BoxSpacingSide, number>
  minHitSize: number
  show: boolean
  activeSide: BoxSpacingSide | null
  showLabel: (side: BoxSpacingSide) => boolean
  formatLabel: (side: BoxSpacingSide) => string
}>()

const emit = defineEmits<{
  start: [side: BoxSpacingSide, event: MouseEvent]
}>()

const effectiveValues = computed(() => ({
  top: Math.max(props.values.top, props.minHitSize),
  right: Math.max(props.values.right, props.minHitSize),
  bottom: Math.max(props.values.bottom, props.minHitSize),
  left: Math.max(props.values.left, props.minHitSize),
}))

const isSideVisible = (side: BoxSpacingSide) => {
  if (!props.activeSide) return true
  return props.activeSide === side
}

const getSideStyle = (side: BoxSpacingSide): CSSProperties => {
  const size = effectiveValues.value[side]

  if (props.kind === 'margin') {
    if (side === 'top') {
      return { height: `${size}px`, top: `${-size}px` }
    }
    if (side === 'right') {
      return { width: `${size}px`, right: `${-size}px` }
    }
    if (side === 'bottom') {
      return { height: `${size}px`, bottom: `${-size}px` }
    }
    return { width: `${size}px`, left: `${-size}px` }
  }

  if (side === 'top') {
    return {
      height: `${size}px`,
      left: `${props.values.left}px`,
      right: `${props.values.right}px`,
    }
  }
  if (side === 'right') {
    return {
      width: `${size}px`,
      top: `${props.values.top}px`,
      bottom: `${props.values.bottom}px`,
    }
  }
  if (side === 'bottom') {
    return {
      height: `${size}px`,
      left: `${props.values.left}px`,
      right: `${props.values.right}px`,
    }
  }
  return {
    width: `${size}px`,
    top: `${props.values.top}px`,
    bottom: `${props.values.bottom}px`,
  }
}
</script>

<style scoped>
.box-overlay {
  position: absolute;
  z-index: 11;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  user-select: none;
  touch-action: none;
}

.overlay-label {
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  line-height: 1;
  padding: 3px 7px;
  border-radius: 3px;
  opacity: 1;
  letter-spacing: 0.1px;
  pointer-events: none;
}

.margin-overlay {
  background: rgba(251, 146, 60, 0.42);
  border: 2px solid rgba(234, 88, 12, 0.72);
  transition:
    background 0.1s,
    box-shadow 0.1s;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.45);
}

.margin-overlay:hover {
  background: rgba(251, 146, 60, 0.56);
  box-shadow: 0 0 0 2px rgba(251, 146, 60, 0.32);
}

.margin-overlay .overlay-label {
  background: rgba(255, 237, 213, 0.97);
  color: #c2410c;
  border: 1px solid rgba(234, 88, 12, 0.25);
}

.margin-overlay-top {
  left: 0;
  right: 0;
  cursor: ns-resize;
}

.margin-overlay-bottom {
  left: 0;
  right: 0;
  cursor: ns-resize;
}

.margin-overlay-left {
  top: 0;
  bottom: 0;
  cursor: ew-resize;
}

.margin-overlay-right {
  top: 0;
  bottom: 0;
  cursor: ew-resize;
}

.padding-overlay {
  background: rgba(52, 211, 153, 0.34);
  border: 2px solid rgba(16, 185, 129, 0.7);
  transition:
    background 0.1s,
    box-shadow 0.1s;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.4);
}

.padding-overlay:hover {
  background: rgba(52, 211, 153, 0.48);
  box-shadow: 0 0 0 2px rgba(52, 211, 153, 0.28);
}

.padding-overlay .overlay-label {
  background: rgba(209, 250, 229, 0.97);
  color: #065f46;
  border: 1px solid rgba(16, 185, 129, 0.25);
}

.padding-overlay-top {
  top: 0;
  cursor: ns-resize;
}

.padding-overlay-bottom {
  bottom: 0;
  cursor: ns-resize;
}

.padding-overlay-left {
  left: 0;
  cursor: ew-resize;
}

.padding-overlay-right {
  right: 0;
  cursor: ew-resize;
}
</style>
