# Vela LowCode Editor - 架构解析与运行层分析报告

> 生成时间: 2026-02-01  
> 分析范围: Monorepo 全量 + 画布渲染/运行时/生成代码运行层  
> 版本: 1.1

---

## 目录

1. [概览](#1-概览)
2. [包结构与依赖](#2-包结构与依赖)
3. [画布渲染层（Editor）](#3-画布渲染层editor)
4. [运行时渲染层（@vela/renderer）](#4-运行时渲染层velarenderer)
5. [代码生成运行层（@vela/generator）](#5-代码生成运行层velagenerator)
6. [数据流总览](#6-数据流总览)
7. [事件执行与脚本安全](#7-事件执行与脚本安全)
8. [关键问题清单（聚焦画布与运行层）](#8-关键问题清单聚焦画布与运行层)
9. [结论与建议](#9-结论与建议)

---

## 1. 概览

Vela 采用 Monorepo 架构，核心以 `NodeSchema` 为统一数据协议，围绕“编辑器画布渲染 → 运行时渲染 → 代码生成运行层”三条链路展开。当前系统存在多套渲染/运行时实现并行的情况，导致事件、数据源与样式逻辑在不同层存在差异或重复。

本报告聚焦：

- **画布渲染链路**（Editor Canvas）
- **运行时渲染链路**（@vela/renderer）
- **生成代码运行层**（@vela/generator 输出产物）
- **数据流与事件流**的一致性与可维护性

---

## 2. 包结构与依赖

### 2.1 主要包职责

```
packages/
├── core/        # NodeSchema / ActionSchema / DataBinding 等核心协议与工具
├── editor/      # 低代码编辑器（画布/面板/命令/状态）
├── materials/   # 智能组件（连接 UI 与数据）
├── renderer/    # 运行时渲染与事件/数据执行引擎
├── generator/   # 代码生成（Vue/React）
├── ui/          # 纯 UI 组件库
├── ui-react/    # React UI 组件库
└── server/      # 后端服务
```

### 2.2 依赖关系（抽象）

```
editor ─┬─> core
        ├─> materials ─> ui ─> core
        ├─> renderer ─> materials/ui/core
        └─> generator ─> core (+ renderer runtime source)

renderer ─> materials/ui/core
generator ─> core (但仍使用 legacy Component 结构)
```

---

## 3. 画布渲染层（Editor）

### 3.1 主要模块

- `packages/editor/src/components/Canvas/CanvasBoard.vue`  
  画布入口，按模式切换（Free / Flow）。
- `packages/editor/src/components/Canvas/modes/Flow/FlowCanvas.vue`  
  流式模式主画布，负责缩放、拖放、选中与上下文菜单。
- `packages/editor/src/components/Canvas/UniversalRenderer.vue`  
  递归渲染节点，动态解析材料组件并渲染。
- `packages/editor/src/components/Canvas/modes/Flow/NodeWrapper.vue`  
  Flow 模式选择框、拖拽、缩放、空容器提示。
- `packages/editor/src/composables/useDataSourceAdapter.ts`  
  Editor 层数据源适配，将远程数据映射至组件 props。
- `packages/editor/src/stores/component/*`  
  组件树与索引系统（O(1) 查找、选中、样式版本等）。

### 3.2 画布渲染链路（Flow 模式）

```
MaterialPanel Drag
   ↓
FlowCanvas (drop/selection)
   ↓
ComponentStore (rootNode + nodeIndex)
   ↓
UniversalRenderer (递归)
   ↓
NodeWrapper (交互/选择/拖拽)
   ↓
Materials / UI 组件
```

### 3.3 画布数据/状态特征

- `rootNode` 为画布树根，`nodeIndex` / `parentIndex` 提供 O(1) 查找。
- `styleVersion` 作为“强制响应式更新”机制被多处订阅。
- Flow 模式中，选中/拖拽/缩放主要由 `NodeWrapper` 驱动。

### 3.4 关键差异与风险

- **Free 模式缺失**：`CanvasBoard.vue` 引用 `modes/Free/FreeCanvas.vue`，但当前仓库内不存在该文件。
- **上下文菜单缺失**：`FlowCanvas.vue` 引用 `modes/Free/ContextMenu/ContextMenu.vue`，文件不存在。
- **NodeWrapper 参数不一致**：`NodeWrapper` 依赖 `nodeId`，`UniversalRenderer` 未传递（可能导致选中、拖拽逻辑异常）。

---

## 4. 运行时渲染层（@vela/renderer）

### 4.1 Runtime Renderer 结构

- `RuntimeRenderer.vue`  
  - 接收 `rootNode`，深拷贝为 `localRootNode`。
  - 构建 `nodeIndex`，向插件系统暴露 `components`（平铺数组）。
- `RuntimeComponent.vue`  
  - 解析 materials 组件。
  - 合并样式与数据源 props。
  - 触发运行时事件并上报。
- 运行时插件  
  - `DataBindingPlugin` → `useDataBindingEngine`  
  - `EventExecutorPlugin` → `useEventExecutor`

### 4.2 运行时渲染链路

```
NodeSchema
   ↓
RuntimeRenderer (localRootNode + nodeIndex)
   ↓
RuntimeComponent (渲染/事件)
   ↓
Plugin: EventExecutor / DataBindingEngine
```

### 4.3 数据源与数据绑定

- `useComponentDataSource` 使用 `@vela/ui` 的 `useDataSource`（axios）。
- `useDataBindingEngine` 内部自建 `fetch` 加载逻辑，并支持定时刷新。
- 两套数据源逻辑并行存在，配置语义不完全一致（如 `interval` 单位）。

---

## 5. 代码生成运行层（@vela/generator）

### 5.1 生成链路

```
Editor Project (NodeSchema)
   ↓
projectGenerator.ts
   ↓
convertComponents()  // NodeSchema → legacy Component
   ↓
toCode.ts / schema-to-ir.ts
   ↓
Vue SFC + Runtime Hooks
   ↓
生成项目 (src/runtime/useEventExecutor.ts, useDataBindingEngine.ts)
```

### 5.2 运行层特征

- 生成页面中通过 `handleEvent_xxx` 代理调用 `executeAction`。
- 运行时 Hook 直接来自 `@vela/renderer` 源码（`?raw` 注入）。
- 当前生成的 `componentsData` 缺失 `dataSource` / `animation` 等字段，导致运行时逻辑不完整。
- 数据源请求调用 `useDataSource`，但缺乏统一的数据映射与联动机制。

---

## 6. 数据流总览

### 6.1 编辑器数据流

```
用户操作 → Command → ComponentStore → ProjectStore
                         ↓
                    UniversalRenderer → 画布渲染
```

### 6.2 运行时数据流

```
NodeSchema → RuntimeRenderer → RuntimeComponent
              ↓                 ↓
         DataBindingEngine   DataSource Adapter
              ↓                 ↓
         props/绑定更新 → 组件重新渲染
```

### 6.3 生成代码数据流

```
SFC 事件/生命周期 → useEventExecutor / useDataBindingEngine
                               ↓
                      运行时 DOM / 路由 / 数据联动
```

---

## 7. 事件执行与脚本安全

### 7.1 事件执行路径

- Editor：`useComponentEvents`（未接入）  
  当前未被引用，且 `provideComponentEvents` 使用了 `inject` 而非 `provide`。
- Runtime：`RuntimeComponent` → `RuntimeRenderer` → `EventExecutorPlugin`

### 7.2 Action 协议差异

| 层级 | 类型定义 | 事件名/字段 |
|------|----------|-------------|
| Core | `ActionSchema` (`payload` + legacy 字段) | `alert/openUrl/navigate/...` |
| Renderer | 自定义 `EventAction` | `toggle-visibility` 等 |
| Editor | `useComponentEvents` | `mouseenter/dblclick` 等 |
| Generator | `hover/doubleClick` | 直接 JSON 行为 |

**结论**：事件类型与字段存在多套定义，需统一。

### 7.3 自定义脚本安全性

`useEventExecutor` 使用 `new Function` 执行自定义脚本，但未真正隔离全局环境（可访问 `window` / `document`）。当前“沙箱”仅提供白名单，但未阻止全局作用域访问。

---

## 8. 关键问题清单（聚焦画布与运行层）

| 优先级 | 模块 | 问题 |
|------|------|------|
| P0 | Canvas | Free 模式与 ContextMenu 引用文件缺失 |
| P0 | Canvas | `NodeWrapper` 需要 `nodeId`，但 `UniversalRenderer` 未传递 |
| P0 | Events | 事件名与 Action 协议不统一（hover vs mouseenter / doubleClick vs dblclick） |
| P0 | Runtime | 自定义脚本沙箱无真实隔离 |
| P1 | Data | 数据源加载逻辑重复（axios vs fetch），配置含义不一致 |
| P1 | Generator | 生成运行层依赖 legacy Component，数据源/动画字段缺失 |
| P1 | Renderer | `useEventExecutor` 依赖 Element Plus，运行时耦合 UI 框架 |
| P2 | Performance | RuntimeRenderer 深拷贝 + nodeIndex 全量重建成本高 |
| P2 | Maintain | Editor/Renderer/Generator 三套渲染逻辑分叉 |

---

## 9. 结论与建议

当前架构核心能力齐全，但画布渲染层与运行层出现“多实现并行”与“协议漂移”。建议以 `NodeSchema + ActionSchema` 为唯一协议基线，统一事件名称、数据源、运行时 Hook，并将 Editor 预览渲染逐步收敛到 `@vela/renderer` 的组件渲染能力，从而降低维护成本与行为不一致风险。

详细优化步骤见：`OPTIMIZATION_PLAN.md`。
