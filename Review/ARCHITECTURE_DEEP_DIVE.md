# Vela LowCode Editor 架构深度解析

> 本文档提供方法级的详细解析，帮助深入理解项目架构。

## 目录

1. [整体架构概览](#1-整体架构概览)
2. [依赖关系图](#2-依赖关系图)
3. [Editor 包详解（入口）](#3-editor-包详解)
4. [Core 包详解](#4-core-包详解)
5. [Renderer 包详解](#5-renderer-包详解)
6. [Materials 包详解](#6-materials-包详解)
7. [Generator 包详解](#7-generator-包详解)
8. [UI 包详解](#8-ui-包详解)
9. [Server 详解](#9-server-详解)
10. [核心设计模式](#10-核心设计模式)

---

## 1. 整体架构概览

### 1.1 Monorepo 结构

```
webgis/
├── packages/
│   ├── editor/      # 主应用程序（入口）
│   ├── renderer/    # 运行时渲染引擎
│   ├── materials/   # 物料组件系统
│   ├── generator/   # 代码生成器
│   ├── core/        # 核心类型和工具（无依赖）
│   ├── ui/          # Vue UI 组件库
│   └── ui-react/    # React UI 组件库
├── server/          # Express 后端服务
├── tests/           # 全局测试
└── docs/            # 文档
```

### 1.2 技术栈

| 层级     | 技术                  |
| -------- | --------------------- |
| 框架     | Vue 3 + TypeScript    |
| 状态管理 | Pinia (Setup Syntax)  |
| 构建工具 | Vite + pnpm workspace |
| UI 库    | Element Plus          |
| 图表     | ECharts 6             |
| 后端     | Express + SQLite      |
| 测试     | Vitest + Playwright   |

### 1.3 核心数据流

```
用户操作 → Command → Store → NodeSchema → Renderer → DOM
                ↓
           History Stack (Undo/Redo)
```

---

## 2. 依赖关系图

```
┌─────────────────────────────────────────────────────────────┐
│                      @vela/editor                           │
│                    (主应用程序入口)                           │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  @vela/renderer │  │ @vela/materials │  │ @vela/generator │
│   (运行时渲染)   │  │   (物料组件)    │  │   (代码生成)    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
          │                   │                   │
          └───────────────────┼───────────────────┘
                              ▼
                    ┌─────────────────┐
                    │    @vela/ui     │
                    │  (纯 UI 组件)   │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   @vela/core    │
                    │ (类型 + 工具)   │
                    │   [无依赖]      │
                    └─────────────────┘
```

**依赖规则**：依赖只能向下流动，`@vela/core` 是叶子节点，不依赖任何内部包。

---

## 3. Editor 包详解

> Editor 是整个应用的入口，整合所有其他包。

### 3.1 入口文件

#### `main.ts` - 应用初始化

```typescript
// 位置: packages/editor/src/main.ts

// 主要职责:
// 1. 创建 Vue 应用实例
// 2. 注册 Pinia 状态管理
// 3. 注册 Element Plus UI 库
// 4. 异步加载并注册所有物料组件
// 5. 处理组件名称冲突（添加 Lc 前缀）

// 冲突处理的保留名称:
const RESERVED_NAMES = ['Button', 'Input', 'Select', 'Form', 'Table', 'Dialog', 'Menu', 'Image']
```

#### `App.vue` - 根组件

```vue
<!-- 位置: packages/editor/src/App.vue -->
<template>
  <div class="app-root">
    <router-view />
  </div>
</template>
```

### 3.2 路由配置

```typescript
// 位置: packages/editor/src/router/index.ts

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/dashboard.vue'),
    meta: { title: '项目工作台' },
  },
  {
    path: '/editor/:id?',
    name: 'Editor',
    component: () => import('@/views/editor.vue'),
    meta: { title: 'Vela Engine' },
  },
  {
    path: '/preview',
    name: 'Preview',
    component: () => import('@/views/Preview.vue'),
    meta: { title: '预览' },
  },
]
```

### 3.3 Stores 状态管理

#### 3.3.1 `project.ts` - 项目状态

```typescript
// 位置: packages/editor/src/stores/project.ts
// Store 名: 'project'

interface State {
  project: ProjectSchema // 项目配置
  currentPageId: string // 当前页面 ID
  saveStatus: 'saved' | 'saving' | 'unsaved'
  lastSavedTime: number | null
}

// Getters
const currentPage = computed<PageSchema | undefined>()

// Actions
function initProject(schema?: ProjectSchema): void
function createDefaultProject(): ProjectSchema
function addPage(name: string): void
function saveProject(): void
function updatePageConfig(config: Partial<PageSchema>): void
function changePageLayout(pageId: string, layout: LayoutMode): void
```

- initProject
- PageConfig
  - 为什么要设置width和height
  - theme
  - 这里每个页面都要显式设置layout吗，这个存在的意义是什么用于编辑器编辑模式判断吗？
  - pageId怎么是用的nanoid，我记得core中有写一个id生成工具
- saveProject没有保存到数据库中，只保存在localstorage中
- changePageLayout改变页面布局，page中的node的布局模式也会改变就很不合理

#### 3.3.2 `history.ts` - 历史记录（命令模式）

```typescript
// 位置: packages/editor/src/stores/history.ts
// Store 名: 'history'

interface State {
  undoStack: Command[] // 撤销栈
  redoStack: Command[] // 重做栈
  isExecuting: boolean // 防止递归
  isPaused: boolean // 批量操作时暂停
}

const MAX_HISTORY = 50 // 最大历史记录数

// Getters
const canUndo = computed<boolean>()
const canRedo = computed<boolean>()

// Actions
function executeCommand(command: Command, skipMerge?: boolean): void
function undo(): boolean
function redo(): boolean
function clear(): void
function pause(): void
function resume(): void
function withoutHistory<T>(fn: () => T): T // 在暂停状态下执行
```

#### 3.3.3 `ui.ts` - UI 状态

```typescript
// 位置: packages/editor/src/stores/ui.ts
// Store 名: 'ui'

interface State {
  // 画布配置
  canvasWidth: number // 1920
  canvasHeight: number // 1080
  canvasScale: number // 1
  canvasOffset: { x: number; y: number }
  canvasSettings: {
    backgroundColor: string // '#fafafa'
    gridColor: string // '#f0f0f0'
    showGrid: boolean // true
    gridSize: number // 20
  }

  // 面板状态
  rightPanelTab: 'properties' | 'animation' | 'events'
  leftPanelCollapsed: boolean
  rightPanelCollapsed: boolean
  canvasMode: 'free' | 'flow'
  isSimulationMode: boolean
}

// Actions
function setCanvasSize(width: number, height: number): void
function setCanvasScale(scale: number, min?: number, max?: number): void
function updateCanvasSettings(config: Partial<CanvasSettings>): void
function toggleLeftPanel(): void
function toggleRightPanel(): void
function setCanvasMode(mode: 'free' | 'flow'): void
function toggleSimulationMode(): void
```

#### 3.3.4 `component/` - 组件状态（复合 Store）

这是最复杂的 Store，由 5 个子模块组成：

##### `useComponentIndex()` - O(1) 索引

```typescript
// 位置: packages/editor/src/stores/component/index.ts

interface ComponentIndexContext {
  // 索引 Maps
  nodeIndex: Map<string, NodeSchema> // id → node
  parentIndex: Map<string, string> // childId → parentId

  // 方法
  traverse(node: NodeSchema, callback: TraverseCallback, parent?: NodeSchema): void
  rebuildIndex(rootNode: NodeSchema): void
  indexNode(node: NodeSchema, parentId?: string): void
  unindexNode(id: string): void
  findNodeById(targetId: string): NodeSchema | null
  findParentNode(targetId: string): NodeSchema | null
  getNodeIndex(id: string): number
  getParentId(id: string): string | null
}
```

##### `useComponentSelection()` - 选择管理

```typescript
interface ComponentSelectionContext {
  // 状态
  selectedId: Ref<string | null>
  selectedIds: Ref<string[]>
  hoveredId: Ref<string | null>

  // Getters
  selectedNode: ComputedRef<NodeSchema | null>
  selectedNodes: ComputedRef<NodeSchema[]>
  hoveredNode: ComputedRef<NodeSchema | null>

  // 方法
  selectComponent(id: string): void
  selectComponents(ids: string[]): void
  toggleSelection(id: string): void // Ctrl+Click
  setHovered(id: string | null): void
  clearSelection(): void
  isSelected(id: string): boolean
}
```

##### `useComponentStyle()` - 样式管理

```typescript
interface ComponentStyleContext {
  // 版本控制（触发响应式更新）
  styleVersion: Ref<Record<string, number>>

  // Raw Actions（不记录历史）
  updateStyleRaw(id: string, style: Partial<NodeStyle>): void
  updatePropsRaw(id: string, props: Record<string, unknown>): void
  updateDataSourceRaw(id: string, dataSource: DataSourceConfig): void

  // Ref 工厂函数（双向绑定）
  createPropRef<T>(id: string, propName: string, defaultValue: T): WritableComputedRef<T>
  createStyleRef<T>(id: string, styleName: string, defaultValue: T): WritableComputedRef<T>
}
```

##### `useComponentTree()` - 树结构

```typescript
interface ComponentTreeContext {
  rootNode: Ref<NodeSchema | null>

  // 方法
  loadTree(tree: NodeSchema): void // 深拷贝加载
  setTree(tree: NodeSchema): void // 直接设置（撤销用）
  flattenTree(node: NodeSchema): NodeSchema[]

  // Raw Actions
  addComponentRaw(parentId: string | null, component: NodeSchema, index?: number): string
  deleteComponentRaw(id: string): void
  moveComponentRaw(id: string, newParentId: string, newIndex: number): void
}
```

##### `useComponentClipboard()` - 剪贴板

```typescript
interface ComponentClipboardContext {
  clipboard: Ref<NodeSchema[]>
  canPaste: ComputedRef<boolean>

  copySelectedNodes(): void
  cutSelectedNodes(): void
  pasteNodes(): void
}
```

##### 主 Store 完整 API

```typescript
// 位置: packages/editor/src/stores/component/index.ts
// Store 名: 'component'

export function useComponent() {
  return {
    // === 状态 ===
    rootNode,
    selectedId,
    selectedIds,
    hoveredId,
    styleVersion,
    parentIndex,
    clipboard,

    // === Getters ===
    selectedNode,
    selectedNodes,
    hoveredNode,
    canPaste,
    getStyleVersion,

    // === 查找（O(1)）===
    findNodeById(id: string): NodeSchema | null,
    findParentNode(id: string): NodeSchema | null,
    getComponentById(id: string): NodeSchema | null,  // 别名
    getNodeIndex(id: string): number,
    getParentId(id: string): string | null,
    traverse(node: NodeSchema, callback: TraverseCallback): void,

    // === 树操作（通过 Command）===
    loadTree(tree: NodeSchema): void,
    addComponent(parentId: string | null, component: NodeSchema, index?: number): void,
    deleteComponent(id: string): void,
    deleteComponents(ids: string[]): void,
    moveComponent(id: string, newParentId: string, newIndex: number): void,

    // === 属性/样式更新（通过 Command）===
    updateProps(id: string, props: Record<string, unknown>): void,
    updateStyle(id: string, style: Partial<NodeStyle>): void,
    updateDataSource(id: string, dataSource: DataSourceConfig): void,
    updateLayoutMode(id: string, layoutMode: LayoutMode): void,

    // === 选择 ===
    selectComponent(id: string): void,
    selectComponents(ids: string[]): void,
    toggleSelection(id: string): void,
    setHovered(id: string | null): void,
    clearSelection(): void,

    // === 剪贴板 ===
    copySelectedNodes(): void,
    cutSelectedNodes(): void,
    pasteNodes(): void,

    // === Ref 工厂（双向绑定）===
    createPropRef<T>(id: string, propName: string, defaultValue: T): WritableComputedRef<T>,
    createStyleRef<T>(id: string, styleName: string, defaultValue: T): WritableComputedRef<T>,

    // === Raw Actions（命令内部用）===
    addComponentRaw,
    deleteComponentRaw,
    moveComponentRaw,
    updateStyleRaw,
    updatePropsRaw,
    updateDataSourceRaw,
    updateLayoutModeRaw,
  }
}
```

### 3.4 命令系统

#### 命令接口

```typescript
// 位置: packages/editor/src/stores/commands/types.ts

interface Command {
  readonly type: CommandType
  readonly description?: string

  execute(): void
  undo(): void
  redo(): void

  // 可选：命令合并
  canMerge?(other: Command): boolean
  merge?(other: Command): Command
}

type CommandType =
  | 'add-component'
  | 'delete-component'
  | 'move-component'
  | 'update-props'
  | 'update-style'
  | 'update-data-source'
  | 'update-layout-mode'
  | 'batch'
```

#### 具体命令实现

```typescript
// 位置: packages/editor/src/stores/commands/component-commands.ts

// 1. AddComponentCommand
class AddComponentCommand implements Command {
  type = 'add-component' as const

  constructor(payload: AddComponentPayload) {}

  execute(): void // 添加组件
  undo(): void // 删除刚添加的组件
  redo(): void // 重新添加
  getAddedId(): string
}

// 2. DeleteComponentCommand
class DeleteComponentCommand implements Command {
  type = 'delete-component' as const

  execute(): void // 保存状态并删除
  undo(): void // 恢复到原位置
}

// 3. MoveComponentCommand
class MoveComponentCommand implements Command {
  type = 'move-component' as const

  execute(): void // 保存旧位置并移动
  undo(): void // 恢复到旧位置
}

// 4. UpdateStyleCommand（支持合并）
class UpdateStyleCommand implements Command {
  type = 'update-style' as const

  execute(): void
  undo(): void

  canMerge(other: Command): boolean // 300ms 内可合并
  merge(other: Command): Command
}

// 5. UpdatePropsCommand（支持合并）
class UpdatePropsCommand implements Command {
  type = 'update-props' as const
  // 类似 UpdateStyleCommand
}

// 6. BatchCommand（组合命令）
class BatchCommand implements Command {
  type = 'batch' as const

  constructor(commands: Command[]) {}

  execute(): void // 顺序执行
  undo(): void // 逆序撤销
}
```

### 3.5 Composables 组合式函数

#### `useEditorShortcuts.ts` - 键盘快捷键

```typescript
// 位置: packages/editor/src/composables/useEditorShortcuts.ts

interface Options {
  enableDelete?: boolean
  enableClipboard?: boolean
  enableSelectAll?: boolean
  closeMenu?: () => void
}

export function useEditorShortcuts(options: Options = {}) {
  // 支持的快捷键:
  // Delete/Backspace  → 删除选中组件
  // Ctrl+C            → 复制
  // Ctrl+X            → 剪切
  // Ctrl+V            → 粘贴
  // Ctrl+A            → 全选顶层组件
  // Escape            → 取消选中/关闭菜单
  // Mac 使用 metaKey，其他使用 ctrlKey
  // 忽略在 input/textarea 中的输入
}
```

#### `useComponentEvents.ts` - 事件系统

```typescript
// 位置: packages/editor/src/composables/useComponentEvents.ts

interface ComponentEventsContext {
  emitComponentEvent(componentId: string, eventName: string, params?: unknown): void
  executeAction(action: ActionSchema, sourceComponent?: NodeSchema): void
}

// 提供上下文
export function provideComponentEvents(): void

// 注入上下文
export function useComponentEvents(): ComponentEventsContext

// 组件级事件处理
export function useComponentEventHandlers(componentId: string) {
  return {
    component: ComputedRef<NodeSchema | null>,
    handleClick(): void,
    handleMouseEnter(): void,
    handleDoubleClick(): void,
    emitCustomEvent(eventName: string): void,
    onEvent(eventName: string, handler: EventHandler): void,
    offEvent(eventName: string): void,
  }
}

// 支持的 Action 类型:
// 'alert'        → 弹出提示
// 'openUrl'      → 打开 URL
// 'navigate'     → 路由导航
// 'updateState'  → 更新状态
// 'customScript' → 执行自定义脚本
```

#### `useDataSourceAdapter.ts` - 数据源适配

```typescript
// 位置: packages/editor/src/composables/useDataSourceAdapter.ts
// 代码量: ~319 行

interface DataSourceConfig {
  enabled?: boolean
  url?: string
  method?: 'GET' | 'POST'
  headers?: Record<string, string>
  body?: string
  interval?: number // 轮询间隔

  // 数据路径映射
  dataPath?: string
  xAxisPath?: string
  seriesNamePath?: string
  labelsPath?: string
  valuePath?: string
  namePath?: string
}

export function useDataSourceAdapter(
  nodeRef: Ref<NodeSchema>,
  propsRef: Ref<Record<string, unknown>>,
): {
  resolvedProps: ComputedRef<Record<string, unknown>>
  isLoading: Ref<boolean>
  error: Ref<string | null>
}

// 支持的图表适配器:
// - 折线图/柱状图 (Line/Bar)
// - 饼图 (Pie)
// - 散点图 (Scatter)
// - 统计卡 (StatisticCard)
// - Sankey 图
// - 数字滚动 (NumberRoll)
```

#### `useNodeProps.ts` - 属性双向绑定

```typescript
// 位置: packages/editor/src/composables/useNodeProps.ts

interface UseNodePropsReturn {
  propModels: Ref<Record<string, WritableComputedRef<unknown>>>
  getPropModel<T>(propName: string, defaultValue?: T): WritableComputedRef<T>
  nodeId: Ref<string | null>
}

export function useNodeProps(
  nodeRef: Ref<NodeSchema | null>,
  metaProps: PropSchema[],
): UseNodePropsReturn

// 使用示例:
// const { getPropModel } = useNodeProps(nodeRef, meta.props)
// const titleModel = getPropModel('title', 'Default')
// <StringSetter v-model="titleModel" />
```

#### `useContextMenu.ts` - 右键菜单

```typescript
// 位置: packages/editor/src/composables/useContextMenu.ts

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  targetId: string | null
  extraData?: Record<string, unknown>
}

export function useContextMenu() {
  return {
    menuState: Ref<ContextMenuState>,
    openContextMenu(e: MouseEvent, targetId?: string, extraData?: unknown): void,
    closeContextMenu(): void,
  }
}
```

### 3.6 组件结构

#### Canvas 画布组件

```
components/Canvas/
├── CanvasViewport.vue      # 视口（缩放、平移、网格）
├── CanvasStage.vue         # 舞台容器
├── CanvasBoard.vue         # 画布主体
├── ComponentRenderer.vue   # 组件渲染器
├── ComponentNode.vue       # 单个组件节点
├── UniversalRenderer.vue   # 通用渲染器
│
├── composables/
│   ├── useCanvasContext.ts # 画布上下文
│   ├── useSnapping.ts      # 吸附逻辑
│   └── useTransform.ts     # 变换操作
│
├── selection/
│   └── SelectionLayer.vue  # 选择层
│
├── guides/
│   └── SnapLines.vue       # 吸附线
│
└── modes/Flow/             # 流式布局模式
    ├── FlowCanvas.vue
    ├── NodeWrapper.vue
    ├── DropZone.vue
    ├── DropIndicator.vue
    ├── ContextMenu.vue
    └── useFlowDrop.ts
```

#### SetterPanel 属性面板

```
components/SetterPanel/
├── SetterPanel.vue         # 主容器
│
├── panes/
│   ├── PropsPane.vue       # 属性面板
│   ├── StylePane.vue       # 样式面板
│   ├── AnimationPane.vue   # 动画面板
│   ├── EventPane.vue       # 事件面板
│   └── PageSettingPane.vue # 页面设置
│
├── setters/                # 属性编辑器
│   ├── StringSetter.vue    # 文本输入
│   ├── NumberSetter.vue    # 数字输入
│   ├── BooleanSetter.vue   # 开关
│   ├── ColorSetter.vue     # 颜色选择
│   ├── SelectSetter.vue    # 下拉选择
│   ├── JsonSetter.vue      # JSON 编辑
│   └── ObjectSetter.vue    # 对象编辑
│
└── composables/
    ├── useAnimation.ts
    ├── useEvents.ts
    └── useRelations.ts
```

### 3.7 Services 服务层

```typescript
// === HTTP 客户端 ===
// 位置: packages/editor/src/services/http.ts

import axios from 'axios'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 10000,
})

// === 项目 API ===
// 位置: packages/editor/src/services/projects.ts

export async function listProjects(): Promise<ServerProject[]>
export async function getProject(id: string): Promise<ServerProject | null>
export async function createProject(payload: ProjectInput): Promise<ServerProject>
export async function updateProject(id: string, payload: ProjectInput): Promise<ServerProject>
export async function deleteProject(id: string): Promise<void>
```

---

## 4. Core 包详解

> Core 是叶子节点，不依赖任何内部包，仅依赖 `zod`。

### 4.1 目录结构

```
packages/core/src/
├── index.ts           # 总入口
├── types/             # 类型定义（18 个文件）
├── utils/             # 工具函数（11 个文件）
├── model/             # 数据模型（5 个文件）
├── layout/            # 布局引擎（7 个文件）
├── plugins/           # 插件系统（3 个文件）
└── constants/         # 常量定义（2 个文件）
```

### 4.2 核心类型 - NodeSchema

```typescript
// 位置: packages/core/src/types/schema.ts

interface NodeSchema {
  id: string // 唯一标识
  componentName: string // 组件名称
  props?: Record<string, unknown> // 组件属性
  style?: NodeStyle // 样式配置
  children?: NodeSchema[] // 子组件
  events?: Record<string, ActionSchema[]> // 事件绑定
  dataBindings?: DataBinding[] // 数据绑定
  dataSource?: DataSourceConfig // 数据源配置
  condition?: Expression // 条件渲染
  loop?: LoopConfig // 循环渲染
  layoutMode?: 'free' | 'flex' | 'grid' | 'flow'
}

interface NodeStyle {
  position?: 'absolute' | 'relative' | 'fixed'
  left?: number
  top?: number
  width?: number | string
  height?: number | string
  zIndex?: number
  opacity?: number
  transform?: string
  backgroundColor?: string
  // ... 更多 CSS 属性
}
```

### 4.3 其他核心类型

```typescript
// === 项目 Schema ===
interface ProjectSchema {
  id: string
  name: string
  description?: string
  pages: PageSchema[]
  globalState?: Record<string, unknown>
  theme?: ThemeConfig
}

// === 页面 Schema ===
interface PageSchema {
  id: string
  name: string
  path: string
  root: NodeSchema
  layoutMode: 'free' | 'flow'
  config?: {
    width: number
    height: number
    backgroundColor?: string
  }
}

// === 动作 Schema ===
interface ActionSchema {
  type: ActionType
  config: ActionConfig
}

type ActionType =
  | 'alert'
  | 'openUrl'
  | 'navigate'
  | 'updateState'
  | 'customScript'
  | 'toggleVisibility'
  | 'setProps'
  | 'emit'
// ... 10+ 种动作类型

// === 数据绑定 ===
interface DataBinding {
  sourceId: string
  sourceProp: string
  targetProp: string
  transform?: string // 表达式转换
}

// === 物料定义 ===
interface MaterialDefinition {
  name: string
  category: string
  defaultSize: { width: number; height: number }
  props: PropSchema[]
  events: EventSchema[]
  slots?: SlotSchema[]
}
```

### 4.4 工具函数

```typescript
// === ID 生成 ===
// 位置: packages/core/src/utils/id.ts
export function generateId(): string
export function generateShortId(): string

// === 深拷贝 ===
// 位置: packages/core/src/utils/clone.ts
export function deepClone<T>(obj: T): T
export function shallowClone<T>(obj: T): T

// === 树操作 ===
// 位置: packages/core/src/utils/tree.ts
export function traverseTree(node: NodeSchema, callback: TraverseCallback): void
export function findNodeById(root: NodeSchema, id: string): NodeSchema | null
export function findParentNode(root: NodeSchema, id: string): NodeSchema | null
export function flattenTree(root: NodeSchema): NodeSchema[]

// === 样式工具 ===
// 位置: packages/core/src/utils/style.ts
export function normalizeStyle(style: NodeStyle): CSSProperties
export function parseStyleValue(value: string | number): number

// === 沙箱执行 ===
// 位置: packages/core/src/utils/sandbox.ts
export function safeEval(code: string, context: Record<string, unknown>): unknown
```

### 4.5 布局引擎

```typescript
// 位置: packages/core/src/layout/

// 基础引擎接口
interface LayoutEngine {
  name: string
  calculateLayout(node: NodeSchema, containerSize: Size): LayoutResult
  validateConfig(config: unknown): boolean
}

// 具体实现
export class FreeLayoutEngine implements LayoutEngine      // 自由定位
export class FlexLayoutEngine implements LayoutEngine      // Flexbox
export class GridLayoutEngine implements LayoutEngine      // CSS Grid
export class FlowLayoutEngine implements LayoutEngine      // 流式布局

// 引擎注册表
// 位置: packages/core/src/layout/registry.ts
export const layoutEngineRegistry: Map<string, LayoutEngine>
export function registerLayoutEngine(engine: LayoutEngine): void
export function getLayoutEngine(name: string): LayoutEngine | undefined
```

---

## 5. Renderer 包详解

> Renderer 负责将 NodeSchema 渲染为实际 DOM。

### 5.1 目录结构

```
packages/renderer/src/
├── index.ts                    # 入口导出
├── types.ts                    # 类型定义
├── runtime/
│   ├── RuntimeRenderer.vue     # 运行时渲染器
│   ├── RuntimeComponent.vue    # 基础运行时组件
│   ├── UnifiedRenderer.vue     # 统一渲染器
│   ├── UnifiedComponent.vue    # 统一组件
│   ├── NodeWrapper.vue         # 节点包装器
│   ├── useComponentDataSource.ts
│   ├── useDataBindingEngine.ts
│   ├── useEventExecutor.ts
│   └── useComponentStyle.ts
├── composables/
│   └── useComponentStyle.ts
└── devtools/
    ├── inspector.ts            # 组件检查器
    ├── logger.ts               # 日志记录
    ├── panel.ts                # 开发面板
    └── performance.ts          # 性能监控
```

### 5.2 核心组件

#### RuntimeRenderer.vue

```vue
<!-- 位置: packages/renderer/src/runtime/RuntimeRenderer.vue -->
<script setup lang="ts">
interface Props {
  schema: NodeSchema
  mode?: 'edit' | 'preview' | 'runtime'
}

// 递归渲染组件树
// 处理条件渲染 (condition)
// 处理循环渲染 (loop)
</script>

<template>
  <component
    :is="resolveComponent(schema.componentName)"
    v-bind="resolvedProps"
    :style="computedStyle"
  >
    <RuntimeRenderer v-for="child in schema.children" :key="child.id" :schema="child" />
  </component>
</template>
```

### 5.3 核心 Composables

#### `useDataBindingEngine.ts`

```typescript
// 位置: packages/renderer/src/runtime/useDataBindingEngine.ts

interface DataBindingEngine {
  register(binding: DataBinding): void
  unregister(bindingId: string): void
  getValue(sourceId: string, sourceProp: string): unknown
  sync(): void
}

export function useDataBindingEngine(rootSchema: Ref<NodeSchema>): DataBindingEngine

// 工作原理:
// 1. 收集所有组件的 dataBindings
// 2. 使用 Vue watch 监听源属性变化
// 3. 自动同步到目标属性
```

#### `useEventExecutor.ts`

```typescript
// 位置: packages/renderer/src/runtime/useEventExecutor.ts

interface EventExecutor {
  execute(actions: ActionSchema[], context: EventContext): Promise<void>
}

export function useEventExecutor(): EventExecutor

// 支持的动作执行:
// - alert: ElMessage 弹窗
// - openUrl: window.open
// - navigate: router.push
// - updateState: 更新全局状态
// - customScript: new Function 执行
// - toggleVisibility: 切换组件可见性
// - setProps: 设置组件属性
```

#### `useComponentDataSource.ts`

```typescript
// 位置: packages/renderer/src/runtime/useComponentDataSource.ts

export function useComponentDataSource(node: Ref<NodeSchema>): {
  data: Ref<unknown>
  isLoading: Ref<boolean>
  error: Ref<Error | null>
  refresh(): Promise<void>
}

// 功能:
// - 根据 node.dataSource 配置发起请求
// - 支持轮询刷新
// - 错误处理和加载状态
```

---

## 6. Materials 包详解

> Materials 包装 UI 组件，连接到 stores 和数据绑定。

### 6.1 目录结构

```
packages/materials/src/
├── index.ts              # 入口导出
├── registry.ts           # 物料注册表（关键）
│
├── basic/                # 基础物料
│   ├── button/
│   │   ├── Button.vue
│   │   ├── meta.ts
│   │   └── index.ts
│   ├── container/
│   ├── image/
│   └── text/
│
├── chart/                # 图表物料
│   ├── BarChart/
│   ├── LineChart/
│   ├── PieChart/
│   ├── GaugeChart/
│   └── ... (10+)
│
├── controls/             # 表单控件
│   ├── Select/
│   ├── Slider/
│   └── ...
│
├── data/                 # 数据展示
│   ├── Table/
│   └── ...
│
└── advanced/             # 高级物料
    ├── Html/
    ├── Iframe/
    └── Markdown/
```

### 6.2 物料注册表

```typescript
// 位置: packages/materials/src/registry.ts

interface MaterialEntry {
  name: string
  component: Component
  meta: MaterialMeta
}

interface MaterialMeta {
  name: string
  category: 'basic' | 'chart' | 'controls' | 'data' | 'advanced'
  icon?: string
  defaultSize: { width: number; height: number }
  props: PropSchema[]
  events: EventSchema[]
  slots?: SlotSchema[]
}

// 注册表
export const materialRegistry: Map<string, MaterialEntry>

// 注册函数
export function registerMaterial(entry: MaterialEntry): void

// 获取函数
export function getMaterial(name: string): MaterialEntry | undefined
export function getMaterialsByCategory(category: string): MaterialEntry[]
export function getAllMaterials(): MaterialEntry[]
```

### 6.3 物料结构示例

```typescript
// === Button 物料 ===

// Button.vue
<script setup lang="ts">
import { VButton } from '@vela/ui'

defineProps<{
  text?: string
  type?: 'primary' | 'default' | 'danger'
  disabled?: boolean
}>()

defineEmits<{
  (e: 'click'): void
}>()
</script>

<template>
  <VButton :type="type" :disabled="disabled" @click="$emit('click')">
    {{ text }}
  </VButton>
</template>

// meta.ts
export const meta: MaterialMeta = {
  name: 'Button',
  category: 'basic',
  icon: 'mdi-button',
  defaultSize: { width: 120, height: 40 },
  props: [
    {
      name: 'text',
      type: 'string',
      default: 'Button',
      setter: 'StringSetter',
    },
    {
      name: 'type',
      type: 'enum',
      options: ['primary', 'default', 'danger'],
      default: 'default',
      setter: 'SelectSetter',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: false,
      setter: 'BooleanSetter',
    },
  ],
  events: [
    { name: 'click', description: '点击时触发' },
  ],
}

// index.ts
export { default as Button } from './Button.vue'
export { meta } from './meta'
```

---

## 7. Generator 包详解

> Generator 将 NodeSchema 转换为可运行的 Vue/React 代码。

### 7.1 目录结构

```
packages/generator/src/
├── index.ts                # 主入口
├── projectGenerator.ts     # 项目级生成
├── codeGenerator.ts        # 核心生成器
│
├── transformer/
│   ├── index.ts
│   └── schema-to-ir.ts     # Schema → IR
│
├── generators/
│   ├── vue3-generator.ts   # Vue 3 生成器
│   ├── react-generator.ts  # React 生成器
│   └── react-project-generator.ts
│
├── types/
│   └── ir.ts               # 中间表示类型
│
└── utils/
    ├── code-validator.ts   # 代码验证
    └── expression-validator.ts
```

### 7.2 代码生成流程

```
NodeSchema
    ↓
Schema → IR 转换 (schema-to-ir.ts)
    ↓
IRNode (中间表示)
    ↓
Framework Generator (vue3/react)
    ↓
Source Code (*.vue / *.tsx)
```

### 7.3 中间表示 (IR)

```typescript
// 位置: packages/generator/src/types/ir.ts

interface IRNode {
  type: 'element' | 'component' | 'text' | 'fragment'
  tag?: string
  props?: IRProp[]
  children?: IRNode[]
  directives?: IRDirective[]
  events?: IREvent[]
  slots?: IRSlot[]
}

interface IRProp {
  name: string
  value: unknown
  isDynamic: boolean
  expression?: string
}

interface IRDirective {
  name: string // v-if, v-for, v-show
  value: string
  arg?: string
  modifiers?: string[]
}
```

### 7.4 核心生成器

```typescript
// 位置: packages/generator/src/generators/vue3-generator.ts

export class Vue3Generator {
  generate(schema: NodeSchema): GeneratedFile[]

  private generateTemplate(ir: IRNode): string
  private generateScript(ir: IRNode): string
  private generateStyle(ir: IRNode): string
  private resolveImports(ir: IRNode): ImportStatement[]
}

// 位置: packages/generator/src/generators/react-generator.ts

export class ReactGenerator {
  generate(schema: NodeSchema): GeneratedFile[]

  private generateJSX(ir: IRNode): string
  private generateHooks(ir: IRNode): string
  private generateStyles(ir: IRNode): string
}
```

### 7.5 项目生成

```typescript
// 位置: packages/generator/src/projectGenerator.ts

interface ProjectGeneratorOptions {
  framework: 'vue3' | 'react'
  typescript: boolean
  cssPreprocessor: 'css' | 'scss' | 'less'
  outputDir: string
}

export class ProjectGenerator {
  async generate(project: ProjectSchema, options: ProjectGeneratorOptions): Promise<void>

  private generatePackageJson(): string
  private generateViteConfig(): string
  private generateRoutes(): string
  private generatePages(): GeneratedFile[]
  private generateComponents(): GeneratedFile[]
}
```

---

## 8. UI 包详解

> UI 是纯 Vue 组件库，props 驱动，无编辑器逻辑。

### 8.1 目录结构

```
packages/ui/src/components/
├── basic/          # 基础组件
│   ├── button/
│   └── container/
│
├── chart/          # 图表组件 (10+)
│   ├── barChart/
│   ├── lineChart/
│   ├── pieChart/
│   └── ...
│
├── controls/       # 表单控件
│   ├── select/
│   ├── slider/
│   └── ...
│
├── data/           # 数据展示
│   ├── table/
│   └── list/
│
├── kpi/            # KPI 指标
│   ├── stat/
│   └── progress/
│
├── layout/         # 布局组件
│   ├── grid/
│   ├── flex/
│   └── panel/
│
└── media/          # 媒体组件
    ├── image/
    └── video/
```

### 8.2 组件示例

```vue
<!-- 位置: packages/ui/src/components/chart/barChart/BarChart.vue -->
<script setup lang="ts">
import { use } from 'echarts/core'
import VChart from 'vue-echarts'

interface Props {
  data: { name: string; value: number }[]
  title?: string
  xAxisLabel?: string
  yAxisLabel?: string
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  color: '#5470c6',
})

const option = computed(() => ({
  title: { text: props.title },
  xAxis: {
    type: 'category',
    data: props.data.map((d) => d.name),
  },
  yAxis: { type: 'value' },
  series: [
    {
      type: 'bar',
      data: props.data.map((d) => d.value),
      itemStyle: { color: props.color },
    },
  ],
}))
</script>

<template>
  <VChart :option="option" autoresize />
</template>
```

---

## 9. Server 详解

### 9.1 目录结构

```
server/
├── index.ts        # Express 入口
├── db.ts           # MongoDB 配置
├── models/
│   └── Project.ts  # 项目模型
├── routes/
│   ├── projects.ts # 项目 API
│   └── mock.ts     # Mock 数据
└── .env            # 环境变量
```

### 9.2 API 端点

```typescript
// 运行端口: 3002

// 项目 CRUD
POST   /api/projects          // 创建项目
GET    /api/projects          // 列表项目
GET    /api/projects/:id      // 获取项目
PUT    /api/projects/:id      // 更新项目
DELETE /api/projects/:id      // 删除项目

// Mock 数据
GET    /api/mock/:type        // 获取 mock 数据
```

---

## 10. 核心设计模式

### 10.1 命令模式 (Command Pattern)

```
┌────────────┐      ┌─────────────┐      ┌────────────┐
│   用户操作  │ ──→  │   Command   │ ──→  │   Store    │
└────────────┘      └─────────────┘      └────────────┘
                          │
                          ▼
                    ┌─────────────┐
                    │ History Stack│
                    │  (Undo/Redo) │
                    └─────────────┘
```

**优势**:

- 完整的撤销/重做支持
- 命令可合并（减少历史记录）
- 批量操作原子化

### 10.2 O(1) 索引查找

```typescript
// 传统方式: O(n) 树遍历
function findNode(root, id) {
  if (root.id === id) return root
  for (const child of root.children) {
    const found = findNode(child, id)
    if (found) return found
  }
  return null
}

// 优化方式: O(1) Map 查找
const nodeIndex = new Map<string, NodeSchema>()
const parentIndex = new Map<string, string>()

function findNode(id) {
  return nodeIndex.get(id) // O(1)
}
```

### 10.3 响应式双向绑定工厂

```typescript
// 工厂函数创建响应式 ref
function createPropRef<T>(id: string, propName: string, defaultValue: T) {
  return computed({
    get() {
      const node = findNodeById(id)
      return node?.props?.[propName] ?? defaultValue
    },
    set(value) {
      updateProps(id, { [propName]: value })
    },
  })
}

// 使用
const titleRef = createPropRef('node-1', 'title', 'Default')
titleRef.value = 'New Title' // 自动触发 updateProps
```

### 10.4 Store Accessor 模式

```typescript
// 避免循环依赖
let storeAccessor: ComponentStoreAccessor | null = null

export function setStoreAccessor(accessor: ComponentStoreAccessor) {
  storeAccessor = accessor
}

// 在命令中使用
class UpdateStyleCommand implements Command {
  execute() {
    storeAccessor!.updateStyleRaw(this.id, this.newStyle)
  }
}

// Store 初始化时设置
const store = useComponent()
setStoreAccessor({
  findNodeById: store.findNodeById,
  updateStyleRaw: store.updateStyleRaw,
  // ...
})
```

### 10.5 版本号触发精细更新

```typescript
// 问题: 更新一个节点导致整树重渲染
// 解决: 使用版本号精细控制

const styleVersion = ref<Record<string, number>>({})

function updateStyle(id: string, style: NodeStyle) {
  // 更新样式
  node.style = { ...node.style, ...style }
  // 递增版本号，触发特定组件更新
  styleVersion.value[id] = (styleVersion.value[id] || 0) + 1
}

// 组件中监听特定版本
watch(
  () => styleVersion.value[props.nodeId],
  () => {
    /* 仅此组件重渲染 */
  },
)
```

---

## 附录: 快速参考

### 常用命令

```bash
pnpm dev                    # 启动开发环境
pnpm -F @vela/editor dev    # 仅启动编辑器
pnpm build                  # 构建
pnpm test                   # 测试
pnpm lint                   # 代码检查
pnpm type-check             # 类型检查
```

### 路径别名

```typescript
'@vela/core'      → packages/core/src
'@vela/editor'    → packages/editor/src
'@vela/materials' → packages/materials/src
'@vela/renderer'  → packages/renderer/src
'@vela/generator' → packages/generator/src
'@vela/ui'        → packages/ui
'@'               → packages/editor/src
```

### 关键文件清单

| 文件                                                        | 用途            |
| ----------------------------------------------------------- | --------------- |
| `packages/editor/src/main.ts`                               | 应用入口        |
| `packages/editor/src/stores/component/index.ts`             | 组件状态管理    |
| `packages/editor/src/stores/commands/component-commands.ts` | 命令实现        |
| `packages/core/src/types/schema.ts`                         | NodeSchema 定义 |
| `packages/renderer/src/runtime/RuntimeRenderer.vue`         | 运行时渲染      |
| `packages/materials/src/registry.ts`                        | 物料注册表      |
| `packages/generator/src/generators/vue3-generator.ts`       | Vue 代码生成    |
