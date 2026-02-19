import { ref, reactive, computed } from 'vue'

/**
 * 性能指标
 */
export interface PerformanceMetrics {
  renderCount: number
  totalRenderTime: number
  averageRenderTime: number
  lastRenderTime: number
  fps: number
  memoryUsage?: number
}

/**
 * 组件性能数据
 */
export interface ComponentPerformance {
  id: string
  componentName: string
  renderCount: number
  totalRenderTime: number
  averageRenderTime: number
  lastRenderTime: number
  slowRenders: number // 渲染时间 > 16ms
}

/**
 * 性能条目
 */
interface PerformanceEntry {
  timestamp: number
  componentId: string
  componentName: string
  duration: number
}

/**
 * 创建性能监控器
 */
export function createPerformanceMonitor() {
  const enabled = ref(false)
  const entries = ref<PerformanceEntry[]>([])
  const componentStats = reactive(new Map<string, ComponentPerformance>())

  // FPS 计算
  let frameCount = 0
  let lastFpsUpdate = performance.now()
  const currentFps = ref(60)
  let animationFrameId: number | null = null

  /**
   * 启用监控
   */
  function enable() {
    enabled.value = true
    startFpsMonitor()
    console.log('[DevTools] Performance monitor enabled')
  }

  /**
   * 禁用监控
   */
  function disable() {
    enabled.value = false
    stopFpsMonitor()
    console.log('[DevTools] Performance monitor disabled')
  }

  /**
   * 开始 FPS 监控
   */
  function startFpsMonitor() {
    const updateFps = () => {
      frameCount++
      const now = performance.now()
      const delta = now - lastFpsUpdate

      if (delta >= 1000) {
        currentFps.value = Math.round((frameCount * 1000) / delta)
        frameCount = 0
        lastFpsUpdate = now
      }

      if (enabled.value) {
        animationFrameId = requestAnimationFrame(updateFps)
      }
    }

    animationFrameId = requestAnimationFrame(updateFps)
  }

  /**
   * 停止 FPS 监控
   */
  function stopFpsMonitor() {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
  }

  /**
   * 记录渲染时间
   */
  function recordRender(componentId: string, componentName: string, duration: number) {
    if (!enabled.value) return

    // 添加条目
    entries.value.push({
      timestamp: Date.now(),
      componentId,
      componentName,
      duration,
    })

    // 限制条目数量
    if (entries.value.length > 10000) {
      entries.value = entries.value.slice(-5000)
    }

    // 更新组件统计
    let stats = componentStats.get(componentId)
    if (!stats) {
      stats = {
        id: componentId,
        componentName,
        renderCount: 0,
        totalRenderTime: 0,
        averageRenderTime: 0,
        lastRenderTime: 0,
        slowRenders: 0,
      }
      componentStats.set(componentId, stats)
    }

    stats.renderCount++
    stats.totalRenderTime += duration
    stats.averageRenderTime = stats.totalRenderTime / stats.renderCount
    stats.lastRenderTime = duration

    if (duration > 16) {
      stats.slowRenders++
    }
  }

  /**
   * 创建渲染计时器
   */
  function startRenderTimer(componentId: string, componentName: string): () => void {
    const start = performance.now()
    return () => {
      const duration = performance.now() - start
      recordRender(componentId, componentName, duration)
    }
  }

  /**
   * 获取全局指标
   */
  const metrics = computed<PerformanceMetrics>(() => {
    let totalRenderTime = 0
    let renderCount = 0

    componentStats.forEach((stats) => {
      totalRenderTime += stats.totalRenderTime
      renderCount += stats.renderCount
    })

    const lastEntry = entries.value[entries.value.length - 1]

    return {
      renderCount,
      totalRenderTime,
      averageRenderTime: renderCount > 0 ? totalRenderTime / renderCount : 0,
      lastRenderTime: lastEntry?.duration || 0,
      fps: currentFps.value,
      memoryUsage: getMemoryUsage(),
    }
  })

  /**
   * 获取内存使用
   */
function getMemoryUsage(): number | undefined {
    const perfWithMemory = performance as Performance & {
      memory?: { usedJSHeapSize?: number }
    }
    const usedHeapSize = perfWithMemory.memory?.usedJSHeapSize
    if (typeof usedHeapSize === 'number') {
      return usedHeapSize / 1024 / 1024 // MB
    }
    return undefined
  }

  /**
   * 获取慢组件列表
   */
  function getSlowComponents(threshold = 16): ComponentPerformance[] {
    return Array.from(componentStats.values())
      .filter((stats) => stats.averageRenderTime > threshold || stats.slowRenders > 0)
      .sort((a, b) => b.averageRenderTime - a.averageRenderTime)
  }

  /**
   * 获取热门组件（渲染次数最多）
   */
  function getHotComponents(limit = 10): ComponentPerformance[] {
    return Array.from(componentStats.values())
      .sort((a, b) => b.renderCount - a.renderCount)
      .slice(0, limit)
  }

  /**
   * 获取组件统计
   */
  function getComponentStats(componentId: string): ComponentPerformance | undefined {
    return componentStats.get(componentId)
  }

  /**
   * 获取时间线数据（最近 N 秒）
   */
  function getTimeline(seconds = 60): { timestamp: number; avgDuration: number }[] {
    const now = Date.now()
    const cutoff = now - seconds * 1000
    const bucketSize = 1000 // 1 second buckets

    const buckets = new Map<number, { total: number; count: number }>()

    entries.value
      .filter((e) => e.timestamp >= cutoff)
      .forEach((entry) => {
        const bucket = Math.floor(entry.timestamp / bucketSize) * bucketSize
        const existing = buckets.get(bucket) || { total: 0, count: 0 }
        existing.total += entry.duration
        existing.count++
        buckets.set(bucket, existing)
      })

    return Array.from(buckets.entries())
      .map(([timestamp, { total, count }]) => ({
        timestamp,
        avgDuration: count > 0 ? total / count : 0,
      }))
      .sort((a, b) => a.timestamp - b.timestamp)
  }

  /**
   * 清空数据
   */
  function clear() {
    entries.value = []
    componentStats.clear()
  }

  /**
   * 导出数据
   */
  function exportData(): string {
    return JSON.stringify(
      {
        metrics: metrics.value,
        components: Array.from(componentStats.values()),
        timeline: getTimeline(),
      },
      null,
      2,
    )
  }

  return {
    enabled,
    enable,
    disable,
    recordRender,
    startRenderTimer,
    metrics,
    getSlowComponents,
    getHotComponents,
    getComponentStats,
    getTimeline,
    clear,
    exportData,
  }
}

/**
 * 全局性能监控器实例
 */
export const performanceMonitor = createPerformanceMonitor()
