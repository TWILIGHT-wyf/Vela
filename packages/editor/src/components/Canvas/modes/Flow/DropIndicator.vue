<template>
  <Teleport to="body">
    <Transition name="indicator-fade">
      <div v-if="visible" class="drop-indicator" :style="indicatorStyle">
        <!-- Before/After: line indicator (horizontal or vertical depending on direction) -->
        <template v-if="position === 'before' || position === 'after'">
          <div class="indicator-line" :class="[`position-${position}`, `direction-${direction}`]">
            <div class="indicator-dot start" />
            <div class="indicator-dot end" />
          </div>
        </template>

        <!-- Inside: 蓝色虚线边框 -->
        <template v-if="position === 'inside'">
          <div class="indicator-box" />
        </template>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'
import type { DropIndicatorRect, DropPosition } from './types'

interface Props {
  /** 是否显示指示器 */
  visible: boolean
  /** 目标元素的位置信息 */
  rect: DropIndicatorRect | null
  /** 插入位置 */
  position: DropPosition
  /** 父容器排列方向 */
  direction?: 'row' | 'column'
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  rect: null,
  position: 'after',
  direction: 'column',
})

// 指示器容器样式
const indicatorStyle = computed<CSSProperties>(() => {
  if (!props.rect) return { display: 'none' }

  return {
    position: 'fixed',
    top: `${props.rect.top}px`,
    left: `${props.rect.left}px`,
    width: `${props.rect.width}px`,
    height: `${props.rect.height}px`,
    pointerEvents: 'none',
    zIndex: 10000,
  }
})
</script>

<style scoped>
.drop-indicator {
  --vela-drop-color: #0d99ff;
  --vela-drop-color-soft: #60a5fa;
  --vela-drop-surface: rgba(13, 153, 255, 0.06);
  --vela-drop-surface-strong: rgba(13, 153, 255, 0.1);
  pointer-events: none;
}

/* ========== Transition ========== */
.indicator-fade-enter-active {
  transition: opacity 0.15s ease-out;
}

.indicator-fade-leave-active {
  transition: opacity 0.1s ease-in;
}

.indicator-fade-enter-from,
.indicator-fade-leave-to {
  opacity: 0;
}

/* ========== Line Indicator (before/after) ========== */
.indicator-line {
  position: absolute;
  background: linear-gradient(
    90deg,
    var(--vela-drop-color),
    var(--vela-drop-color-soft),
    var(--vela-drop-color)
  );
  background-size: 200% 100%;
  border-radius: 1px;
  box-shadow: 0 0 6px rgba(13, 153, 255, 0.55);
  animation: line-shimmer 1.5s ease-in-out infinite;
}

/* ---- Column direction: horizontal lines (default) ---- */
.indicator-line.direction-column {
  left: 0;
  right: 0;
  height: 2px;
}

.indicator-line.direction-column.position-before {
  top: -1px;
}

.indicator-line.direction-column.position-after {
  bottom: -1px;
}

/* ---- Row direction: vertical lines ---- */
.indicator-line.direction-row {
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(
    180deg,
    var(--vela-drop-color),
    var(--vela-drop-color-soft),
    var(--vela-drop-color)
  );
}

.indicator-line.direction-row.position-before {
  left: -1px;
}

.indicator-line.direction-row.position-after {
  right: -1px;
}

@keyframes line-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* ========== Dots ========== */
.indicator-dot {
  position: absolute;
  width: 6px;
  height: 6px;
  background: var(--vela-drop-color);
  border-radius: 50%;
  box-shadow:
    0 0 0 2px #fff,
    0 0 6px rgba(13, 153, 255, 0.7);
}

/* Column direction dots: left/right ends of horizontal line */
.direction-column .indicator-dot {
  top: 50%;
  transform: translateY(-50%);
}

.direction-column .indicator-dot.start {
  left: -3px;
}

.direction-column .indicator-dot.end {
  right: -3px;
}

/* Row direction dots: top/bottom ends of vertical line */
.direction-row .indicator-dot {
  left: 50%;
  transform: translateX(-50%);
}

.direction-row .indicator-dot.start {
  top: -3px;
}

.direction-row .indicator-dot.end {
  bottom: -3px;
}

/* ========== Box Indicator (inside) ========== */
.indicator-box {
  position: absolute;
  inset: 0;
  border: 2px dashed var(--vela-drop-color);
  border-radius: 4px;
  background: var(--vela-drop-surface);
  animation: box-pulse 1.2s ease-in-out infinite;
}

@keyframes box-pulse {
  0%,
  100% {
    border-color: var(--vela-drop-color);
    background: var(--vela-drop-surface);
    box-shadow: inset 0 0 0 0 rgba(13, 153, 255, 0);
  }
  50% {
    border-color: var(--vela-drop-color-soft);
    background: var(--vela-drop-surface-strong);
    box-shadow: inset 0 0 20px 0 rgba(13, 153, 255, 0.1);
  }
}
</style>
