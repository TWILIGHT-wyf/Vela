import type { PageSchema, LayoutSchema } from './page'
import type { VariableSchema, ApiSchema } from './data'
import type { ActionRef, AnyActionSchema } from './action'
import { getActionPayload } from './action'
import { ensurePageRoot, getPageRoot } from './page'
import { getNodeComponent, getNodeRenderIf, getNodeRepeat, getNodeSlot } from './schema'
import { generateProjectId as generateStableProjectId } from '../utils/id'

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
export type PageRef = { type: 'id'; pageId: string } | { type: 'path'; path: string } | string // 简写形式：直接使用 pageId

/**
 * 标准化后的页面引用
 */
export type NormalizedPageRef = Exclude<PageRef, string>

/**
 * 路由页面引用字段
 */
export type RouterPageRefKey = 'homePage' | 'notFoundPage' | 'loginPage'

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

/**
 * 路由配置
 */
export interface RouterConfig {
  /** 路由模式 */
  mode?: RouterMode
  /** 基础路径 */
  basePath?: string
  /** 首页页面 */
  homePage?: PageRef
  /** 404 页面 */
  notFoundPage?: PageRef
  /** 登录页面 */
  loginPage?: PageRef
  /** 路由重定向规则 */
  redirects?: Array<{
    from: string
    to: string | PageRef
  }>
}

/**
 * 获取路由配置中的页面引用
 */
export function getRouterPageRef(
  router: RouterConfig | undefined,
  key: RouterPageRefKey,
): NormalizedPageRef | undefined {
  if (!router) {
    return undefined
  }

  const pageRef = router[key]
  if (!pageRef) {
    return undefined
  }

  return normalizePageRef(pageRef)
}

/**
 * 解析页面引用到页面对象
 */
export function resolvePageRef(pages: PageSchema[], pageRef?: PageRef): PageSchema | undefined {
  if (!pageRef) {
    return undefined
  }

  const normalized = normalizePageRef(pageRef)
  if (normalized.type === 'id') {
    return pages.find((page) => page.id === normalized.pageId)
  }

  return pages.find((page) => page.type === 'page' && page.path === normalized.path)
}

/**
 * 解析路由配置中的页面引用到页面对象
 */
export function resolveRouterPage(
  pages: PageSchema[],
  router: RouterConfig | undefined,
  key: RouterPageRefKey,
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
 * 数据层配置
 */
export interface ProjectDataConfig {
  /** 常量定义 */
  constants?: ConstantSchema[]
  /** 全局响应式状态 (简单状态) */
  globalState?: VariableSchema[]
}

// ============================================================================
// 接口层 - API 管理
// ============================================================================

/**
 * 接口层配置
 */
export interface ProjectApiConfig {
  /** API 定义列表 */
  definitions?: ApiSchema[]
}

// ============================================================================
// 逻辑层 - 工具函数、生命周期、守卫
// ============================================================================

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
 * 逻辑层配置
 */
export interface ProjectLogicConfig {
  /** 应用生命周期 */
  lifecycle?: AppLifecycleConfig
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
function normalizeActionPayload<T extends Record<string, unknown>>(action: T): T {
  const payload = getActionPayload(action as unknown as Parameters<typeof getActionPayload>[0])

  if (Object.keys(payload).length === 0) {
    return action
  }

  return {
    ...action,
    payload,
  }
}

function normalizeActionList(actions?: AnyActionSchema[]): AnyActionSchema[] | undefined {
  if (!Array.isArray(actions)) return actions
  return actions.map(
    (action) =>
      normalizeActionPayload(
        action as unknown as Record<string, unknown>,
      ) as unknown as AnyActionSchema,
  )
}

type NormalizableAction = AnyActionSchema | string

function normalizeActionRecord(
  events?: Record<string, NormalizableAction[]>,
): Record<string, NormalizableAction[]> | undefined {
  if (!events) return events
  return Object.fromEntries(
    Object.entries(events).map(([eventName, actions]) => [
      eventName,
      Array.isArray(actions)
        ? actions.map((action) =>
            action && typeof action === 'object' && !Array.isArray(action)
              ? (normalizeActionPayload(
                  action as unknown as Record<string, unknown>,
                ) as unknown as AnyActionSchema)
              : action,
          )
        : actions,
    ]),
  )
}

function normalizeNodeSchema(node: PageSchema['children']): PageSchema['children'] {
  if (!node) return node

  const legacyNode = node as typeof node & {
    condition?: typeof node.renderIf
    loop?: {
      data?: unknown
      itemArg?: string
      indexArg?: string
    }
    slotName?: string
    animation?: (typeof node.animation & { class?: string }) | undefined
  }

  return {
    ...node,
    component: getNodeComponent(node),
    renderIf: getNodeRenderIf(legacyNode),
    repeat: getNodeRepeat(legacyNode),
    slot: getNodeSlot(legacyNode),
    actions: normalizeActionList(node.actions) as AnyActionSchema[] | undefined,
    events: normalizeActionRecord(node.events as Record<string, NormalizableAction[]>) as
      | typeof node.events
      | undefined,
    animation: legacyNode.animation
      ? {
          ...legacyNode.animation,
          className: legacyNode.animation.className || legacyNode.animation.class,
        }
      : legacyNode.animation,
    children: node.children?.map((child) => normalizeNodeSchema(child)!).filter(Boolean),
    slots: node.slots
      ? Object.fromEntries(
          Object.entries(node.slots).map(([slotName, children]) => [
            slotName,
            children.map((child) => normalizeNodeSchema(child)!).filter(Boolean),
          ]),
        )
      : node.slots,
  }
}

export function normalizeProjectSchema(project: ProjectSchema): ProjectSchema {
  return {
    ...project,
    data: {
      ...(project.data || {}),
      globalState: project.data?.globalState || project.globalState || [],
    },
    apis: {
      ...(project.apis || {}),
      definitions: project.apis?.definitions || project.globalApis || [],
    },
    logic: project.logic
      ? {
          ...project.logic,
          actions: normalizeActionList(project.logic.actions),
        }
      : project.logic,
    pages: Array.isArray(project.pages)
      ? project.pages.map((page) => {
          const normalizedPage: PageSchema = {
            ...page,
            actions: normalizeActionList(page.actions) as AnyActionSchema[] | undefined,
            events: normalizeActionRecord(page.events as Record<string, NormalizableAction[]>) as
              | typeof page.events
              | undefined,
          }
          const normalizedRoot = normalizeNodeSchema(getPageRoot(page))
          if (normalizedRoot) {
            normalizedPage.children = normalizedRoot
          }
          ensurePageRoot(normalizedPage)
          return normalizedPage
        })
      : [],
  }
}

export const generateProjectId = generateStableProjectId

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
        homePage: { type: 'path', path: '/' },
      },
    },
    pages: [],
  }
}
