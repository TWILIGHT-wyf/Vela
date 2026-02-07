import type { PageSchema, LayoutSchema } from './page'
import type { VariableSchema, ApiSchema } from './data'
import type { ActionRef, AnyActionSchema } from './action'
import type { MaterialMeta, ComponentImportSpec } from './material'

// ============================================================================
// 项目元数据
// ============================================================================

/**
 * 项目元数据
 * 用于项目管理、版本追踪、协作信息
 * 注：项目 ID 已移至 ProjectSchema.id (必填)
 */
export interface ProjectMeta {
  /** 创建时间 (ISO 8601) */
  createdAt?: string
  /** 最后更新时间 (ISO 8601) */
  updatedAt?: string
  /** 创建者 */
  author?: string
  /** 项目图标 */
  icon?: string
  /** 项目标签 */
  tags?: string[]
}

// ============================================================================
// 配置层 - 项目级配置
// ============================================================================

/**
 * 路由模式
 */
export type RouterMode = 'hash' | 'history' | 'memory'

/**
 * 页面引用类型
 * 用于在配置中引用页面，支持 ID 或路径两种方式
 */
export type PageRef =
  | { type: 'id'; pageId: string }
  | { type: 'path'; path: string }
  | string  // 简写形式：直接使用 pageId

/**
 * 标准化后的页面引用
 */
export type NormalizedPageRef = Exclude<PageRef, string>

/**
 * 路由页面引用字段
 */
export type RouterPageRefKey = 'homePageId' | 'notFoundPageId' | 'loginPageId'

/**
 * 标准化页面引用
 * 将字符串简写转换为显式 id 引用
 */
export function normalizePageRef(pageRef: PageRef): NormalizedPageRef {
  if (typeof pageRef === 'string') {
    return { type: 'id', pageId: pageRef }
  }
  return pageRef
}

function normalizeLegacyPagePath(path?: string): NormalizedPageRef | undefined {
  if (!path) {
    return undefined
  }
  return { type: 'path', path }
}

/**
 * 路由配置
 */
export interface RouterConfig {
  /** 路由模式 */
  mode?: RouterMode
  /** 基础路径 */
  basePath?: string
  /** 首页 (推荐使用 pageId) */
  homePageId?: PageRef
  /** 404 页面 */
  notFoundPageId?: PageRef
  /** 登录页面 */
  loginPageId?: PageRef
  /** 路由重定向规则 */
  redirects?: Array<{
    from: string
    to: string | PageRef
  }>

  // === 兼容旧字段 ===
  /** @deprecated Use homePageId instead */
  homePage?: string
  /** @deprecated Use notFoundPageId instead */
  notFoundPage?: string
  /** @deprecated Use loginPageId instead */
  loginPage?: string
}

/**
 * 获取路由配置中的页面引用（含旧字段兼容）
 */
export function getRouterPageRef(
  router: RouterConfig | undefined,
  key: RouterPageRefKey
): NormalizedPageRef | undefined {
  if (!router) {
    return undefined
  }

  const explicitRef = router[key]
  if (explicitRef) {
    return normalizePageRef(explicitRef)
  }

  if (key === 'homePageId') {
    return normalizeLegacyPagePath(router.homePage)
  }
  if (key === 'notFoundPageId') {
    return normalizeLegacyPagePath(router.notFoundPage)
  }
  return normalizeLegacyPagePath(router.loginPage)
}

/**
 * 解析页面引用到页面对象
 */
export function resolvePageRef(
  pages: PageSchema[],
  pageRef?: PageRef
): PageSchema | undefined {
  if (!pageRef) {
    return undefined
  }

  const normalized = normalizePageRef(pageRef)
  if (normalized.type === 'id') {
    return pages.find(page => page.id === normalized.pageId)
  }

  return pages.find(page => page.type === 'page' && page.path === normalized.path)
}

/**
 * 解析路由配置中的页面引用到页面对象
 */
export function resolveRouterPage(
  pages: PageSchema[],
  router: RouterConfig | undefined,
  key: RouterPageRefKey
): PageSchema | undefined {
  const pageRef = getRouterPageRef(router, key)
  return resolvePageRef(pages, pageRef)
}

/**
 * 构建配置
 */
export interface BuildConfig {
  /** 输出目录 */
  outDir?: string
  /** 静态资源路径前缀 */
  publicPath?: string
  /** 是否生成 sourcemap */
  sourcemap?: boolean
  /** 目标浏览器兼容性 */
  target?: 'es2015' | 'es2018' | 'es2020' | 'esnext'
}

/**
 * 项目配置
 */
export interface ProjectConfig {
  /** 目标平台 */
  target: 'mobile' | 'pc' | 'responsive'
  /** 主题标识 */
  themeId?: string
  /** 路由配置 */
  router?: RouterConfig
  /** 构建配置 */
  build?: BuildConfig

  // === 兼容旧字段 ===
  /** @deprecated Use target instead */
  layout?: 'mobile' | 'pc'
  /** @deprecated Use themeId instead */
  theme?: string
}

// ============================================================================
// 数据层 - 全局状态与数据管理
// ============================================================================

/**
 * 常量定义
 * 编译时确定、运行时不可变的值
 */
export interface ConstantSchema {
  /** 常量键名 */
  key: string
  /** 常量值 (支持基础类型和对象/数组) */
  value: string | number | boolean | Record<string, unknown> | unknown[]
  /** 常量说明 */
  description?: string
  /** 常量分组 (如 'colors', 'sizes', 'enums') */
  group?: string
}

/**
 * Store 模块定义
 * 用于复杂状态管理，类似 Pinia/Vuex 的 module
 */
export interface StoreModuleSchema {
  /** 模块 ID */
  id: string
  /** 模块名称 */
  name: string
  /** 模块说明 */
  description?: string
  /** 状态字段 */
  state: VariableSchema[]
  /** Getter 定义 (计算属性) */
  getters?: Array<{
    key: string
    /** 计算表达式，可访问 state */
    expression: string
    description?: string
  }>
  /** Action 定义 (方法) */
  actions?: Array<{
    key: string
    /** 函数体代码 */
    body: string
    /** 参数定义 */
    params?: Array<{ name: string; type?: string }>
    description?: string
  }>
}

/**
 * 持久化存储类型
 */
export type PersistentStorageType = 'localStorage' | 'sessionStorage' | 'cookie'

/**
 * 持久化配置
 * 定义哪些状态需要持久化存储
 */
export interface PersistentConfig {
  /** 配置 ID */
  id: string
  /** 存储键名 */
  storageKey: string
  /** 存储类型 */
  storageType: PersistentStorageType
  /** 要持久化的状态路径列表 (如 ['user.token', 'settings.theme']) */
  paths: string[]
  /** 过期时间 (秒)，仅 cookie 生效 */
  expires?: number
  /** 加密存储 */
  encrypt?: boolean
}

/**
 * 数据层配置
 */
export interface ProjectDataConfig {
  /** 常量定义 */
  constants?: ConstantSchema[]
  /** 全局响应式状态 (简单状态) */
  globalState?: VariableSchema[]
  /** Store 模块 (复杂状态) */
  stores?: StoreModuleSchema[]
  /** 持久化配置 */
  persistent?: PersistentConfig[]
}

// ============================================================================
// 接口层 - API 管理
// ============================================================================

/**
 * API 基础配置
 * 全局请求配置，所有 API 继承
 */
export interface ApiBaseConfig {
  /** 基础 URL (支持环境变量插值，如 ${env.API_BASE}) */
  baseURL?: string
  /** 默认超时时间 (ms) */
  timeout?: number
  /** 默认请求头 */
  headers?: Record<string, string>
  /** 请求拦截器代码 */
  requestInterceptor?: string
  /** 响应拦截器代码 */
  responseInterceptor?: string
  /** 错误处理器代码 */
  errorHandler?: string
  /** 是否携带凭证 (cookies) */
  withCredentials?: boolean
}

/**
 * 接口层配置
 */
export interface ProjectApiConfig {
  /** API 基础配置 */
  baseConfig?: ApiBaseConfig
  /** API 定义列表 */
  definitions?: ApiSchema[]
}

// ============================================================================
// 逻辑层 - 工具函数、生命周期、守卫
// ============================================================================

/**
 * 工具函数定义
 */
export interface UtilFunctionSchema {
  /** 函数 ID */
  id: string
  /** 函数名 */
  name: string
  /** 函数说明 */
  description?: string
  /** 参数定义 */
  params?: Array<{
    name: string
    type?: string
    required?: boolean
    defaultValue?: unknown
  }>
  /** 返回值类型 */
  returnType?: string
  /** 函数体代码 */
  body: string
  /** 是否异步 */
  async?: boolean
  /** 分组 (如 'format', 'validate', 'transform') */
  group?: string
}

/**
 * 应用生命周期钩子 (框架无关)
 * 值为 ActionRef (动作 ID 或内联代码)
 */
export interface AppLifecycleConfig {
  /** 应用初始化 (数据、配置加载前) */
  onInit?: ActionRef
  /** 应用就绪 (所有初始化完成) */
  onReady?: ActionRef
  /** 应用销毁前 */
  onDestroy?: ActionRef
  /** 应用错误处理 */
  onError?: ActionRef
  /** 网络状态变化 */
  onNetworkChange?: ActionRef
  /** 应用进入前台 */
  onForeground?: ActionRef
  /** 应用进入后台 */
  onBackground?: ActionRef
}

/**
 * 路由守卫时机 (框架无关)
 */
export type RouteGuardTiming = 'before' | 'after'

/**
 * 路由守卫定义
 */
export interface RouteGuardSchema {
  /** 守卫 ID */
  id: string
  /** 守卫名称 */
  name: string
  /** 守卫时机 (before: 导航前, after: 导航后) */
  timing: RouteGuardTiming
  /** 守卫逻辑代码 (可访问 to, from 路由信息，返回 false 或路径可阻止/重定向) */
  handler: string
  /** 优先级 (数字越小越先执行) */
  priority?: number
  /** 是否启用 */
  enabled?: boolean
  /** 说明 */
  description?: string
}

/**
 * 逻辑层配置
 */
export interface ProjectLogicConfig {
  /** 全局工具函数 */
  utils?: UtilFunctionSchema[]
  /** 应用生命周期 */
  lifecycle?: AppLifecycleConfig
  /** 路由守卫 */
  guards?: RouteGuardSchema[]
  /** 全局动作注册表 (可通过 ActionRef ID 引用) */
  actions?: GlobalActionSchema[]
}

// ============================================================================
// 环境变量
// ============================================================================

/**
 * 环境类型
 */
export type EnvType = 'development' | 'staging' | 'production'

/**
 * 环境变量配置
 * 支持多环境差异化配置
 */
export type ProjectEnvConfig = Partial<Record<EnvType, Record<string, string>>>

// ============================================================================
// 资源层
// ============================================================================

/**
 * 静态资源引用
 */
export interface AssetSchema {
  /** 资源 ID */
  id: string
  /** 资源名称 */
  name: string
  /** 资源类型 */
  type: 'image' | 'font' | 'icon' | 'video' | 'audio' | 'file'
  /** 资源 URL */
  url: string
  /** 文件大小 (bytes) */
  size?: number
  /** 资源分组 */
  group?: string
}

/**
 * 资源层配置
 */
export interface ProjectAssetsConfig {
  /** 资源列表 */
  items?: AssetSchema[]
  /** CDN 前缀 */
  cdnPrefix?: string
}

// ============================================================================
// 依赖与插件
// ============================================================================

/**
 * 外部依赖定义
 */
export interface DependencySchema {
  /** 包名 */
  name: string
  /** 版本 */
  version: string
  /** CDN 地址 (用于运行时加载) */
  cdnUrl?: string
  /** 全局变量名 (UMD) */
  globalName?: string
  /** 依赖说明 */
  description?: string
}

/**
 * 插件配置
 */
export interface PluginSchema {
  /** 插件 ID */
  id: string
  /** 插件版本 */
  version: string
  /** 是否启用 */
  enabled?: boolean
  /** 插件配置 */
  options?: Record<string, unknown>
}

// ============================================================================
// 组件库配置
// ============================================================================

/**
 * 组件库来源类型
 */
export type ComponentLibrarySource = 'npm' | 'local' | 'cdn' | 'builtin'

/**
 * 组件库配置
 * 记录项目使用的组件库及其元信息
 */
export interface ComponentLibrarySchema {
  /** 库唯一标识 (如 '@vela/materials', 'antd', 'element-plus') */
  id: string
  /** 库名称 */
  name: string
  /** 版本号 */
  version: string
  /** 来源类型 */
  source: ComponentLibrarySource
  /** 包名 (npm 包名或 CDN 路径) */
  package?: string
  /** CDN 地址 */
  cdnUrl?: string
  /** 组件元信息列表 (按需加载时可能为空) */
  components?: MaterialMeta[]
  /** 组件导入规范 (默认导入方式) */
  defaultImport?: ComponentImportSpec
  /** 样式入口 */
  styleEntry?: string
  /** 依赖的其他库 */
  peerDependencies?: string[]
  /** 是否启用 */
  enabled?: boolean
  /** 库说明 */
  description?: string
}

// ============================================================================
// 全局动作注册表
// ============================================================================

/**
 * 全局动作定义
 * 可在项目任意位置通过 ActionRef 引用
 */
export type GlobalActionSchema = AnyActionSchema & {
  /** 动作名称 */
  name?: string
  /** 动作说明 */
  description?: string
  /** 动作分组 */
  group?: string
}

// ============================================================================
// 主协议 - ProjectSchema
// ============================================================================

/**
 * 项目配置协议 (V2.0)
 *
 * 完整的低代码项目描述协议，包含：
 * - 元数据层：项目基础信息、版本追踪
 * - 配置层：平台、路由、构建配置
 * - 数据层：常量、状态、Store、持久化
 * - 接口层：API 基础配置与定义
 * - 逻辑层：工具函数、生命周期、路由守卫
 * - 资源层：静态资源管理
 * - 页面层：页面与布局定义
 */
export interface ProjectSchema {
  // ========== 基础信息 ==========
  /** 项目唯一标识 (必填，用于持久化和协作) */
  id: string
  /** 协议版本 */
  version: string
  /** 项目名称 */
  name: string
  /** 项目描述 */
  description?: string
  /** 项目元数据 (附加信息) */
  meta?: ProjectMeta

  // ========== 配置层 ==========
  /** 项目配置 */
  config: ProjectConfig
  /** 环境变量 */
  env?: ProjectEnvConfig

  // ========== 数据层 ==========
  /** 数据配置 (常量、状态、Store、持久化) */
  data?: ProjectDataConfig

  // ========== 接口层 ==========
  /** API 配置 */
  apis?: ProjectApiConfig

  // ========== 逻辑层 ==========
  /** 逻辑配置 (工具函数、生命周期、守卫) */
  logic?: ProjectLogicConfig

  // ========== 资源层 ==========
  /** 静态资源 */
  assets?: ProjectAssetsConfig

  // ========== 组件库 ==========
  /** 组件库配置 (物料来源) */
  componentLibraries?: ComponentLibrarySchema[]

  // ========== 依赖与插件 ==========
  /** 外部依赖 */
  dependencies?: DependencySchema[]
  /** 插件配置 */
  plugins?: PluginSchema[]

  // ========== 页面层 ==========
  /** 页面定义 */
  pages: PageSchema[]
  /** 布局定义 (可选，无布局时使用空白布局) */
  layouts?: LayoutSchema[]

  // ========== 兼容旧版本 ==========
  /** @deprecated Use data.globalState instead */
  globalState?: VariableSchema[]
  /** @deprecated Use apis.definitions instead */
  globalApis?: ApiSchema[]
}

// ============================================================================
// 工厂函数 - 创建默认项目
// ============================================================================

/**
 * 创建默认项目配置
 */
/**
 * 生成项目 ID
 */
export function generateProjectId(): string {
  return `proj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

/**
 * 创建默认项目配置
 */
export function createDefaultProject(name: string = 'Untitled', id?: string): ProjectSchema {
  const now = new Date().toISOString()
  return {
    id: id || generateProjectId(),
    version: '2.0.0',
    name,
    meta: {
      createdAt: now,
      updatedAt: now,
    },
    config: {
      target: 'pc',
      router: {
        mode: 'hash',
        homePageId: { type: 'path', path: '/' },
      },
    },
    pages: [],
  }
}
