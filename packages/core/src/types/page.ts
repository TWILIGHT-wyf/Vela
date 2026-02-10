import {
  validateNodeEventActionRefs,
  type NodeActionRefValidationIssue,
  type NodeSchema,
} from './schema'
import type { ApiSchema, VariableSchema } from './data'
import {
  extractActionIds,
  validateActionLinkRef,
  type ActionLinkRef,
  type ActionRef,
  type ActionRefValidationIssue,
  type AnyActionSchema,
} from './action'
import type { ExpressionInput } from './expression'
import type { LayoutMode, PageCanvasConfig } from './layout'

// ============================================================================
// 页面 SEO 配置
// ============================================================================

/**
 * 页面 SEO/Meta 配置
 * 用于搜索引擎优化和社交分享
 */
export interface PageMetaConfig {
  /** 页面标题 (覆盖默认 title) */
  title?: string
  /** 页面描述 */
  description?: string
  /** 关键词 */
  keywords?: string[]
  /** Open Graph 图片 (社交分享) */
  ogImage?: string
  /** 是否允许搜索引擎索引 */
  robots?: 'index' | 'noindex' | 'nofollow' | 'none'
  /** 规范链接 */
  canonical?: string
  /** 自定义 meta 标签 */
  customTags?: Array<{
    name?: string
    property?: string
    content: string
  }>
}

// ============================================================================
// 路由参数配置
// ============================================================================

/**
 * 路由参数类型
 */
export type RouteParamType = 'string' | 'number' | 'boolean'

/**
 * 路由参数定义
 * 用于定义动态路由参数 (如 /user/:id)
 */
export interface RouteParamSchema {
  /** 参数名 */
  name: string
  /** 参数类型 */
  type?: RouteParamType
  /** 是否必填 */
  required?: boolean
  /** 默认值 */
  defaultValue?: string | number | boolean
  /** 验证正则 */
  pattern?: string
  /** 参数说明 */
  description?: string
}

/**
 * 查询参数定义
 * 用于定义 URL 查询参数 (如 ?page=1&size=10)
 */
export interface QueryParamSchema {
  /** 参数名 */
  name: string
  /** 参数类型 */
  type?: RouteParamType
  /** 默认值 */
  defaultValue?: string | number | boolean
  /** 参数说明 */
  description?: string
}

// ============================================================================
// 页面权限配置
// ============================================================================

/**
 * 页面权限配置
 */
export interface PageAuthConfig {
  /** 是否需要登录 */
  requireAuth?: boolean
  /** 允许访问的角色列表 (为空表示所有已登录用户) */
  roles?: string[]
  /** 允许访问的权限列表 */
  permissions?: string[]
  /** 无权限时的重定向路径 */
  redirectTo?: string
  /** 无权限时显示的消息 */
  forbiddenMessage?: string
}

// ============================================================================
// 页面生命周期 (框架无关)
// ============================================================================

/**
 * 页面生命周期钩子配置
 * 值为 Action ID 或内联代码
 *
 * 命名采用框架无关的通用术语：
 * - Vue: onMounted → onReady, onBeforeUnmount → onDestroy
 * - React: useEffect mount → onReady, useEffect cleanup → onDestroy
 */
export interface PageLifecycleConfig {
  /** 页面初始化 (数据准备前) */
  onInit?: ActionRef
  /** 页面就绪 (DOM 已渲染，数据已加载) */
  onReady?: ActionRef
  /** 页面数据更新后 */
  onUpdate?: ActionRef
  /** 页面销毁前 */
  onDestroy?: ActionRef
  /** 页面激活 (从缓存恢复) */
  onActivate?: ActionRef
  /** 页面休眠 (进入缓存) */
  onSleep?: ActionRef
  /** 页面可见性变化 */
  onVisibilityChange?: ActionRef
  /** 页面错误捕获 */
  onError?: ActionRef
}

// ============================================================================
// 页面过渡动画
// ============================================================================

/**
 * 过渡动画类型
 */
export type TransitionType =
  | 'fade'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'slide-down'
  | 'zoom'
  | 'none'

/**
 * 页面过渡动画配置
 */
export interface PageTransitionConfig {
  /** 进入动画 */
  enter?: TransitionType | string
  /** 离开动画 */
  leave?: TransitionType | string
  /** 动画时长 (ms) */
  duration?: number
  /** 动画缓动函数 */
  easing?: string
  /** 自定义 CSS 类名 */
  enterClass?: string
  leaveClass?: string
}

// ============================================================================
// 页面计算属性
// ============================================================================

/**
 * 页面计算属性定义
 */
export interface PageComputedSchema {
  /** 计算属性键名 */
  key: string
  /** 计算表达式 (可访问 state, params, query) */
  expression: ExpressionInput
  /** 说明 */
  description?: string
}

// ============================================================================
// 页面运行时配置
// ============================================================================

/**
 * 预加载策略
 */
export type PreloadStrategy = 'none' | 'hover' | 'visible' | 'immediate'

/**
 * 缓存策略
 */
export type CacheStrategy = 'none' | 'memory' | 'session' | 'persistent'

/**
 * 页面运行时配置（渲染器读取）
 */
export interface PageRuntimeConfig {
  /** 是否启用缓存 (页面保活) */
  keepAlive?: boolean
  /** 缓存键名 */
  cacheKey?: string
  /** 最大缓存实例数 */
  maxCacheInstances?: number
  /** 预加载策略 */
  preload?: PreloadStrategy
  /** 数据缓存策略 */
  dataCacheStrategy?: CacheStrategy
  /** 数据缓存时长 (秒) */
  dataCacheTTL?: number
  /** 错误边界配置 */
  errorBoundary?: {
    /** 是否启用 */
    enabled?: boolean
    /** 降级组件 ID */
    fallbackComponent?: string
    /** 重试次数 */
    retryCount?: number
  }
  /** 加载状态配置 */
  loading?: {
    /** 是否显示加载状态 */
    enabled?: boolean
    /** 加载延迟 (ms) */
    delay?: number
    /** 加载超时 (ms) */
    timeout?: number
    /** 自定义加载组件 ID */
    component?: string
  }
}

// ============================================================================
// 页面配置 (聚合)
// ============================================================================

/**
 * 页面事件动作项
 * - AnyActionSchema: 事件中直接声明动作
 * - ActionLinkRef: 引用已注册动作 (global/page/node)
 */
export type PageEventAction = AnyActionSchema | ActionLinkRef

/**
 * 判断页面事件动作项是否为动作引用
 */
export function isPageEventActionLinkRef(action: PageEventAction): action is ActionLinkRef {
  if (typeof action === 'string') {
    return true
  }
  return typeof action === 'object' && action !== null && 'type' in action && action.type === 'ref'
}

/**
 * 页面动作引用校验错误
 */
export interface PageActionRefValidationIssue extends ActionRefValidationIssue {
  pageId: string
  eventName: string
  actionIndex: number
}

/**
 * 页面动作引用校验汇总
 */
export interface PageActionValidationResult {
  pageIssues: PageActionRefValidationIssue[]
  nodeIssues: NodeActionRefValidationIssue[]
}

/**
 * 页面配置
 */
export interface PageConfig {
  /** 页面主题标识（可选覆盖项目主题） */
  themeId?: string
  /** 页面画布配置 */
  canvas?: PageCanvasConfig
  /** 运行时相关配置 */
  runtime?: PageRuntimeConfig
  /**
   * 页面默认布局模式
   * - free: Dashboard 型自由定位
   * - grid: 网格编排（fr 比例）
   */
  defaultLayoutMode?: LayoutMode
  /** 预留扩展字段 */
  custom?: Record<string, unknown>
}

// ============================================================================
// 页面基础定义 (公共部分)
// ============================================================================

/**
 * 页面基础定义 (所有页面类型共享)
 */
interface PageSchemaBase {
  /** 页面唯一标识 */
  id: string
  /** 页面名称 (用于编辑器显示) */
  name: string
  /** 页面标题 */
  title?: string
  /** 页面图标 */
  icon?: string
  /** 页面描述 */
  description?: string

  // ========== 页面配置 ==========
  /** 页面配置 (视口、运行时) */
  config?: PageConfig

  // ========== 数据层 ==========
  /** 页面状态定义 */
  state?: VariableSchema[]
  /** 页面计算属性 */
  computed?: PageComputedSchema[]
  /** 页面 API 定义 */
  apis?: ApiSchema[]

  // ========== 动作层 ==========
  /**
   * 页面动作定义
   * 生命周期和事件可通过 ActionRef 引用这里定义的动作
   */
  actions?: AnyActionSchema[]

  /**
   * 页面级事件绑定
   * key 为事件名（如 enter、leave、refresh）
   * value 为触发动作列表
   */
  events?: Record<string, PageEventAction[]>

  // ========== 生命周期 ==========
  /** 页面生命周期 */
  lifecycle?: PageLifecycleConfig

  // ========== 组件树 ==========
  /** 页面组件树 (根节点，可选用于空白占位页) */
  children?: NodeSchema
}

// ============================================================================
// 页面类型判别联合
// ============================================================================

/**
 * 路由页面 - 必须有 path
 */
export interface RoutePage extends PageSchemaBase {
  type: 'page'
  /** 路由路径 (必填，支持动态参数如 /user/:id) */
  path: string
  /** 关联的布局 ID */
  layoutId?: string
  /** SEO/Meta 配置 */
  meta?: PageMetaConfig
  /** 动态路由参数定义 */
  params?: RouteParamSchema[]
  /** 查询参数定义 */
  query?: QueryParamSchema[]
  /** 页面权限配置 */
  auth?: PageAuthConfig
  /** 页面过渡动画 */
  transition?: PageTransitionConfig
}

/**
 * 片段页面 - 不可路由，用于嵌套/复用
 */
export interface FragmentPage extends PageSchemaBase {
  type: 'fragment'
  /** 片段不支持路由 */
  path?: never
  layoutId?: never
  meta?: never
  params?: never
  query?: never
  auth?: never
  transition?: never
}

/**
 * 弹窗页面 - 不可路由，用于模态弹窗
 */
export interface DialogPage extends PageSchemaBase {
  type: 'dialog'
  /** 弹窗不支持路由 */
  path?: never
  layoutId?: never
  meta?: never
  params?: never
  query?: never
  auth?: never
  transition?: never
  /** 弹窗配置 */
  dialogConfig?: {
    /** 弹窗宽度 */
    width?: number | string
    /** 弹窗高度 */
    height?: number | string
    /** 是否显示关闭按钮 */
    closable?: boolean
    /** 是否显示遮罩 */
    mask?: boolean
    /** 点击遮罩是否关闭 */
    maskClosable?: boolean
  }
}

/**
 * 组件页面 - 可复用的业务组件
 */
export interface ComponentPage extends PageSchemaBase {
  type: 'component'
  /** 组件不支持路由 */
  path?: never
  layoutId?: never
  meta?: never
  params?: never
  query?: never
  auth?: never
  transition?: never
  /** 组件属性定义 (类似 props) */
  propsSchema?: VariableSchema[]
  /** 组件事件定义 */
  emitsSchema?: Array<{ name: string; description?: string }>
}

/**
 * 页面定义 (判别联合类型)
 *
 * 根据 type 区分不同页面形态：
 * - page: 路由页面，必须有 path
 * - fragment: 片段页面，用于嵌套/复用
 * - dialog: 弹窗页面，用于模态弹窗
 * - component: 组件页面，可复用的业务组件
 */
export type PageSchema = RoutePage | FragmentPage | DialogPage | ComponentPage

/**
 * 页面类型
 */
export type PageType = PageSchema['type']

// ============================================================================
// 布局定义
// ============================================================================

/**
 * 布局类型
 */
export type LayoutType =
  | 'blank' // 空白布局 (无任何包装)
  | 'header' // 顶部导航
  | 'sidebar' // 侧边栏导航
  | 'header-sidebar' // 顶部 + 侧边栏
  | 'header-footer' // 顶部 + 底部
  | 'custom' // 自定义布局

/**
 * 布局插槽定义
 */
export interface LayoutSlotSchema {
  /** 插槽名称 */
  name: string
  /** 插槽显示名称 */
  label?: string
  /** 插槽说明 */
  description?: string
  /** 是否必填 */
  required?: boolean
  /** 默认内容组件 ID */
  defaultContent?: string
}

/**
 * 布局配置
 */
export interface LayoutConfig {
  /** 侧边栏宽度 */
  sidebarWidth?: number
  /** 侧边栏是否可折叠 */
  sidebarCollapsible?: boolean
  /** 侧边栏默认折叠 */
  sidebarCollapsed?: boolean
  /** 顶部高度 */
  headerHeight?: number
  /** 顶部是否固定 */
  headerFixed?: boolean
  /** 底部高度 */
  footerHeight?: number
  /** 底部是否固定 */
  footerFixed?: boolean
  /** 内容区域内边距 */
  contentPadding?: number | string
}

/**
 * 布局定义 (V2.0)
 */
export interface LayoutSchema {
  /** 布局唯一标识 */
  id: string
  /** 布局名称 */
  name: string
  /** 布局描述 */
  description?: string
  /** 布局类型 */
  type?: LayoutType
  /** 布局配置 */
  config?: LayoutConfig
  /** 插槽定义 */
  slots?: LayoutSlotSchema[]
  /** 布局组件树 (根节点，包含 RouterView 插槽) */
  children: NodeSchema
}

// ============================================================================
// 工厂函数
// ============================================================================

/**
 * 创建路由页面
 */
export function createRoutePage(id: string, path: string, name: string = '新页面'): RoutePage {
  return {
    id,
    name,
    type: 'page',
    path,
    title: name,
    children: {
      id: `${id}_root`,
      component: 'Page',
      container: { mode: 'grid', columns: '1fr', rows: '1fr' },
      children: [],
    },
  }
}

/**
 * 创建片段页面
 */
export function createFragmentPage(id: string, name: string = '片段'): FragmentPage {
  return {
    id,
    name,
    type: 'fragment',
    children: {
      id: `${id}_root`,
      component: 'Fragment',
      container: { mode: 'grid', columns: '1fr', rows: '1fr' },
      children: [],
    },
  }
}

/**
 * 创建弹窗页面
 */
export function createDialogPage(id: string, name: string = '弹窗'): DialogPage {
  return {
    id,
    name,
    type: 'dialog',
    dialogConfig: {
      width: 500,
      closable: true,
      mask: true,
      maskClosable: true,
    },
    children: {
      id: `${id}_root`,
      component: 'Dialog',
      container: { mode: 'grid', columns: '1fr', rows: '1fr' },
      children: [],
    },
  }
}

/**
 * 创建组件页面
 */
export function createComponentPage(id: string, name: string = '组件'): ComponentPage {
  return {
    id,
    name,
    type: 'component',
    propsSchema: [],
    emitsSchema: [],
    children: {
      id: `${id}_root`,
      component: 'Container',
      container: { mode: 'grid', columns: '1fr', rows: '1fr' },
      children: [],
    },
  }
}

/**
 * 创建默认布局
 */
export function createDefaultLayout(id: string, name: string = '默认布局'): LayoutSchema {
  return {
    id,
    name,
    type: 'blank',
    slots: [{ name: 'default', label: '内容区域', required: true }],
    children: {
      id: `${id}_root`,
      component: 'Layout',
      container: { mode: 'grid', columns: '1fr', rows: '1fr' },
      children: [],
    },
  }
}

// ============================================================================
// 类型守卫
// ============================================================================

/**
 * 判断是否为路由页面
 */
export function isRoutePage(page: PageSchema): page is RoutePage {
  return page.type === 'page'
}

/**
 * 判断是否为片段页面
 */
export function isFragmentPage(page: PageSchema): page is FragmentPage {
  return page.type === 'fragment'
}

/**
 * 判断是否为弹窗页面
 */
export function isDialogPage(page: PageSchema): page is DialogPage {
  return page.type === 'dialog'
}

/**
 * 判断是否为组件页面
 */
export function isComponentPage(page: PageSchema): page is ComponentPage {
  return page.type === 'component'
}

/**
 * 创建页面作用域动作引用
 */
export function createPageActionRef(actionId: string, pageId: string): ActionLinkRef {
  return {
    type: 'ref',
    scope: 'page',
    id: actionId,
    pageId,
  }
}

/**
 * 校验页面事件动作引用是否合法
 */
export function validatePageEventActionRefs(
  page: PageSchema,
  globalActionIds?: Iterable<string>,
): PageActionRefValidationIssue[] {
  const issues: PageActionRefValidationIssue[] = []
  const pageActionIds = extractActionIds(page.actions)

  if (!page.events) {
    return issues
  }

  for (const [eventName, actions] of Object.entries(page.events)) {
    actions.forEach((action, actionIndex) => {
      if (!isPageEventActionLinkRef(action)) {
        return
      }
      const validationIssues = validateActionLinkRef(action, {
        globalActionIds,
        pageActionIds,
      })

      validationIssues.forEach((issue) => {
        issues.push({
          ...issue,
          pageId: page.id,
          eventName,
          actionIndex,
        })
      })
    })
  }

  return issues
}

/**
 * 校验页面范围内的动作引用（页面事件 + 节点事件）
 */
export function validatePageActionRefs(
  page: PageSchema,
  globalActionIds?: Iterable<string>,
): PageActionValidationResult {
  const pageActionIds = extractActionIds(page.actions)

  return {
    pageIssues: validatePageEventActionRefs(page, globalActionIds),
    nodeIssues: validateNodeEventActionRefs(page.children, {
      globalActionIds,
      pageActionIds,
    }),
  }
}

// ============================================================================
// 兼容旧版本
// ============================================================================

/**
 * @deprecated Use createRoutePage instead
 */
export function createDefaultPage(id: string, name: string = '新页面'): RoutePage {
  return createRoutePage(id, `/${id}`, name)
}
