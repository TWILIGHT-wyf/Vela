import { ref, reactive } from 'vue'

/**
 * 日志级别
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * 日志类别
 */
export type LogCategory = 'event' | 'action' | 'binding' | 'datasource' | 'render' | 'general'

/**
 * 日志条目
 */
export interface LogEntry {
  id: number
  timestamp: number
  level: LogLevel
  category: LogCategory
  message: string
  data?: unknown
  componentId?: string
  componentName?: string
  stack?: string
}

/**
 * 日志过滤器
 */
export interface LogFilter {
  levels: Set<LogLevel>
  categories: Set<LogCategory>
  componentId?: string
  searchQuery?: string
}

/**
 * 创建日志记录器
 */
export function createLogger(maxEntries = 1000) {
  let entryId = 0
  const entries = ref<LogEntry[]>([])
  const enabled = ref(true)
  const paused = ref(false)

  const filter = reactive<LogFilter>({
    levels: new Set(['debug', 'info', 'warn', 'error']),
    categories: new Set(['event', 'action', 'binding', 'datasource', 'render', 'general']),
  })

  /**
   * 添加日志条目
   */
  function log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    options?: {
      data?: unknown
      componentId?: string
      componentName?: string
    },
  ) {
    if (!enabled.value || paused.value) return

    const entry: LogEntry = {
      id: ++entryId,
      timestamp: Date.now(),
      level,
      category,
      message,
      data: options?.data,
      componentId: options?.componentId,
      componentName: options?.componentName,
    }

    // 添加错误堆栈
    if (level === 'error') {
      entry.stack = new Error().stack
    }

    entries.value.push(entry)

    // 限制条目数量
    if (entries.value.length > maxEntries) {
      entries.value = entries.value.slice(-maxEntries)
    }

    // 输出到控制台
    const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'
    const prefix = `[Vela ${category}]`

    if (options?.data) {
      console[consoleMethod](prefix, message, options.data)
    } else {
      console[consoleMethod](prefix, message)
    }
  }

  /**
   * 便捷方法
   */
  const debug = (category: LogCategory, message: string, options?: Parameters<typeof log>[3]) =>
    log('debug', category, message, options)

  const info = (category: LogCategory, message: string, options?: Parameters<typeof log>[3]) =>
    log('info', category, message, options)

  const warn = (category: LogCategory, message: string, options?: Parameters<typeof log>[3]) =>
    log('warn', category, message, options)

  const error = (category: LogCategory, message: string, options?: Parameters<typeof log>[3]) =>
    log('error', category, message, options)

  /**
   * 事件日志
   */
  function logEvent(
    eventName: string,
    componentId: string,
    componentName: string,
    payload?: unknown,
  ) {
    info('event', `${eventName} triggered on ${componentName}`, {
      componentId,
      componentName,
      data: { eventName, payload },
    })
  }

  /**
   * 动作日志
   */
  function logAction(
    actionType: string,
    componentId: string,
    componentName: string,
    payload?: unknown,
  ) {
    info('action', `Action ${actionType} executed`, {
      componentId,
      componentName,
      data: { actionType, payload },
    })
  }

  /**
   * 数据绑定日志
   */
  function logBinding(
    sourceId: string,
    targetId: string,
    sourcePath: string,
    targetPath: string,
    value: unknown,
  ) {
    debug('binding', `Binding updated: ${sourceId}.${sourcePath} → ${targetId}.${targetPath}`, {
      data: { sourceId, targetId, sourcePath, targetPath, value },
    })
  }

  /**
   * 数据源日志
   */
  function logDataSource(
    componentId: string,
    componentName: string,
    url: string,
    status: 'loading' | 'success' | 'error',
    data?: unknown,
  ) {
    const level = status === 'error' ? 'error' : status === 'loading' ? 'debug' : 'info'
    log(level, 'datasource', `DataSource ${status}: ${url}`, {
      componentId,
      componentName,
      data,
    })
  }

  /**
   * 渲染日志
   */
  function logRender(componentId: string, componentName: string, duration: number) {
    debug('render', `${componentName} rendered in ${duration.toFixed(2)}ms`, {
      componentId,
      componentName,
      data: { duration },
    })
  }

  /**
   * 获取过滤后的日志
   */
  function getFilteredEntries(): LogEntry[] {
    return entries.value.filter((entry) => {
      // 级别过滤
      if (!filter.levels.has(entry.level)) return false

      // 类别过滤
      if (!filter.categories.has(entry.category)) return false

      // 组件过滤
      if (filter.componentId && entry.componentId !== filter.componentId) return false

      // 搜索过滤
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase()
        const matches =
          entry.message.toLowerCase().includes(query) ||
          entry.componentName?.toLowerCase().includes(query) ||
          entry.componentId?.toLowerCase().includes(query)
        if (!matches) return false
      }

      return true
    })
  }

  /**
   * 清空日志
   */
  function clear() {
    entries.value = []
    entryId = 0
  }

  /**
   * 导出日志
   */
  function exportLogs(): string {
    return JSON.stringify(entries.value, null, 2)
  }

  /**
   * 获取统计信息
   */
  function getStats() {
    const levelCounts = { debug: 0, info: 0, warn: 0, error: 0 }
    const categoryCounts: Record<string, number> = {}

    entries.value.forEach((entry) => {
      levelCounts[entry.level]++
      categoryCounts[entry.category] = (categoryCounts[entry.category] || 0) + 1
    })

    return {
      total: entries.value.length,
      byLevel: levelCounts,
      byCategory: categoryCounts,
    }
  }

  return {
    entries,
    enabled,
    paused,
    filter,
    log,
    debug,
    info,
    warn,
    error,
    logEvent,
    logAction,
    logBinding,
    logDataSource,
    logRender,
    getFilteredEntries,
    clear,
    exportLogs,
    getStats,
  }
}

/**
 * 全局日志记录器实例
 */
export const logger = createLogger()
