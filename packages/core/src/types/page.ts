import type { NodeSchema } from './schema'
import type { ApiSchema, VariableSchema } from './data'

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
  onInit?: string
  /** 页面就绪 (DOM 已渲染，数据已加载) */
  onReady?: string
  /** 页面数据更新后 */
  onUpdate?: string
  /** 页面销毁前 */
  onDestroy?: string
  /** 页面激活 (从缓存恢复) */
  onActivate?: string
  /** 页面休眠 (进入缓存) */
  onSleep?: string
  /** 页面可见性变化 */
  onVisibilityChange?: string
  /** 页面错误捕获 */
  onError?: string
}

// ============================================================================
// 页面过渡动画
// ============================================================================

/**
 * 过渡动画类型
 */
export type TransitionType = 'fade' | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down' | 'zoom' | 'none'

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
  expression: string
  /** 说明 */
  description?: string
}

// ============================================================================
// 页面视口配置
// ============================================================================

/**
 * 视口模式
 */
export type ViewportMode = 'inherit' | 'fixed' | 'responsive'

/**
 * 缩放模式
 */
export type ScaleMode = 'none' | 'fit' | 'cover' | 'stretch' | 'width' | 'height'

/**
 * 页面视口/画布配置
 * - inherit: 继承容器尺寸（适用于嵌套页面/插槽）
 * - fixed: 固定尺寸（适用于大屏）
 * - responsive: 响应式（适用于多端）
 */
export interface PageViewportConfig {
  /** 视口模式 */
  mode?: ViewportMode
  /** 设计稿宽度 */
  designWidth?: number
  /** 设计稿高度 */
  designHeight?: number
  /** 最小宽度 */
  minWidth?: number
  /** 最大宽度 */
  maxWidth?: number
  /** 最小高度 */
  minHeight?: number
  /** 最大高度 */
  maxHeight?: number
  /** 缩放模式 */
  scaleMode?: ScaleMode
  /** 响应式断点 */
  breakpoints?: Record<string, number>
  /** 安全区域 */
  safeArea?: {
    top?: number
    right?: number
    bottom?: number
    left?: number
  }
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
 * 页面配置
 */
export interface PageConfig {
  /** 页面主题标识（可选覆盖项目主题） */
  themeId?: string
  /** 视口/画布配置 */
  viewport?: PageViewportConfig
  /** 运行时相关配置 */
  runtime?: PageRuntimeConfig
  /** 预留扩展字段 */
  custom?: Record<string, unknown>
}

// ============================================================================
// 页面定义 (主协议)
// ============================================================================

/**
 * 页面定义 (V2.0)
 *
 * 完整的页面描述协议，包含：
 * - 基础信息：id, name, path, title
 * - SEO 配置：meta 标签、社交分享
 * - 路由参数：动态路由、查询参数
 * - 权限配置：登录要求、角色限制
 * - 数据层：状态、计算属性、API
 * - 生命周期：完整的页面生命周期钩子
 * - 过渡动画：页面切换动效
 * - 组件树：页面内容
 */
export interface PageSchema {
  // ========== 基础信息 ==========
  /** 页面唯一标识 */
  id: string
  /** 页面名称 (用于编辑器显示) */
  name: string
  /** 路由路径 (支持动态参数，如 /user/:id) */
  path: string
  /** 页面标题 (浏览器标签显示) */
  title?: string
  /** 页面图标 */
  icon?: string
  /** 页面描述 */
  description?: string
  /** 关联的布局 ID */
  layoutId?: string

  // ========== SEO 配置 ==========
  /** SEO/Meta 配置 */
  meta?: PageMetaConfig

  // ========== 路由参数 ==========
  /** 动态路由参数定义 */
  params?: RouteParamSchema[]
  /** 查询参数定义 */
  query?: QueryParamSchema[]

  // ========== 权限配置 ==========
  /** 页面权限配置 */
  auth?: PageAuthConfig

  // ========== 页面配置 ==========
  /** 页面配置 (视口、编辑器、运行时) */
  config?: PageConfig

  // ========== 数据层 ==========
  /** 页面状态定义 */
  state?: VariableSchema[]
  /** 页面计算属性 */
  computed?: PageComputedSchema[]
  /** 页面 API 定义 */
  apis?: ApiSchema[]

  // ========== 生命周期 ==========
  /** 页面生命周期 */
  lifecycle?: PageLifecycleConfig

  // ========== 过渡动画 ==========
  /** 页面过渡动画 */
  transition?: PageTransitionConfig

  // ========== 组件树 ==========
  /** 页面组件树 (根节点) */
  children: NodeSchema
}

// ============================================================================
// 布局定义
// ============================================================================

/**
 * 布局类型
 */
export type LayoutType =
  | 'blank'           // 空白布局 (无任何包装)
  | 'header'          // 顶部导航
  | 'sidebar'         // 侧边栏导航
  | 'header-sidebar'  // 顶部 + 侧边栏
  | 'header-footer'   // 顶部 + 底部
  | 'custom'          // 自定义布局

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
 * 创建默认页面
 */
export function createDefaultPage(id: string, name: string = '新页面'): PageSchema {
  return {
    id,
    name,
    path: `/${id}`,
    title: name,
    children: {
      id: `${id}_root`,
      component: 'Page',
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
    slots: [
      { name: 'default', label: '内容区域', required: true },
    ],
    children: {
      id: `${id}_root`,
      component: 'Layout',
      children: [],
    },
  }
}
