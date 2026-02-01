# Vela 低代码平台 - 架构文档

> 版本: 1.0
> 最后更新: 2026-02-01

---

## 目录

1. [概述](#1-概述)
2. [整体架构](#2-整体架构)
3. [包结构](#3-包结构)
4. [核心概念](#4-核心概念)
5. [数据流](#5-数据流)
6. [状态管理](#6-状态管理)
7. [代码生成](#7-代码生成)
8. [运行时渲染](#8-运行时渲染)
9. [扩展指南](#9-扩展指南)

---

## 1. 概述

Vela 是一个现代化的低代码平台，采用 Monorepo 架构，支持可视化编辑和多框架代码生成。

### 1.1 核心特性

- **可视化编辑**: 拖拽式组件编排，实时预览
- **多框架生成**: 支持 Vue 3 和 React 代码生成
- **IR 中间表示**: 框架无关的中间层设计
- **类型安全**: 全栈 TypeScript，端到端类型推导
- **命令模式**: 完整的撤销/重做支持

### 1.2 技术栈

| 层级 | 技术选型 |
|------|----------|
| 前端框架 | Vue 3 + Composition API |
| 状态管理 | Pinia |
| UI 组件库 | Element Plus |
| 构建工具 | Vite / tsup |
| 包管理 | pnpm workspace |
| 测试框架 | Vitest |

---

## 2. 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        编辑器 (Editor)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ MaterialPanel│  │   Canvas    │  │    SetterPanel      │  │
│  │  (物料面板)  │  │   (画布)    │  │   (属性配置面板)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Stores (状态管理)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ component │  │  project │  │  history │  │    ui    │    │
│  │   Store   │  │   Store  │  │   Store  │  │   Store  │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└───────────────────────────┬─────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
│   @vela/core │  │ @vela/materials│ │  @vela/generator │
│  (类型/工具)  │  │   (物料组件)   │  │   (代码生成器)   │
└──────────────┘  └──────────────┘  └──────────────────┘
          │                                   │
          ▼                                   ▼
┌──────────────┐                    ┌──────────────────┐
│ @vela/renderer│                   │   生成的代码      │
│  (运行时渲染) │                   │  (Vue/React)     │
└──────────────┘                    └──────────────────┘
```

---

## 3. 包结构

```
packages/
├── core/           # 核心类型定义和工具函数
├── editor/         # 可视化编辑器
├── generator/      # 代码生成器
├── materials/      # 物料组件 (Vue)
├── renderer/       # 运行时渲染器
├── ui/             # Vue UI 组件库
└── ui-react/       # React UI 组件库
```

### 3.1 @vela/core

核心包，提供类型定义和共享工具。

```typescript
// 主要导出
export * from './types'      // NodeSchema, ActionSchema, etc.
export * from './utils'      // generateId, TreeIndex, etc.
export * from './constants'  // 常量定义
export * from './model'      // 数据模型
export * from './plugins'    // 插件系统
```

**关键类型：**

```typescript
// NodeSchema - 组件节点的核心数据结构
interface NodeSchema<P = Record<string, PropValue>> {
  id: string
  componentName: string
  props?: P
  style?: NodeStyle
  children?: NodeSchema[]
  events?: Record<string, ActionSchema[]>
  dataBindings?: DataBinding[]
  dataSource?: DataSourceConfig
}

// ActionSchema - 事件动作定义
interface ActionSchema {
  id: string
  type: ActionType
  payload: ActionPayload
}
```

### 3.2 @vela/editor

可视化编辑器，基于 Vue 3 构建。

```
editor/src/
├── components/
│   ├── Canvas/           # 画布组件
│   ├── MaterialPanel/    # 物料面板
│   ├── SetterPanel/      # 属性配置面板
│   └── Layout/           # 布局组件
├── stores/
│   ├── component/        # 组件树管理 (模块化)
│   ├── project.ts        # 项目管理
│   ├── history.ts        # 历史记录
│   └── ui.ts             # UI 状态
├── composables/          # 组合式函数
└── commands/             # 命令模式实现
```

### 3.3 @vela/generator

代码生成器，支持多框架输出。

```
generator/src/
├── generators/
│   ├── vue-generator.ts    # Vue 代码生成
│   └── react-generator.ts  # React 代码生成
├── ir/                     # 中间表示
├── utils/
│   └── expression-validator.ts  # 表达式验证
└── projectGenerator.ts     # 项目脚手架生成
```

### 3.4 @vela/materials

物料组件库，包含所有可拖拽的组件。

```
materials/src/
├── basic/        # 基础组件 (Text, Button, Container)
├── chart/        # 图表组件 (LineChart, PieChart, etc.)
├── data/         # 数据组件 (Table, List, CardGrid)
├── form/         # 表单组件 (Select, Switch, etc.)
├── layout/       # 布局组件 (Row, Col, Flex, Grid)
├── advanced/     # 高级组件 (Iframe, Markdown, Html)
├── registry.ts   # 组件注册表
└── metadata-registry.ts  # 统一元数据管理
```

### 3.5 @vela/renderer

运行时渲染器，用于预览和生产环境。

```
renderer/src/
├── runtime/
│   ├── useEventExecutor.ts      # 事件执行
│   ├── useComponentDataSource.ts # 数据源处理
│   └── useDataBindingEngine.ts   # 数据绑定引擎
├── composables/
│   └── useComponentStyle.ts      # 样式计算
└── components/
    └── VelaRenderer.vue          # 渲染器组件
```

---

## 4. 核心概念

### 4.1 NodeSchema

组件的数据表示，是整个系统的核心数据结构。

```typescript
interface NodeSchema {
  id: string              // 唯一标识
  componentName: string   // 组件名称
  props?: object          // 组件属性
  style?: NodeStyle       // 样式配置
  children?: NodeSchema[] // 子节点
  events?: object         // 事件配置
  dataBindings?: array    // 数据绑定
  dataSource?: object     // 数据源配置
  condition?: expression  // 条件渲染
  loop?: LoopConfig       // 循环渲染
}
```

### 4.2 命令模式

所有对组件树的修改都通过命令执行，支持撤销/重做。

```typescript
interface Command {
  execute(): void
  undo(): void
  merge?(other: Command): boolean
}

// 可用命令
- AddComponentCommand      // 添加组件
- DeleteComponentCommand   // 删除组件
- MoveComponentCommand     // 移动组件
- UpdatePropsCommand       // 更新属性
- UpdateStyleCommand       // 更新样式
```

### 4.3 IR 中间表示

代码生成使用 IR 作为中间层，实现框架无关。

```typescript
interface IRNode {
  tag: string
  props: IRProp[]
  children: IRNode[]
  directives: IRDirective[]
  events: IREvent[]
}
```

---

## 5. 数据流

### 5.1 编辑时数据流

```
用户操作 → Command → ComponentStore → ProjectStore → 持久化
    ↓
HistoryStore (撤销/重做栈)
```

### 5.2 渲染时数据流

```
NodeSchema → Renderer → 组件实例
    ↓
DataSource → useComponentDataSource → props 注入
    ↓
DataBinding → useDataBindingEngine → 属性联动
```

### 5.3 代码生成数据流

```
NodeSchema → IR转换 → IRNode → Generator → 源代码
                        ↓
              表达式验证 (expression-validator)
```

---

## 6. 状态管理

### 6.1 Store 架构

采用模块化的 Pinia Store 设计。

```
stores/
├── component/              # 组件管理 (模块化)
│   ├── index.ts           # 主 Store
│   ├── useComponentIndex.ts    # O(1) 索引
│   ├── useComponentSelection.ts # 选中状态
│   ├── useComponentStyle.ts    # 样式管理
│   ├── useComponentTree.ts     # 树结构
│   └── useComponentClipboard.ts # 剪贴板
├── project.ts             # 项目管理
├── history.ts             # 历史记录
├── ui.ts                  # UI 状态
└── suggestion.ts          # AI 建议
```

### 6.2 组件索引

使用 Map 实现 O(1) 查找。

```typescript
// useComponentIndex.ts
const nodeIndex = new Map<string, NodeSchema>()   // id → node
const parentIndex = new Map<string, string>()     // childId → parentId

// O(1) 查找
function findNodeById(id: string): NodeSchema | null
function findParentNode(id: string): NodeSchema | null
function getNodeIndex(id: string): number
```

### 6.3 历史记录

命令模式实现的撤销/重做。

```typescript
// history.ts
interface HistoryStore {
  undoStack: Command[]
  redoStack: Command[]

  executeCommand(cmd: Command): boolean
  undo(): void
  redo(): void
  canUndo: boolean
  canRedo: boolean
}
```

---

## 7. 代码生成

### 7.1 生成流程

```
1. Schema 解析
   NodeSchema → 验证 → 规范化

2. IR 转换
   NodeSchema → IRNode (框架无关)

3. 代码生成
   IRNode → Vue/React 源代码

4. 后处理
   格式化 → Lint → 输出
```

### 7.2 Vue 生成器

```typescript
class VueGenerator {
  generate(schema: NodeSchema): string {
    // 1. 生成 template
    const template = this.generateTemplate(schema)

    // 2. 生成 script setup
    const script = this.generateScript(schema)

    // 3. 生成 style
    const style = this.generateStyle(schema)

    return `<template>${template}</template>
<script setup>${script}</script>
<style scoped>${style}</style>`
  }
}
```

### 7.3 React 生成器

```typescript
class ReactGenerator {
  generate(schema: NodeSchema): string {
    // 1. 生成 imports
    const imports = this.generateImports(schema)

    // 2. 生成组件函数
    const component = this.generateComponent(schema)

    // 3. 合并输出
    return `${imports}\n\n${component}`
  }

  // 特殊处理
  - v-model → controlled component
  - 事件修饰符 → wrapper function
  - computed → useMemo
  - watch → useEffect
}
```

---

## 8. 运行时渲染

### 8.1 渲染器组件

```vue
<template>
  <component
    :is="getComponent(node.componentName)"
    v-bind="mergedProps"
    :style="computedStyle"
    @[event]="handleEvent"
  >
    <VelaRenderer
      v-for="child in node.children"
      :key="child.id"
      :node="child"
    />
  </component>
</template>
```

### 8.2 数据源处理

```typescript
// useComponentDataSource.ts
function useComponentDataSource(component: Ref<NodeSchema>) {
  const { data } = useDataSource(component.value.dataSource)

  // 根据组件类型映射数据到 props
  const dataSourceProps = computed(() => {
    switch (component.value.componentName) {
      case 'Table': return { data: data.value }
      case 'Chart': return mapChartData(data.value)
      // ...
    }
  })

  return { dataSourceProps }
}
```

### 8.3 数据绑定引擎

```typescript
// useDataBindingEngine.ts
function useDataBindingEngine(components: Ref<NodeSchema[]>) {
  // 建立组件索引
  const compById = new Map(components.value.map(c => [c.id, c]))

  // 设置 watchers
  for (const target of components.value) {
    for (const binding of target.dataBindings) {
      watch(
        () => get(compById.get(binding.sourceId), binding.sourcePath),
        (value) => set(target, binding.targetPath, value)
      )
    }
  }
}
```

---

## 9. 扩展指南

### 9.1 添加新组件

1. 在 `materials/src/<category>/` 创建组件目录
2. 创建 `<Component>.vue` 实现
3. 创建 `index.ts` 导出元数据
4. 创建 `meta.ts` 定义属性配置

```typescript
// materials/src/form/newInput/index.ts
export default {
  name: 'NewInput',
  componentName: 'NewInput',
  category: 'form',
  title: { zh: '新输入框', en: 'New Input' },
  defaultSize: [200, 40],
  props: [
    { name: 'value', setter: 'StringSetter', defaultValue: '' },
    { name: 'placeholder', setter: 'StringSetter' },
  ],
}
```

### 9.2 添加新 Setter

1. 在 `editor/src/components/SetterPanel/setters/` 创建 Setter
2. 在 `setterRegistry.ts` 注册

```vue
<!-- MySetter.vue -->
<template>
  <input :value="modelValue" @input="emit('update:modelValue', $event.target.value)" />
</template>

<script setup>
defineProps(['modelValue'])
defineEmits(['update:modelValue'])
</script>
```

### 9.3 扩展代码生成

1. 在 `generator/src/generators/` 添加新生成器
2. 实现 `Generator` 接口

```typescript
class AngularGenerator implements Generator {
  generate(schema: NodeSchema): string {
    // 实现 Angular 代码生成
  }
}
```

---

## 附录

### A. 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| VITE_API_BASE | API 基础路径 | /api |
| VITE_ENABLE_MOCK | 启用 Mock | false |

### B. 常用命令

```bash
# 开发
pnpm dev           # 启动开发服务器
pnpm build         # 构建生产版本
pnpm type-check    # 类型检查

# 测试
pnpm test          # 运行测试 (watch 模式)
pnpm test:run      # 运行测试 (单次)
pnpm test:coverage # 测试覆盖率

# 代码质量
pnpm lint          # ESLint 检查
pnpm lint:fix      # 自动修复
pnpm format        # Prettier 格式化
```

### C. 目录约定

| 目录 | 用途 |
|------|------|
| `src/components/` | Vue 组件 |
| `src/composables/` | 组合式函数 |
| `src/stores/` | Pinia Store |
| `src/types/` | TypeScript 类型 |
| `src/utils/` | 工具函数 |
| `tests/` | 测试文件 |

---

**文档版本:** 1.0
**维护者:** Vela Team
