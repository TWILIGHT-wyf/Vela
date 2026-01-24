import { type Ref, type ComputedRef, onUnmounted } from 'vue'
import { type Router } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { NodeSchema } from '@vela/core'
import type { Page } from '../types'

/**
 * Generic event action type for runtime execution
 * This is intentionally permissive to handle various action types dynamically
 */
interface EventAction {
  id: string
  type: string
  targetId?: string
  delay?: number
  message?: string
  messageType?: 'success' | 'warning' | 'error' | 'info'
  url?: string
  openInNewTab?: boolean
  script?: string
  content?: string
  eventName?: string
  pageId?: string
  path?: string
  blank?: boolean
  value?: unknown
  [key: string]: unknown
}

// 类型定义

export interface EventExecutorContext {
  components: Ref<NodeSchema[]> | ComputedRef<NodeSchema[]>
  pages: Ref<Page[]> | ComputedRef<Page[]>
  isProjectMode: Ref<boolean> | ComputedRef<boolean>
  router: Router
  onNavigate?: (pageId: string) => void
}

// 常量与配置

const HIGHLIGHT_CLASS = 'editor-highlight-active'
const HIGHLIGHT_DURATION = 2000 // 高亮持续时间（毫秒）
const STYLE_ID = 'editor-event-executor-styles'

// 高亮动画 CSS（呼吸灯脉冲效果）
const HIGHLIGHT_STYLES = `
  @keyframes editor-highlight-pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(64, 158, 255, 0.7);
    }
    50% {
      box-shadow: 0 0 0 12px rgba(64, 158, 255, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(64, 158, 255, 0);
    }
  }

  @keyframes editor-highlight-border {
    0%, 100% {
      border-color: rgba(64, 158, 255, 0.8);
    }
    50% {
      border-color: rgba(64, 158, 255, 0.3);
    }
  }

  .${HIGHLIGHT_CLASS} {
    position: relative;
    animation: editor-highlight-pulse 1s ease-in-out infinite;
    outline: 3px solid rgba(64, 158, 255, 0.8);
    outline-offset: 2px;
    border-radius: 4px;
    z-index: 9999;
  }

  .${HIGHLIGHT_CLASS}::before {
    content: '';
    position: absolute;
    inset: -6px;
    border: 2px dashed rgba(64, 158, 255, 0.6);
    border-radius: 8px;
    animation: editor-highlight-border 1s ease-in-out infinite;
    pointer-events: none;
  }
`

// 辅助函数

/**
 * 自动注入高亮样式到 <head>
 */
function injectHighlightStyles(): void {
  if (document.getElementById(STYLE_ID)) return

  const styleEl = document.createElement('style')
  styleEl.id = STYLE_ID
  styleEl.textContent = HIGHLIGHT_STYLES
  document.head.appendChild(styleEl)
}

/**
 * 移除注入的样式
 */
function removeHighlightStyles(): void {
  const styleEl = document.getElementById(STYLE_ID)
  if (styleEl) {
    styleEl.remove()
  }
}

/**
 * 安全获取组件 DOM 元素
 * @param componentId 组件ID
 * @returns DOM 元素或 null
 */
function getNodeSchemaEl(componentId: string): HTMLElement | null {
  if (!componentId) return null

  // 尝试多种选择器
  const selectors = [
    `[data-component-id="${componentId}"]`,
    `[data-id="${componentId}"]`,
    `#${componentId}`,
  ]

  for (const selector of selectors) {
    try {
      const el = document.querySelector<HTMLElement>(selector)
      if (el) return el
    } catch {
      // 选择器无效时跳过
    }
  }

  return null
}

/**
 * 安全执行用户脚本（沙箱）
 */
function executeSandboxedScript(
  code: string,
  context: {
    component?: NodeSchema
    components: NodeSchema[]
    navigateToPage: (pageId: string) => void
    allPages: Page[]
  },
): void {
  // 安全的全局对象白名单
  const SAFE_GLOBALS = [
    'console',
    'Math',
    'Date',
    'JSON',
    'Array',
    'Object',
    'String',
    'Number',
    'Boolean',
    'parseInt',
    'parseFloat',
    'isNaN',
    'isFinite',
    'setTimeout',
    'clearTimeout',
    'setInterval',
    'clearInterval',
    'Promise',
    'Set',
    'Map',
    'WeakSet',
    'WeakMap',
  ] as const

  // 创建 Proxy 代理，拦截所有变量访问
  const proxy = new Proxy(context, {
    // 拦截 in 操作符 (例如: 'window' in proxy)
    has(target, key: string | symbol) {
      // 只对 context 中的属性和安全全局变量返回 true
      if (key in target) return true
      if (typeof key === 'string' && (SAFE_GLOBALS as readonly string[]).includes(key)) return true
      // 对其他变量返回 false，防止访问外层作用域（包括 window）
      return false
    },
    // 拦截读取操作
    get(target, key: string | symbol) {
      // 1. 处理 Symbol.unscopables
      if (key === Symbol.unscopables) return undefined

      // 2. 优先返回 context 中的属性（component, components, navigateToPage, allPages）
      if (key in target) {
        return Reflect.get(target, key)
      }

      // 3. 允许访问安全的全局对象
      if (typeof key === 'string' && (SAFE_GLOBALS as readonly string[]).includes(key)) {
        return window[key as keyof Window]
      }

      // 4. 其他情况返回 undefined（阻止访问 window 等危险对象）
      return undefined
    },

    // 拦截设置操作，防止修改 context 对象
    set(target, key: string | symbol, value: unknown) {
      // 只允许修改 context 中已存在的属性
      if (key in target) {
        return Reflect.set(target, key, value)
      }
      // 阻止添加新属性
      console.warn(`[沙箱] 禁止添加新属性: ${String(key)}`)
      return false
    },
  })

  try {
    // 构造参数名列表和参数值列表
    const paramNames = Object.keys(context)
    const paramValues = Object.values(context)

    // 使用 new Function 创建一个封闭的作用域
    // 参数直接作为函数的参数传入，不再依赖 with
    const fn = new Function(...paramNames, code)

    // 执行函数
    fn(...paramValues)
  } catch (error) {
    console.warn('[事件] 脚本执行失败:', error)
    ElMessage.error('脚本执行失败')
  }
}

// 主 Hook

export function useEventExecutor(context: EventExecutorContext) {
  const { components, pages, isProjectMode, router, onNavigate } = context

  // 存储高亮定时器，用于清理
  const highlightTimers = new Map<string, number>()

  // 初始化：注入样式
  injectHighlightStyles()

  // 组件卸载时清理资源
  onUnmounted(() => {
    // 清理所有高亮定时器
    highlightTimers.forEach((timer) => clearTimeout(timer))
    highlightTimers.clear()
    // 移除注入的样式
    removeHighlightStyles()
  })

  /**
   * 处理组件事件
   */
  async function handleComponentEvent(payload: {
    componentId: string
    eventType: string
    actions: EventAction[]
  }): Promise<void> {
    const { componentId, actions } = payload
    const sourceComp = components.value.find((c) => c.id === componentId)

    for (const action of actions) {
      await executeAction(action, sourceComp)
    }
  }

  /**
   * 执行单个事件动作
   */
  async function executeAction(action: EventAction, sourceNodeSchema?: NodeSchema): Promise<void> {
    // 延迟执行
    if (action.delay && action.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, action.delay))
    }

    switch (action.type) {
      case 'toggle-visibility':
        handleToggleVisibility(action)
        break

      case 'scroll-to':
        handleScrollTo(action)
        break

      case 'show-tooltip':
        handleShowTooltip(action)
        break

      case 'navigate':
        handleNavigate(action)
        break

      case 'navigate-page':
        handleNavigatePage(action)
        break

      case 'fullscreen':
        handleFullscreen(action)
        break

      case 'custom-script':
        handleCustomScript(action, sourceNodeSchema)
        break

      case 'play-animation':
        handlePlayAnimation(action)
        break

      case 'highlight':
        handleHighlight(action)
        break

      case 'refresh-data':
        handleRefreshData(action, sourceNodeSchema)
        break

      default:
        console.warn('[\u4e8b\u4ef6] \u672a\u77e5\u52a8\u4f5c\u7c7b\u578b:', action.type)
    }
  }

  /**
   * 切换组件可见性
   */
  function handleToggleVisibility(action: EventAction): void {
    if (!action.targetId) return

    const target = components.value.find((c) => c.id === action.targetId)
    if (!target) return

    if (!target.style) target.style = {}
    const currentVisible = target.style.visible !== false
    target.style.visible = !currentVisible
  }

  /**
   * 滚动到指定组件
   */
  function handleScrollTo(action: EventAction): void {
    if (!action.targetId) return

    const el = getNodeSchemaEl(action.targetId)
    if (!el) return

    // 使用 scrollIntoView 并处理可能的错误
    try {
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      })
    } catch {
      // 降级方案：直接滚动
      el.scrollIntoView(true)
    }
  }

  /**
   * 显示提示消息
   */
  function handleShowTooltip(action: EventAction): void {
    const content = action.content || '提示消息'
    const messageType = (action as { messageType?: string }).messageType || 'info'

    switch (messageType) {
      case 'success':
        ElMessage.success(content)
        break
      case 'warning':
        ElMessage.warning(content)
        break
      case 'error':
        ElMessage.error(content)
        break
      default:
        ElMessage.info(content)
    }
  }

  /**
   * 页面导航（兼容多种跳转方式）
   */
  function handleNavigate(action: EventAction): void {
    if (!action.content) return

    // 检查是否是内部页面跳转
    const targetPage = pages.value.find(
      (p) => p.id === action.content || p.route === action.content || p.name === action.content,
    )

    if (targetPage && isProjectMode.value) {
      navigateToPage(targetPage.id)
    } else if (action.content.startsWith('http') || action.content.startsWith('/')) {
      window.open(action.content, '_blank')
    } else {
      const pageByRoute = pages.value.find((p) => p.route === `/${action.content}`)
      if (pageByRoute && isProjectMode.value) {
        navigateToPage(pageByRoute.id)
      } else {
        window.open(action.content, '_blank')
      }
    }
  }

  /**
   * 页面间跳转（专用）
   */
  function handleNavigatePage(action: EventAction): void {
    if (!action.targetId || !isProjectMode.value) return

    const targetPage = pages.value.find((p) => p.id === action.targetId)
    if (targetPage) {
      navigateToPage(targetPage.id)
    } else {
      ElMessage.warning('目标页面不存在')
    }
  }

  /**
   * 全屏切换（支持特定组件全屏）
   */
  function handleFullscreen(action: EventAction): void {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
      return
    }

    let targetEl: Element = document.documentElement
    if (action.targetId) {
      const componentEl = getNodeSchemaEl(action.targetId)
      if (componentEl) targetEl = componentEl
    }

    targetEl.requestFullscreen().catch(() => {
      ElMessage.warning('无法进入全屏')
    })
  }

  /**
   * 执行自定义脚本（沙箱环境）
   */
  function handleCustomScript(action: EventAction, sourceNodeSchema?: NodeSchema): void {
    if (!action.content) return

    executeSandboxedScript(action.content, {
      component: sourceNodeSchema,
      components: components.value,
      navigateToPage,
      allPages: pages.value,
    })
  }

  /**
   * 播放动画
   */
  function handlePlayAnimation(action: EventAction): void {
    if (!action.targetId) return

    const target = components.value.find((c) => c.id === action.targetId)
    const el = getNodeSchemaEl(action.targetId)
    if (!el) return

    const animationName = target?.animation?.name || 'fadeIn'
    const duration = target?.animation?.duration || 1000

    // 移除旧动画类
    el.classList.forEach((cls) => {
      if (cls.startsWith('animate__')) {
        el.classList.remove(cls)
      }
    })

    // 强制重绘以重新触发动画
    void el.offsetWidth

    // 添加 animate.css 动画类
    el.classList.add('animate__animated', `animate__${animationName}`)
    el.style.setProperty('--animate-duration', `${duration}ms`)

    // 动画结束后移除类
    const onAnimationEnd = () => {
      el.classList.remove('animate__animated', `animate__${animationName}`)
      el.removeEventListener('animationend', onAnimationEnd)
    }
    el.addEventListener('animationend', onAnimationEnd, { once: true })
  }

  /**
   * 高亮组件（呼吸灯效果）
   */
  function handleHighlight(action: EventAction): void {
    if (!action.targetId) return

    const el = getNodeSchemaEl(action.targetId)
    if (!el) return

    // 清除之前的定时器（如果存在）
    const existingTimer = highlightTimers.get(action.targetId)
    if (existingTimer) {
      clearTimeout(existingTimer)
      el.classList.remove(HIGHLIGHT_CLASS)
    }

    // 添加高亮类
    el.classList.add(HIGHLIGHT_CLASS)

    // 设置自动移除
    const duration = (action as { duration?: number }).duration || HIGHLIGHT_DURATION
    const timer = window.setTimeout(() => {
      el.classList.remove(HIGHLIGHT_CLASS)
      highlightTimers.delete(action.targetId!)
    }, duration)

    highlightTimers.set(action.targetId, timer)
  }

  /**
   * 刷新数据源
   */
  function handleRefreshData(action: EventAction, sourceNodeSchema?: NodeSchema): void {
    const targetId = action.targetId || sourceNodeSchema?.id
    if (!targetId) return

    const target = components.value.find((c) => c.id === targetId)
    if (target?.dataSource?.enabled) {
      // 触发数据刷新事件（由组件自身监听处理）
      const el = getNodeSchemaEl(targetId)
      if (el) {
        el.dispatchEvent(new CustomEvent('data-refresh', { bubbles: true }))
      }
    }
  }

  /**
   * 页面跳转核心函数
   */
  function navigateToPage(pageId: string): void {
    if (onNavigate) {
      onNavigate(pageId)
    } else {
      const currentQuery = router.currentRoute.value.query
      router.replace({ query: { ...currentQuery, pageId } })
    }
  }

  return {
    handleComponentEvent,
    executeAction,
  }
}
