<template>
  <div class="v-countup-container" :style="containerStyle">
    <el-statistic
      :value="animatedValue"
      :precision="decimals"
      :prefix="showPrefix ? prefix : ''"
      :suffix="showSuffix ? suffix : ''"
      :value-style="valueStyleComputed"
      :title="title"
      :title-style="titleStyleComputed"
    >
      <!-- 自定义前缀插槽 -->
      <template v-if="showPrefix && prefix && customPrefix" #prefix>
        <span :style="prefixStyleComputed">{{ prefix }}</span>
      </template>
      <!-- 自定义后缀插槽 -->
      <template v-if="showSuffix && suffix && customSuffix" #suffix>
        <span :style="suffixStyleComputed">{{ suffix }}</span>
      </template>
    </el-statistic>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import type { CSSProperties } from 'vue'
import { ElStatistic } from 'element-plus'

// 定义纯 UI Props，无业务逻辑
const props = defineProps<{
  // 核心数据
  value?: number
  title?: string
  startValue?: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  showPrefix?: boolean
  showSuffix?: boolean
  useEasing?: boolean
  customPrefix?: boolean
  customSuffix?: boolean

  // 容器样式
  opacity?: number
  visible?: boolean
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
  padding?: number
  align?: 'flex-start' | 'center' | 'flex-end'

  // 数值样式
  valueColor?: string
  valueFontSize?: number
  valueFontWeight?: 'normal' | 'bold' | 'lighter' | number
  fontFamily?: string

  // 前缀样式
  prefixColor?: string
  prefixFontSize?: number
  prefixFontWeight?: 'normal' | 'bold' | 'lighter' | number

  // 后缀样式
  suffixColor?: string
  suffixFontSize?: number
  suffixFontWeight?: 'normal' | 'bold' | 'lighter' | number

  // 标题样式
  titleColor?: string
  titleFontSize?: number
  titleFontWeight?: 'normal' | 'bold' | 'lighter' | number
}>()

// 当前显示值（用于动画）
const animatedValue = ref(0)

// 缓动函数
function easeOutExpo(t: number, b: number, c: number, d: number): number {
  return c * (-Math.pow(2, (-10 * t) / d) + 1) + b
}

// 数字动画
function animateValue(start: number, end: number) {
  const startTime = Date.now()
  const dur = (props.duration ?? 2) * 1000 // Convert seconds to ms
  const useEase = props.useEasing !== false

  function update() {
    const currentTime = Date.now()
    const elapsed = currentTime - startTime

    if (elapsed < dur) {
      const progress = elapsed / dur
      if (useEase) {
        animatedValue.value = easeOutExpo(elapsed, start, end - start, dur)
      } else {
        animatedValue.value = start + (end - start) * progress
      }
      requestAnimationFrame(update)
    } else {
      animatedValue.value = end
    }
  }

  update()
}

// 监听目标值变化
watch(
  () => props.value,
  (newVal, oldVal) => {
    const start = oldVal ?? props.startValue ?? 0
    const end = newVal ?? 0
    animateValue(start, end)
  },
  { immediate: true },
)

// 容器样式
const containerStyle = computed<CSSProperties>(() => {
  return {
    opacity: ((props.opacity ?? 100) as number) / 100,
    display: props.visible === false ? 'none' : 'flex',
    backgroundColor: props.backgroundColor ?? 'transparent',
    borderColor: props.borderColor ?? 'transparent',
    borderWidth: `${props.borderWidth ?? 0}px`,
    borderStyle: 'solid',
    borderRadius: `${props.borderRadius ?? 0}px`,
    padding: `${props.padding ?? 10}px`,
    justifyContent: props.align ?? 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
  }
})

// 数值样式
const valueStyleComputed = computed<CSSProperties>(() => {
  return {
    color: props.valueColor ?? '#303133',
    fontSize: `${props.valueFontSize ?? 32}px`,
    fontWeight: props.valueFontWeight ?? 'bold',
    fontFamily: props.fontFamily ?? 'inherit',
  }
})

// 前缀样式
const prefixStyleComputed = computed<CSSProperties>(() => {
  return {
    color: props.prefixColor ?? '#909399',
    fontSize: `${props.prefixFontSize ?? 16}px`,
    fontWeight: props.prefixFontWeight ?? 'normal',
    marginRight: '8px',
  }
})

// 后缀样式
const suffixStyleComputed = computed<CSSProperties>(() => {
  return {
    color: props.suffixColor ?? '#909399',
    fontSize: `${props.suffixFontSize ?? 16}px`,
    fontWeight: props.suffixFontWeight ?? 'normal',
    marginLeft: '8px',
  }
})

// 标题样式
const titleStyleComputed = computed<CSSProperties>(() => {
  return {
    color: props.titleColor ?? '#909399',
    fontSize: `${props.titleFontSize ?? 14}px`,
    fontWeight: props.titleFontWeight ?? 'normal',
  }
})
</script>

<style scoped>
.v-countup-container {
  box-sizing: border-box;
}

:deep(.el-statistic) {
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}
</style>
