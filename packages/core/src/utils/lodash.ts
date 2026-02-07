/**
 * 可取消的防抖函数返回类型
 */
export interface DebouncedFunction<T extends (...args: unknown[]) => unknown> {
  (...args: Parameters<T>): void
  cancel(): void
  flush(): void
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  immediate = false,
): DebouncedFunction<T> {
  let timeout: ReturnType<typeof setTimeout> | null = null
  let lastArgs: Parameters<T> | null = null
  let lastContext: unknown = null

  const later = function () {
    timeout = null
    if (!immediate && lastArgs) {
      func.apply(lastContext, lastArgs)
      lastArgs = null
      lastContext = null
    }
  }

  const debounced = function (this: unknown, ...args: Parameters<T>) {
    lastArgs = args
    lastContext = this

    const callNow = immediate && !timeout
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)

    if (callNow) {
      func.apply(this, args)
      lastArgs = null
      lastContext = null
    }
  } as DebouncedFunction<T>

  debounced.cancel = function () {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
    lastArgs = null
    lastContext = null
  }

  debounced.flush = function () {
    if (timeout && lastArgs) {
      clearTimeout(timeout)
      timeout = null
      func.apply(lastContext, lastArgs)
      lastArgs = null
      lastContext = null
    }
  }

  return debounced
}

/**
 * 可取消的节流函数返回类型
 */
export interface ThrottledFunction<T extends (...args: unknown[]) => unknown> {
  (...args: Parameters<T>): void
  cancel(): void
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number,
): ThrottledFunction<T> {
  let inThrottle = false
  let lastFunc: ReturnType<typeof setTimeout> | null = null
  let lastRan = 0

  const throttled = function (this: unknown, ...args: Parameters<T>) {
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      lastRan = Date.now()
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    } else {
      if (lastFunc) clearTimeout(lastFunc)
      lastFunc = setTimeout(
        function () {
          if (Date.now() - lastRan >= limit) {
            func.apply(context, args)
            lastRan = Date.now()
          }
        },
        limit - (Date.now() - lastRan),
      )
    }
  } as ThrottledFunction<T>

  throttled.cancel = function () {
    if (lastFunc) {
      clearTimeout(lastFunc)
      lastFunc = null
    }
    inThrottle = false
  }

  return throttled
}
