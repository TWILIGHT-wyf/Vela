# Vela 低代码平台 - 画布与运行层优化升级计划

> 生成时间: 2026-02-01  
> 版本: 1.1  
> 聚焦范围: 画布渲染、运行时执行、生成代码运行层

---

## 目录

1. [目标与范围](#1-目标与范围)
2. [现状问题速览](#2-现状问题速览)
3. [优化策略与任务拆解](#3-优化策略与任务拆解)
4. [阶段与里程碑](#4-阶段与里程碑)
5. [验收标准](#5-验收标准)
6. [风险与缓解](#6-风险与缓解)

---

## 1. 目标与范围

**目标**：

- 保证画布渲染稳定可用（Free/Flow 模式一致、交互可用）。
- 统一运行时协议与事件系统（ActionSchema + 事件名规范）。
- 让生成代码运行层与 Editor/Renderer 行为一致。
- 降低渲染与数据流的重复实现，减少维护成本。

**范围**：

- `packages/editor`（Canvas/UniversalRenderer/交互）
- `packages/renderer`（RuntimeRenderer、EventExecutor、DataBindingEngine）
- `packages/generator`（输出运行层与 runtime hook）
- `packages/core`（ActionSchema / NodeSchema / DataSourceConfig）

---

## 2. 现状问题速览

1. **画布模块缺失**  
   `FreeCanvas` 与 `ContextMenu` 引用文件不存在，CanvasBoard 直接引用失效模块。

2. **渲染参数不一致**  
   `NodeWrapper` 依赖 `nodeId`，但 `UniversalRenderer` 未传递，导致 Flow 交互失效风险。

3. **事件协议漂移**  
   editor / renderer / generator 使用的事件名与 ActionSchema 字段不一致。

4. **运行时脚本安全**  
   `new Function` 未真正隔离全局对象，存在安全风险。

5. **数据源逻辑重复**  
   Editor/Renderer/Generator 存在多套数据源请求与映射逻辑，且 interval 单位不一致。

6. **生成代码运行层不完整**  
   生成的 `componentsData` 缺少 `dataSource` / `animation` 等字段，运行时行为缺失。

---

## 3. 优化策略与任务拆解

### P0（稳定性修复，1-2 周）

1. **修复画布模块断链**
   - 方案 A：补齐 `FreeCanvas` / `ContextMenu` 文件  
   - 方案 B：暂时移除 Free 模式入口，保持 Flow 模式稳定  
   - 相关文件：  
     - `packages/editor/src/components/Canvas/CanvasBoard.vue`  
     - `packages/editor/src/components/Canvas/modes/Flow/FlowCanvas.vue`

2. **修复 Flow 渲染参数**
   - 在 `UniversalRenderer.vue` 向 wrapper 传入 `nodeId`  
   - 保障 `NodeWrapper` 的选中/拖拽逻辑可用  
   - 文件：  
     - `packages/editor/src/components/Canvas/UniversalRenderer.vue`  
     - `packages/editor/src/components/Canvas/modes/Flow/NodeWrapper.vue`

3. **统一事件名与 ActionSchema**
   - 统一事件名：`click` / `hover` / `doubleClick`  
   - 统一 ActionSchema 使用 `payload`，保留 legacy 兼容  
   - 文件：  
     - `packages/core/src/types/action.ts`  
     - `packages/renderer/src/runtime/useEventExecutor.ts`  
     - `packages/generator/src/transformer/schema-to-ir.ts`  
     - `packages/editor/src/composables/useComponentEvents.ts`

4. **修复 Editor 事件提供者**
   - `provideComponentEvents` 使用 `provide` 而非 `inject`  
   - 若未使用，建议删除并改用 Renderer 事件体系  
   - 文件：`packages/editor/src/composables/useComponentEvents.ts`

5. **修正 DataSource interval 语义**
   - Core 统一 `interval` 单位（建议秒）  
   - Renderer/DataSource 统一处理  
   - 文件：  
     - `packages/core/src/types/schema.ts`  
     - `packages/renderer/src/runtime/useDataBindingEngine.ts`  
     - `packages/ui/src/hooks/useDataSource.ts`

6. **补齐生成运行层字段**
   - `componentsData` 增加 `dataSource` / `animation` / `events`  
   - 确保 `useEventExecutor` / `useDataBindingEngine` 可完整运行  
   - 文件：`packages/generator/src/toCode.ts`

### Step 1（已开始执行：布局统一与基础渲染收敛）

- ✅ 画布入口收敛到 Flow（移除失效 FreeCanvas 引用）
- ✅ Flow 右键菜单补齐（ContextMenu）
- ✅ UniversalRenderer 传递 `nodeId` 与 `parentLayoutMode`
- ✅ NodeWrapper 支持父容器布局模式（free/flow）
- ✅ 容器级 `layoutMode` 开关（StylePaneEnhanced）
- ✅ 新增 `update-layout-mode` 命令（支持撤销）
- ✅ Free 容器内 drop 支持 `x/y` 落点定位
- ✅ layoutConverter 改为 `x/y` 语义并支持父布局继承
- ✅ 页面布局切换时进行树转换与布局同步
- ✅ 修复 `extractDefaultProps` 多重导出冲突

**Step 1 目标已完成**：完成布局语义统一 + 渲染入口收敛，为后续交互统一做铺垫。

**Step 2（执行中：交互层统一）**：
- ✅ `useTransform` 支持自定义坐标上下文（用于容器内自由布局）
- ✅ 交互层切回独立 SelectionLayer（渲染与交互分离）
- ✅ Flow 渲染仍由 NodeWrapper 承载，交互叠加在 SelectionLayer
- ✅ free 子节点禁用 HTML5 drag，避免与自由拖拽冲突
- ✅ free 节点旋转样式落到 wrapper（transform/rotate）
- ⏳ 交互体验细化（拖拽阈值/多选框/对齐辅助吸附优化）

---

### P1（统一架构与行为，2-4 周）

1. **统一运行时执行协议**
   - Renderer 事件执行器改用 `ActionSchema`  
   - 通过 Action Registry 处理 action type → handler
   - 文件：`packages/renderer/src/runtime/useEventExecutor.ts`

2. **数据源与数据绑定合并**
   - 统一数据源加载逻辑（建议复用 `@vela/ui` 的 `useDataSource`）  
   - DataBindingEngine 可从数据源 cache 同步数据  
   - 文件：  
     - `packages/renderer/src/runtime/useDataBindingEngine.ts`  
     - `packages/renderer/src/runtime/useComponentDataSource.ts`

3. **生成代码与 Renderer 对齐**
   - Generator 输出采用 Renderer 的 runtime API  
   - 或直接输出 `RuntimeRenderer` 使用方式，减少重复逻辑  
   - 文件：`packages/generator/src/projectGenerator.ts`

4. **脚本沙箱安全升级**
   - Proxy + `with` 安全沙箱  
   - 或 iframe/worker 隔离执行  
   - 替换现有 `new Function` 直接执行  
   - 文件：`packages/renderer/src/runtime/useEventExecutor.ts`

5. **Renderer 去 UI 依赖**
   - 把 `ElMessage` 替换为可注入的 `notify` 接口  
   - 便于 Runtime 独立运行  
   - 文件：`packages/renderer/src/runtime/useEventExecutor.ts`

---

### P2（性能与体验优化，4-6 周）

1. **渲染性能**
   - 大树渲染使用 `v-memo` 或分片渲染  
   - 组件列表虚拟化（表格/列表）  
   - RuntimeRenderer 避免全量 `nodeIndex` 重建  
   - 文件：`packages/renderer/src/runtime/RuntimeRenderer.vue`

2. **编辑器与运行时渲染复用**
   - Editor 预览模式复用 Renderer 组件  
   - 通过 wrapper/overlay 叠加编辑交互  
   - 目标：减少三套渲染逻辑分叉

3. **数据流可观测性**
   - 运行时 DevTools：事件追踪、绑定链路图  
   - 定位数据流问题更直观  
   - 文件：`packages/renderer/src/devtools/*`

---

### P3（扩展与生态，6-8 周）

1. **React 运行层一致性**
   - React 运行时引擎与事件执行器对齐  
   - 生成器提供同等运行层支持  

2. **插件化运行时**
   - 事件 / 数据 / 动画 插件化  
   - 支持用户注入自定义运行时行为

---

## 4. 阶段与里程碑

| 阶段 | 时间 | 交付物 |
|------|------|--------|
| Phase 1 | 第 1-2 周 | 画布稳定、事件与数据源基础修复 |
| Phase 2 | 第 3-4 周 | 运行时协议统一、生成层对齐 |
| Phase 3 | 第 5-6 周 | 性能优化与渲染复用 |
| Phase 4 | 第 7-8 周 | React 运行层与插件化 |

---

## 5. 验收标准

1. 画布在 Flow / Free 模式均可渲染并完成拖拽、选中、缩放。
2. 事件配置在 Editor / Runtime / Generator 三层行为一致。
3. 数据源配置在运行时可正确请求、绑定并反映到组件 props。
4. 自定义脚本无法访问 `window/document` 等危险对象。
5. 大型页面渲染性能可控（无明显卡顿）。

---

## 6. 风险与缓解

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| 协议统一导致旧数据不兼容 | 中 | 高 | 保留 legacy 兼容层 |
| 运行时沙箱影响功能 | 中 | 中 | 提供白名单 API 与可选降级 |
| 渲染复用导致编辑器交互异常 | 低 | 中 | 先做 preview 模式试点 |
| 生成层调整破坏已有模板 | 中 | 中 | 提供兼容转换函数 |

---

**建议优先执行 P0 任务，确保画布与运行时稳定，再进行 P1/P2 优化。**
