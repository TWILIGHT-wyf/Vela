import { PageSchema, LayoutSchema } from './page'
import { VariableSchema, ApiSchema } from './data'

// ============================================================================
// 项目元数据
// ============================================================================

/**
 * 项目元数据
 * 用于项目管理、版本追踪、协作信息
 */
export interface ProjectMeta {
  /** 项目唯一标识 */
  id?: string
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
 * 路由配置
 */
export interface RouterConfig {
  /** 路由模式 */
  mode?: RouterMode
  /** 基础路径 */
  basePath?: string
  /** 首页路由 (对应 PageSchema.path) */
  homePage?: string
  /** 404 页面路由 */
  notFoundPage?: string
  /** 登录页路由 */
  loginPage?: string
  /** 路由重定向规则 */
  redirects?: Array<{
    from: string
    to: string
  }>
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
 */
export interface AppLifecycleConfig {
  /** 应用初始化 (数据、配置加载前) */
  onInit?: string
  /** 应用就绪 (所有初始化完成) */
  onReady?: string
  /** 应用销毁前 */
  onDestroy?: string
  /** 应用错误处理 */
  onError?: string
  /** 网络状态变化 */
  onNetworkChange?: string
  /** 应用进入前台 */
  onForeground?: string
  /** 应用进入后台 */
  onBackground?: string
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
  /** 协议版本 */
  version: string
  /** 项目名称 */
  name: string
  /** 项目描述 */
  description?: string
  /** 项目元数据 */
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

  // ========== 依赖与插件 ==========
  /** 外部依赖 */
  dependencies?: DependencySchema[]
  /** 插件配置 */
  plugins?: PluginSchema[]

  // ========== 页面层 ==========
  /** 页面定义 */
  pages: PageSchema[]
  /** 布局定义 */
  layouts: LayoutSchema[]

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
export function createDefaultProject(name: string = 'Untitled'): ProjectSchema {
  const now = new Date().toISOString()
  return {
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
        homePage: '/',
      },
    },
    pages: [],
    layouts: [],
  }
}
