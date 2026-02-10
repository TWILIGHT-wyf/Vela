<template>
  <svg v-if="visible && lines.length > 0" class="distance-indicators">
    <template v-for="(line, idx) in lines" :key="idx">
      <!-- Measurement line -->
      <line
        :x1="line.x1"
        :y1="line.y1"
        :x2="line.x2"
        :y2="line.y2"
        stroke="#f43f5e"
        stroke-width="1"
        stroke-dasharray="3,2"
      />
      <!-- End caps -->
      <line
        v-if="line.dir === 'h'"
        :x1="line.x1"
        :y1="line.y1 - 4"
        :x2="line.x1"
        :y2="line.y1 + 4"
        stroke="#f43f5e"
        stroke-width="1"
      />
      <line
        v-if="line.dir === 'h'"
        :x1="line.x2"
        :y1="line.y2 - 4"
        :x2="line.x2"
        :y2="line.y2 + 4"
        stroke="#f43f5e"
        stroke-width="1"
      />
      <line
        v-if="line.dir === 'v'"
        :x1="line.x1 - 4"
        :y1="line.y1"
        :x2="line.x1 + 4"
        :y2="line.y1"
        stroke="#f43f5e"
        stroke-width="1"
      />
      <line
        v-if="line.dir === 'v'"
        :x1="line.x2 - 4"
        :y1="line.y2"
        :x2="line.x2 + 4"
        :y2="line.y2"
        stroke="#f43f5e"
        stroke-width="1"
      />
      <!-- Distance label -->
      <text
        :x="line.labelX"
        :y="line.labelY"
        fill="#f43f5e"
        font-size="10"
        font-weight="500"
        text-anchor="middle"
        dominant-baseline="middle"
      >
        {{ line.distance }}px
      </text>
    </template>
  </svg>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { useComponent } from '@/stores/component'
import { useSizeStore } from '@/stores/size'
import type { NodeSchema } from '@vela/core'

interface DistanceLine {
  x1: number
  y1: number
  x2: number
  y2: number
  dir: 'h' | 'v'
  distance: number
  labelX: number
  labelY: number
}

const componentStore = useComponent()
const sizeStore = useSizeStore()
const { selectedId, selectedNode, rootNode } = storeToRefs(componentStore)

const altPressed = ref(false)

const visible = computed(() => {
  if (!altPressed.value) return false
  if (!selectedId.value || !selectedNode.value) return false
  if (rootNode.value?.container?.mode !== 'free') return false
  return true
})

type GeometryLikeNode = Pick<NodeSchema, 'geometry' | 'style'>

function toAbsoluteNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return fallback
    const parsed = Number.parseFloat(trimmed)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

const getGeometry = (node: GeometryLikeNode) => {
  const geometry = node.geometry?.mode === 'free' ? node.geometry : undefined
  const style = node.style || {}
  return {
    x: toAbsoluteNumber(geometry?.x, 0),
    y: toAbsoluteNumber(geometry?.y, 0),
    w: toAbsoluteNumber(geometry?.width ?? style.width, 100),
    h: toAbsoluteNumber(geometry?.height ?? style.height, 100),
  }
}

const lines = computed<DistanceLine[]>(() => {
  if (!visible.value || !selectedNode.value || !selectedId.value) return []

  const sel = getGeometry(selectedNode.value)
  const canvasW = sizeStore.width
  const canvasH = sizeStore.height

  const result: DistanceLine[] = []

  // Gather sibling rects
  const siblings = (rootNode.value?.children ?? []).filter((c) => c.id !== selectedId.value)
  const siblingRects = siblings.map((s) => ({ id: s.id, ...getGeometry(s) }))

  // Find nearest to left
  let nearestLeftDist = sel.x // distance to canvas left edge
  const selCenterY = sel.y + sel.h / 2
  const selCenterX = sel.x + sel.w / 2

  for (const s of siblingRects) {
    const sRight = s.x + s.w
    if (sRight <= sel.x) {
      const dist = sel.x - sRight
      if (dist < nearestLeftDist) nearestLeftDist = dist
    }
  }
  if (nearestLeftDist > 0) {
    result.push({
      x1: sel.x - nearestLeftDist,
      y1: selCenterY,
      x2: sel.x,
      y2: selCenterY,
      dir: 'h',
      distance: Math.round(nearestLeftDist),
      labelX: sel.x - nearestLeftDist / 2,
      labelY: selCenterY - 8,
    })
  }

  // Find nearest to right
  let nearestRightDist = canvasW - (sel.x + sel.w)
  for (const s of siblingRects) {
    if (s.x >= sel.x + sel.w) {
      const dist = s.x - (sel.x + sel.w)
      if (dist < nearestRightDist) nearestRightDist = dist
    }
  }
  if (nearestRightDist > 0) {
    result.push({
      x1: sel.x + sel.w,
      y1: selCenterY,
      x2: sel.x + sel.w + nearestRightDist,
      y2: selCenterY,
      dir: 'h',
      distance: Math.round(nearestRightDist),
      labelX: sel.x + sel.w + nearestRightDist / 2,
      labelY: selCenterY - 8,
    })
  }

  // Find nearest to top
  let nearestTopDist = sel.y
  for (const s of siblingRects) {
    const sBottom = s.y + s.h
    if (sBottom <= sel.y) {
      const dist = sel.y - sBottom
      if (dist < nearestTopDist) nearestTopDist = dist
    }
  }
  if (nearestTopDist > 0) {
    result.push({
      x1: selCenterX,
      y1: sel.y - nearestTopDist,
      x2: selCenterX,
      y2: sel.y,
      dir: 'v',
      distance: Math.round(nearestTopDist),
      labelX: selCenterX + 12,
      labelY: sel.y - nearestTopDist / 2,
    })
  }

  // Find nearest to bottom
  let nearestBottomDist = canvasH - (sel.y + sel.h)
  for (const s of siblingRects) {
    if (s.y >= sel.y + sel.h) {
      const dist = s.y - (sel.y + sel.h)
      if (dist < nearestBottomDist) nearestBottomDist = dist
    }
  }
  if (nearestBottomDist > 0) {
    result.push({
      x1: selCenterX,
      y1: sel.y + sel.h,
      x2: selCenterX,
      y2: sel.y + sel.h + nearestBottomDist,
      dir: 'v',
      distance: Math.round(nearestBottomDist),
      labelX: selCenterX + 12,
      labelY: sel.y + sel.h + nearestBottomDist / 2,
    })
  }

  return result
})

const onKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Alt') {
    altPressed.value = true
  }
}

const onKeyUp = (e: KeyboardEvent) => {
  if (e.key === 'Alt') {
    altPressed.value = false
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
})
</script>

<style scoped>
.distance-indicators {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9998;
  overflow: visible;
}
</style>
