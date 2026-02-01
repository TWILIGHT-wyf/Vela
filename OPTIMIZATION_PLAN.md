# Vela 低代码平台 - 优化升级计划

> 生成时间: 2026-01-31
> 版本: 1.0

---

## 目录

1. [项目现状总览](#1-项目现状总览)
2. [类型系统优化](#2-类型系统优化)
3. [代码生成器升级](#3-代码生成器升级)
4. [编辑器架构重构](#4-编辑器架构重构)
5. [组件库完善](#5-组件库完善)
6. [运行时渲染优化](#6-运行时渲染优化)
7. [构建与发布配置](#7-构建与发布配置)
8. [实施计划](#8-实施计划)

---

## 1. 项目现状总览

### 1.1 架构优势

| 方面 | 现状 | 评价 |
|------|------|------|
| Monorepo 结构 | 清晰的包分离 | ✅ 优秀 |
| IR 中间表示 | 框架无关的代码生成 | ✅ 优秀 |
| Store 设计 | Pinia + 命令模式 | ✅ 良好 |
| 组件注册 | 动态导入 + 元数据 | ⚠️ 需优化 |
| 类型系统 | NodeSchema + 旧兼容层 | ⚠️ 需统一 |

### 1.2 代码统计

```
packages/
├── core/          ~2,500 行  类型定义、工具函数
├── editor/       ~15,000 行  编辑器主体
├── generator/     ~3,500 行  代码生成器
├── materials/     ~8,000 行  物料组件
├── renderer/      ~2,000 行  运行时渲染
├── ui/           ~12,000 行  Vue UI 组件库
└── ui-react/      ~1,500 行  React UI 组件库 (新增)
─────────────────────────────
总计              ~44,500 行
```

### 1.3 关键问题优先级

```
影响力
  ▲
  │  🔴 P0: 类型统一        🔴 P0: React 完整性
  │  🔴 P0: 包构建修复      🔴 P0: 异常处理
  │
  │  🟠 P1: Store 重构      🟠 P1: Material 统一
  │  🟠 P1: 性能优化        🟠 P1: 文档完善
  │
  │  🟡 P2: 测试框架        🟡 P2: CI/CD
  │  🟡 P2: DevTools        🟡 P2: 调试工具
  │
  └─────────────────────────────────────► 实施周期
```

---

## 2. 类型系统优化

### 2.1 当前问题

#### 问题 A: NodeSchema vs Component 双重定义

**位置:**
- `packages/core/src/types/schema.ts` - 新的 NodeSchema
- `packages/core/src/types/components.ts` - 旧的 Component
- `packages/generator/src/components.ts` - 生成器 Component

**影响:**
- 需要转换函数桥接
- 类型不一致导致 bug
- 维护成本高

#### 问题 B: ActionSchema 定义分散

**位置:**
- `packages/core/src/types/action.ts` - 规范定义
- `packages/renderer/src/runtime/useEventExecutor.ts` - EventAction
- `packages/generator/src/components.ts` - ActionConfig
- `packages/core/src/types/components.ts` - EventAction

### 2.2 优化方案

#### 方案 1: 统一为 NodeSchema (推荐)

```typescript
// packages/core/src/types/schema.ts - 唯一标准
export interface NodeSchema<P = Record<string, PropValue>> {
  id: string
  componentName: string
  props?: P
  style?: NodeStyle
  layoutMode?: LayoutMode
  children?: NodeSchema[]
  events?: Record<string, ActionSchema[]>
  dataBindings?: DataBinding[]
  animation?: AnimationConfig

  // 代码生成扩展
  condition?: boolean | JSExpression
  loop?: LoopConfig
  slotName?: string
  slotScope?: string
}
```

#### 方案 2: 创建统一 ActionSchema

```typescript
// packages/core/src/types/action.ts - 统一定义
export interface ActionSchema {
  id: string
  type: ActionType
  payload: ActionPayload
  delay?: number
}

export type ActionType =
  | 'navigate'      // 页面跳转
  | 'showMessage'   // 消息提示
  | 'updateState'   // 状态更新
  | 'apiCall'       // API 调用
  | 'customScript'  // 自定义脚本
  | 'emit'          // 事件发射

export type ActionPayload =
  | NavigatePayload
  | MessagePayload
  | StatePayload
  | ApiPayload
  | ScriptPayload
  | EmitPayload
```

### 2.3 实施任务

| 任务 | 优先级 | 工作量 | 文件 |
|------|--------|--------|------|
| ~~删除 `core/types/components.ts` 中的旧 Component~~ | P0 | ~~0.5 天~~ ✅ 已完成 | 标记为 deprecated，保留迁移支持 |
| ~~更新 suggestion store 使用 NodeSchema~~ | P0 | ~~1 天~~ ✅ 已完成 | suggestion.ts, types/suggestion.ts |
| ~~统一 ActionSchema 定义~~ | P0 | ~~1 天~~ ✅ 已完成 | action.ts 已为统一来源 |
| 添加 Zod 验证 schema | P1 | 1 天 | 3 个 |
| 更新所有导入路径 | P1 | 0.5 天 | 20+ 个 |

---

## 3. 代码生成器升级

### 3.1 当前问题

#### 问题 A: React 生成器不完整

**缺失功能:**
- ❌ 复杂事件修饰符 (prevent, stop)
- ❌ 双向绑定 (v-model → controlled component)
- ❌ computed 属性生成
- ❌ watch → useEffect 转换
- ❌ 组件 ref 访问

#### 问题 B: 表达式编译无验证

```typescript
// 当前实现 - 无验证
function compileExpression(expr: JSExpression): string {
  return expr.value  // 直接返回，无语法检查
}
```

#### 问题 C: 生成代码无质量检查

- 无 AST 验证
- 无错误追溯
- 无增量生成

### 3.2 优化方案

#### 方案 1: 完善 React 生成器

```typescript
// packages/generator/src/generators/react-generator.ts

class ReactGenerator {
  // 新增: 事件修饰符处理
  private generateEventHandler(event: IREvent): string {
    const modifiers = event.modifiers || []
    let handler = event.handler

    if (modifiers.includes('prevent')) {
      handler = `(e) => { e.preventDefault(); ${handler}(e) }`
    }
    if (modifiers.includes('stop')) {
      handler = `(e) => { e.stopPropagation(); ${handler}(e) }`
    }

    return handler
  }

  // 新增: v-model 转换
  private generateControlledInput(prop: IRProp): string[] {
    return [
      `value={${prop.expression}}`,
      `onChange={(e) => set${capitalize(prop.name)}(e.target.value)}`
    ]
  }

  // 新增: computed → useMemo
  private generateMemo(computed: IRComputed): string {
    return `const ${computed.name} = useMemo(() => ${computed.expression}, [${computed.deps.join(', ')}])`
  }
}
```

#### 方案 2: 添加表达式验证

```typescript
// packages/generator/src/utils/expression-validator.ts
import { parse } from '@babel/parser'

export function validateExpression(expr: string): ValidationResult {
  try {
    parse(expr, { sourceType: 'module' })
    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: error.message,
      position: error.loc
    }
  }
}
```

### 3.3 实施任务

| 任务 | 优先级 | 工作量 | 文件 |
|------|--------|--------|------|
| ~~完成 React 事件处理~~ | P0 | ~~2 天~~ ✅ 已完成 | react-generator.ts |
| ~~添加 v-model 转换~~ | P0 | ~~1 天~~ ✅ 已完成 | react-generator.ts |
| ~~实现表达式验证~~ | P0 | ~~1 天~~ ✅ 已完成 | expression-validator.ts |
| 添加 AST 验证 | P1 | 1 天 | code-validator.ts |
| 错误追溯系统 | P1 | 2 天 | source-map.ts |

---

## 4. 编辑器架构重构

### 4.1 当前问题

#### 问题 A: component.ts 职责过重 (967 行)

**混杂的职责:**
1. 组件树管理
2. O(1) 索引缓存
3. 选中状态
4. 样式版本跟踪
5. 命令历史依赖

#### 问题 B: 样式更新使用 "黑科技"

```typescript
// 当前实现 - styleVersion 强制更新
const styleVersion = ref<Record<string, number>>({})

function updateStyle(id: string, style: NodeStyle): void {
  node.style = { ...node.style, ...style }  // 全量复制
  styleVersion.value[id]++  // 强制触发响应式
}
```

#### 问题 C: 命令系统缺乏异常处理

```typescript
// 当前实现 - 无 try-catch
function executeCommand(command: Command): void {
  command.execute()  // 异常会 crash
  undoStack.value.push(command)
}
```

### 4.2 优化方案

#### 方案 1: 拆分 component.ts

```
stores/
├── component/
│   ├── index.ts              # 统一导出
│   ├── useComponentTree.ts   # 树结构管理 (~200行)
│   ├── useComponentIndex.ts  # O(1) 索引 (~100行)
│   ├── useComponentSelection.ts  # 选中状态 (~150行)
│   └── useComponentStyle.ts  # 样式管理 (~200行)
```

#### 方案 2: 移除 styleVersion 黑科技

```typescript
// 使用 Pinia 的 $patch 或 Immer
import { produce } from 'immer'

function updateStyle(id: string, updates: Partial<NodeStyle>): void {
  const node = nodeIndex.get(id)
  if (!node) return

  // 使用 Immer 进行不可变更新
  node.style = produce(node.style, draft => {
    Object.assign(draft, updates)
  })
}
```

#### 方案 3: 命令系统异常处理

```typescript
// packages/editor/src/stores/history.ts
function executeCommand(command: Command, skipMerge = false): boolean {
  try {
    command.execute()
  } catch (error) {
    console.error('[Command] Execute failed:', error)
    // 尝试回滚
    if (command.undo) {
      try { command.undo() } catch {}
    }
    return false
  }

  // ... 其余逻辑
  return true
}
```

### 4.3 实施任务

| 任务 | 优先级 | 工作量 | 文件 |
|------|--------|--------|------|
| ~~拆分 component.ts~~ | P0 | ~~2-3 天~~ ✅ 已完成 | 5 个新文件 |
| 移除 styleVersion | P0 | 1 天 | component.ts |
| ~~命令异常处理~~ | P0 | ~~1 天~~ ✅ 已完成 | history.ts |
| 明确选中状态模型 | P1 | 0.5 天 | useComponentSelection.ts |
| 历史压缩功能 | P2 | 2 天 | history.ts |

---

## 5. 组件库完善

### 5.1 当前问题

#### 问题 A: Vue vs React 组件不对称

| 分类 | Vue (@vela/ui) | React (@vela/ui-react) | 缺失 |
|------|---------------|----------------------|------|
| 基础 | 8 个 | 8 个 | ✅ 完整 |
| 布局 | 10 个 | 10 个 | ✅ 完整 |
| 图表 | 10 个 | 1 个 (ReactECharts) | ❌ 9 个 |
| 表单 | 8 个 | 1 个 (Select) | ❌ 7 个 |
| 数据 | 5 个 | 2 个 | ❌ 3 个 |
| 地图 | ~~7 个~~ 0 个 ✅ 已删除 | 0 个 | ✅ 无需补全 |
| 高级 | 5 个 | 0 个 | ❌ 5 个 |

**React 库缺失组件清单:**
```
表单: MultiSelect, DateRange, SearchBox, CheckboxGroup, ButtonGroup, Slider, Switch
数据: CardGrid, Pivot, Timeline
~~地图: Base, Tile, Vector, GeoJSON, Marker, Cluster, Heat~~ ✅ 已删除地图组件类型定义
高级: Markdown, Html, Iframe, Scripting, State, Trigger
```

#### 问题 B: Material 元数据不统一

```typescript
// 分类重复别名
CATEGORY_CONFIG = {
  'KPI': { order: 2 },
  '数据展示': { order: 2 },  // 重复
  '基础组件': { order: 4 },
  '基础控件': { order: 4 },  // 重复
}
```

### 5.2 优化方案

#### 方案 1: 补全 React 组件库

**优先级排序:**
1. 表单组件 (高频使用)
2. 数据组件 (业务核心)
3. 图表组件 (已有 ECharts 基础)
4. 地图组件 (需要专门封装)
5. 高级组件 (低优先级)

**示例: DateRange 组件**

```tsx
// packages/ui-react/src/components/DateRange.tsx
import React, { forwardRef, useState } from 'react'

export interface DateRangeProps {
  value?: [Date, Date]
  onChange?: (range: [Date, Date]) => void
  format?: string
  placeholder?: [string, string]
  disabled?: boolean
}

export const DateRange = forwardRef<HTMLDivElement, DateRangeProps>(
  ({ value, onChange, format = 'YYYY-MM-DD', placeholder, disabled }, ref) => {
    // 实现...
  }
)
```

#### 方案 2: 统一 Material 系统

```typescript
// packages/materials/src/metadata-registry.ts - 单一来源

export const MaterialRegistry = {
  categories: {
    chart: { order: 1, label: '图表', defaultSize: [320, 200] },
    kpi: { order: 2, label: 'KPI', defaultSize: [160, 100] },
    data: { order: 3, label: '数据', defaultSize: [360, 240] },
    form: { order: 4, label: '表单', defaultSize: [200, 40] },
    layout: { order: 5, label: '布局', defaultSize: [400, 300] },
    media: { order: 6, label: '媒体', defaultSize: [320, 180] },
    advanced: { order: 7, label: '高级', defaultSize: [400, 300] },
  },

  aliases: {
    KpiText: 'Text',
    KpiProgress: 'Progress',
    // ... 集中管理
  },

  register(meta: MaterialMeta): void { /* ... */ },
  get(name: string): MaterialMeta | undefined { /* ... */ },
  list(category?: string): MaterialMeta[] { /* ... */ },
}
```

### 5.3 实施任务

| 任务 | 优先级 | 工作量 | 文件 |
|------|--------|--------|------|
| ~~补全表单组件 (7个)~~ | P0 | ~~3 天~~ ✅ 已完成 | ui-react/components |
| ~~补全数据组件 (3个)~~ | P0 | ~~2 天~~ ✅ 已完成 | ui-react/components |
| 补全图表组件 (9个) | P1 | 3 天 | ui-react/components |
| ~~创建 MaterialRegistry~~ | P1 | ~~2 天~~ ✅ 已完成 | materials/metadata-registry.ts |
| ~~补全地图组件~~ 删除地图组件 | P2 | ~~5 天~~ ✅ 已完成 | ~~ui-react/components~~ ui/types/gis.ts 已删除 |
| 补全高级组件 | P2 | 3 天 | ui-react/components |

---

## 6. 运行时渲染优化

### 6.1 当前问题

#### 问题 A: 事件执行类型混乱

```typescript
// useEventExecutor.ts 定义了自己的 EventAction
interface EventAction {
  type: string
  targetId?: string
  url?: string      // ← 与 path 冲突
  path?: string     // ← 与 url 冲突
  blank?: boolean   // ← 与 openInNewTab 冲突
  openInNewTab?: boolean
}
```

#### 问题 B: 数据绑定与数据源未集成

```typescript
// useComponentDataSource.ts - 加载数据
async function loadDataSource(config): Promise<unknown> {
  const data = await fetch(config.url)
  return data  // ❌ 没有触发 DataBinding
}

// DataBinding 系统独立运行
// 两者没有协调
```

#### 问题 C: 样式计算每次全量重算

```typescript
// useComponentStyle.ts
const computedStyle = computed(() => {
  return {
    position: 'absolute',
    left: `${style.x}px`,
    // ... 30+ 行，每次都重新计算
  }
})
```

### 6.2 优化方案

#### 方案 1: 使用统一 ActionSchema

```typescript
// packages/renderer/src/runtime/useEventExecutor.ts
import type { ActionSchema } from '@vela/core'

export function useEventExecutor() {
  function execute(action: ActionSchema): void {
    switch (action.type) {
      case 'navigate':
        handleNavigate(action.payload as NavigatePayload)
        break
      case 'showMessage':
        handleMessage(action.payload as MessagePayload)
        break
      // ...
    }
  }

  return { execute }
}
```

#### 方案 2: 集成数据绑定

```typescript
// packages/renderer/src/runtime/useDataBindingEngine.ts
export function useDataBindingEngine(rootNode: Ref<NodeSchema>) {
  const dataCache = new Map<string, unknown>()

  // 监听数据源变化
  watch(() => getAllDataSources(rootNode.value), async (sources) => {
    for (const [id, config] of sources) {
      const data = await loadDataSource(config)
      dataCache.set(id, data)

      // 触发所有相关的数据绑定
      applyBindings(id, data, rootNode.value)
    }
  })

  return { dataCache }
}
```

#### 方案 3: 样式计算缓存

```typescript
// packages/renderer/src/composables/useComponentStyle.ts
export function useComponentStyle(node: Ref<NodeSchema>) {
  // 分离计算，只在相关属性变化时重算
  const positionStyle = computed(() => ({
    position: 'absolute',
    left: `${node.value.style?.x}px`,
    top: `${node.value.style?.y}px`,
  }))

  const sizeStyle = computed(() => ({
    width: `${node.value.style?.width}px`,
    height: `${node.value.style?.height}px`,
  }))

  const visualStyle = computed(() => ({
    backgroundColor: node.value.style?.backgroundColor,
    // ... 其他视觉属性
  }))

  // 合并时使用 memo
  const computedStyle = computed(() => ({
    ...positionStyle.value,
    ...sizeStyle.value,
    ...visualStyle.value,
  }))

  return { computedStyle }
}
```

### 6.3 实施任务

| 任务 | 优先级 | 工作量 | 文件 |
|------|--------|--------|------|
| 使用统一 ActionSchema | P0 | 1 天 | useEventExecutor.ts |
| ~~集成数据绑定引擎~~ | P0 | ~~2 天~~ ✅ 已完成 | useDataBindingEngine.ts |
| ~~样式计算缓存优化~~ | P1 | ~~1 天~~ ✅ 已完成 | useComponentStyle.ts |
| 定义清晰的运行时模式 | P1 | 0.5 天 | types.ts |
| 添加运行时 DevTools | P2 | 3 天 | devtools/ |

---

## 7. 构建与发布配置

### 7.1 当前问题

#### 问题 A: 包导出配置不正确

| 包 | 问题 |
|----|------|
| @vela/generator | exports 指向源码，非 dist |
| @vela/materials | 无 exports 配置 |
| @vela/renderer | exports 不完整 |

#### 问题 B: 无构建流程

```json
// generator/package.json - 当前
{
  "exports": {
    ".": "./src/index.ts"  // ❌ 指向源码
  }
}
```

#### 问题 C: 测试和 CI 缺失

- 0 个单元测试
- 无 pre-commit hooks
- CI 只有基础检查

### 7.2 优化方案

#### 方案 1: 修复包配置

```json
// packages/generator/package.json - 修复后
{
  "name": "@vela/generator",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./project": {
      "import": "./dist/projectGenerator.mjs",
      "require": "./dist/projectGenerator.js"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts src/projectGenerator.ts --format esm,cjs --dts",
    "dev": "tsup --watch"
  }
}
```

#### 方案 2: 添加测试框架

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/dist/**'],
    },
  },
})
```

#### 方案 3: Pre-commit hooks

```json
// package.json
{
  "scripts": {
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{ts,tsx,vue}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

### 7.3 实施任务

| 任务 | 优先级 | 工作量 | 文件 |
|------|--------|--------|------|
| ~~修复 generator package.json~~ | P0 | ~~0.5 天~~ ✅ 已完成 | package.json + tsup.config.ts |
| ~~修复 materials package.json~~ | P0 | ~~0.5 天~~ ✅ 已完成 | package.json + vite.config.ts |
| ~~修复 renderer package.json~~ | P0 | ~~0.5 天~~ ✅ 已完成 | package.json + vite.config.ts |
| ~~添加 tsup 构建~~ | P0 | ~~1 天~~ ✅ 已完成 | generator:tsup, materials/renderer:vite |
| ~~配置 vitest~~ | P1 | ~~1 天~~ ✅ 已完成 | vitest.config.ts |
| 添加核心模块测试 | P1 | 3 天 | tests/ |
| ~~配置 husky + lint-staged~~ | P2 | ~~0.5 天~~ ✅ 已完成 | 配置文件 |
| ~~完善 CI/CD~~ | P2 | ~~1 天~~ ✅ 已完成 | .github/workflows |

---

## 8. 实施计划

### 8.1 阶段划分

```
Phase 1: 基础修复 (第 1-2 周)
├── 🔴 P0 任务
│   ├── 修复包构建配置
│   ├── 类型系统统一
│   └── 命令异常处理
│
Phase 2: 核心完善 (第 3-4 周)
├── 🔴 P0 + 🟠 P1 任务
│   ├── React 生成器完善
│   ├── React 组件库补全
│   ├── Store 重构
│   └── 数据绑定集成
│
Phase 3: 优化提升 (第 5-6 周)
├── 🟠 P1 + 🟡 P2 任务
│   ├── 性能优化
│   ├── 测试框架
│   ├── 文档完善
│   └── CI/CD 完善
│
Phase 4: 高级功能 (第 7-8 周)
├── 🟡 P2 任务
│   ├── DevTools
│   ├── 增量生成
│   └── 地图/高级组件
```

### 8.2 详细时间线

#### Phase 1: 基础修复 (第 1-2 周)

| 天 | 任务 | 负责 | 交付物 |
|----|------|------|--------|
| ~~D1~~ | ~~修复 generator/materials/renderer package.json~~ ✅ 已完成 | 基建 | 3 个 package.json |
| ~~D2~~ | ~~添加构建配置~~ ✅ 已完成 | 基建 | generator:tsup + materials/renderer:vite |
| ~~D3-D4~~ | ~~删除旧 Component 类型，统一 ActionSchema~~ ✅ 已完成 | 架构 | types/ 重构 |
| ~~D5-D6~~ | ~~更新 suggestion store 使用 NodeSchema~~ ✅ 已完成 | 前端 | suggestion.ts |
| ~~D7~~ | ~~命令系统异常处理~~ ✅ 已完成 | 前端 | history.ts |
| ~~D8-D9~~ | ~~添加表达式验证~~ ✅ 已完成 | 生成器 | expression-validator.ts |
| D10 | 集成测试 & bug 修复 | 全员 | - |

**里程碑:** 所有包可发布到 npm，类型系统统一

#### Phase 2: 核心完善 (第 3-4 周)

| 天 | 任务 | 负责 | 交付物 |
|----|------|------|--------|
| ~~D11-D13~~ | ~~React 生成器完善 (事件、hooks)~~ ✅ 已完成 | 生成器 | react-generator.ts |
| ~~D14-D16~~ | ~~补全 React 表单组件 (7个)~~ ✅ 已完成 | 前端 | ui-react/components |
| ~~D17-D18~~ | ~~补全 React 数据组件 (3个)~~ ✅ 已完成 | 前端 | ui-react/components |
| ~~D19-D21~~ | ~~拆分 component.ts~~ ✅ 已完成 | 架构 | stores/component/ |
| ~~D22-D23~~ | ~~集成数据绑定引擎~~ ✅ 已完成 | 运行时 | useDataBindingEngine.ts |
| D24-D25 | 集成测试 & bug 修复 | 全员 | - |

**里程碑:** React 功能完整，编辑器可维护性提升

#### Phase 3: 优化提升 (第 5-6 周)

| 天 | 任务 | 负责 | 交付物 |
|----|------|------|--------|
| ~~D26-D27~~ | ~~样式计算缓存优化~~ ✅ 已完成 | 运行时 | useComponentStyle.ts |
| ~~D28-D30~~ | ~~统一 Material 注册系统~~ ✅ 已完成 | 架构 | metadata-registry.ts |
| ~~D31-D33~~ | ~~配置 vitest + 核心模块测试~~ ✅ 已完成 | 测试 | tests/ |
| ~~D34~~ | ~~配置 husky + lint-staged~~ ✅ 已完成 | 基建 | 配置文件 |
| ~~D35-D36~~ | ~~编写架构文档~~ ✅ 已完成 | 文档 | ARCHITECTURE.md |
| ~~D37-D38~~ | ~~完善 CI/CD~~ ✅ 已完成 | 基建 | .github/workflows |

**里程碑:** 性能优化完成，测试覆盖率 >60%

#### Phase 4: 高级功能 (第 7-8 周)

| 天 | 任务 | 负责 | 交付物 |
|----|------|------|--------|
| ~~D39-D41~~ | ~~运行时 DevTools~~ ✅ 已完成 | 运行时 | devtools/ |
| ~~D42-D43~~ | ~~代码生成 AST 验证~~ ✅ 已完成 | 生成器 | code-validator.ts |
| ~~D44-D48~~ | ~~补全地图组件 (7个)~~ ✅ 已删除地图组件 | 前端 | ~~ui-react/components~~ 完成 |
| D49-D51 | 补全高级组件 (5个) | 前端 | ui-react/components |
| D52-D55 | 增量生成支持 | 生成器 | incremental-generator.ts |
| D56 | 最终集成测试 | 全员 | - |

**里程碑:** 生产就绪

### 8.3 资源分配建议

```
Team Structure (3 人):
├── 架构工程师 (1人)
│   ├── 类型系统统一
│   ├── Store 重构
│   └── Material 系统
│
├── 全栈工程师 (1人)
│   ├── React 生成器
│   ├── React 组件库
│   └── 运行时优化
│
└── 基建/测试工程师 (1人)
    ├── 构建配置
    ├── 测试框架
    └── CI/CD
```

### 8.4 风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 类型迁移破坏现有功能 | 中 | 高 | 保留兼容层，渐进式迁移 |
| React 组件与 Vue 不一致 | 中 | 中 | 创建共享的 Props 类型定义 |
| 性能优化引入新 bug | 低 | 中 | 完善测试后再优化 |
| 时间估计不准确 | 高 | 中 | 每周回顾，动态调整 |

---

## 附录

### A. 文件修改清单

<details>
<summary>点击展开完整文件列表</summary>

**Phase 1:**
- ~~`packages/generator/package.json`~~ ✅ 已完成
- ~~`packages/materials/package.json`~~ ✅ 已完成
- ~~`packages/renderer/package.json`~~ ✅ 已完成
- ~~`packages/generator/tsup.config.ts` (新建)~~ ✅ 已完成
- ~~`packages/materials/vite.config.ts` (新建)~~ ✅ 已完成 (使用 vite 而非 tsup)
- ~~`packages/renderer/vite.config.ts` (新建)~~ ✅ 已完成
- `packages/core/src/types/components.ts` (删除/重构)
- `packages/core/src/types/action.ts` (重构)
- `packages/editor/src/stores/suggestion.ts` (重构)
- `packages/editor/src/stores/history.ts` (重构)
- `packages/generator/src/utils/expression-validator.ts` (新建)

**Phase 2:**
- `packages/generator/src/generators/react-generator.ts` (完善)
- ~~`packages/ui-react/src/components/MultiSelect.tsx` (新建)~~ ✅ 已完成
- ~~`packages/ui-react/src/components/DateRange.tsx` (新建)~~ ✅ 已完成
- ~~`packages/ui-react/src/components/SearchBox.tsx` (新建)~~ ✅ 已完成
- ~~`packages/ui-react/src/components/CheckboxGroup.tsx` (新建)~~ ✅ 已完成
- ~~`packages/ui-react/src/components/ButtonGroup.tsx` (新建)~~ ✅ 已完成
- ~~`packages/ui-react/src/components/Slider.tsx` (新建)~~ ✅ 已完成
- ~~`packages/ui-react/src/components/Switch.tsx` (新建)~~ ✅ 已完成
- ~~`packages/ui-react/src/components/CardGrid.tsx` (新建)~~ ✅ 已完成
- ~~`packages/ui-react/src/components/Pivot.tsx` (新建)~~ ✅ 已完成
- ~~`packages/ui-react/src/components/Timeline.tsx` (新建)~~ ✅ 已完成
- ~~`packages/editor/src/stores/component/` (新目录)~~ ✅ 已完成
- ~~`packages/renderer/src/runtime/useDataBindingEngine.ts` (重构)~~ ✅ 已完成

**Phase 3:**
- `packages/renderer/src/composables/useComponentStyle.ts` (优化)
- `packages/materials/src/metadata-registry.ts` (新建)
- `vitest.config.ts` (新建)
- `packages/core/tests/` (新目录)
- `packages/generator/tests/` (新目录)
- `.husky/` (新目录)
- `ARCHITECTURE.md` (新建)
- `.github/workflows/ci.yml` (完善)

**Phase 4:**
- `packages/renderer/src/devtools/` (新目录)
- `packages/generator/src/utils/code-validator.ts` (新建)
- ~~`packages/ui-react/src/components/map/` (新目录)~~ ✅ 已删除地图组件，不再需要
- `packages/generator/src/incremental-generator.ts` (新建)

</details>

### B. 命令速查

```bash
# 开发
pnpm dev                    # 启动开发服务器
pnpm build                  # 构建所有包
pnpm test                   # 运行测试
pnpm type-check             # 类型检查

# 发布
pnpm -F @vela/ui-react build && npm publish packages/ui-react --access public
pnpm -F @vela/generator build && npm publish packages/generator --access public

# 质量检查
pnpm lint                   # ESLint 检查
pnpm lint --fix             # 自动修复
pnpm test:coverage          # 测试覆盖率
```

---

**文档版本:** 1.0
**最后更新:** 2026-02-01
**维护者:** Vela Team
