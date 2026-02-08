# 代码生成器架构设计（基于当前 Core 协议）

## 1. 设计目标

基于当前 `@vela/core` 的协议，重构 `@vela/generator`，实现：

1. 以 `ProjectSchema/PageSchema/NodeSchema` 为唯一输入契约。
2. 对 `free/flow` 双布局模型进行可预测代码生成。
3. 支持 Vue3/React 双端输出，且共享同一套中间语义层（IR）。
4. 生成结果可用于“继续开发”的工程化项目，而非仅演示页面。

---

## 2. 现状与问题（关键差异）

当前 `core` 协议已经完成新的布局与语义建模：

1. 节点协议：`NodeSchema`（`component/geometry/container/renderIf/repeat/responsive`）  
   见 `packages/core/src/types/schema.ts:258`、`packages/core/src/types/schema.ts:296`、`packages/core/src/types/schema.ts:385`
2. 页面协议：`PageSchema` 判别联合 + `PageConfig.defaultLayoutMode/canvas/runtime`  
   见 `packages/core/src/types/page.ts:448`、`packages/core/src/types/page.ts:293`
3. 项目协议：`ProjectSchema` + `RouterConfig(PageRef)`  
   见 `packages/core/src/types/project.ts:549`、`packages/core/src/types/project.ts:70`
4. 布局协议：`LayoutMode/NodeGeometry/NodeContainerLayout/PageCanvasConfig`  
   见 `packages/core/src/types/layout.ts:52`、`packages/core/src/types/layout.ts:92`

而当前生成器仍使用旧组件模型，存在协议断层：

1. 生成输入仍是旧 `Component(position/size/loop/condition)`  
   见 `packages/generator/src/components.ts:39`、`packages/generator/src/components.ts:43`、`packages/generator/src/components.ts:68`
2. 旧导出流程仍依赖 `componentName -> type` 兼容转换  
   见 `packages/generator/src/projectGenerator.ts:27`、`packages/generator/src/projectGenerator.ts:37`
3. IR 转换仍以 `comp.position/comp.size/comp.loop` 为核心  
   见 `packages/generator/src/transformer/schema-to-ir.ts:111`、`packages/generator/src/transformer/schema-to-ir.ts:117`、`packages/generator/src/transformer/schema-to-ir.ts:190`
4. 入口 API 与 `core` 未对齐（`generateCode(components)` 而非 `ProjectSchema`）  
   见 `packages/generator/src/codeGenerator.ts:91`、`packages/generator/src/codeGenerator.ts:130`

结论：生成器需要“协议驱动重建”，而不是继续在旧模型上打补丁。

---

## 3. 总体架构（Pipeline）

采用 6 层流水线：

1. `Input Layer`（输入层）
2. `Validation Layer`（校验层）
3. `Normalization Layer`（规范化层）
4. `IR Builder`（语义中间层）
5. `Emitter Layer`（框架发射层）
6. `Project Assembler`（工程装配层）

### 3.1 数据流

```text
ProjectSchema
  -> validate()
  -> normalize()
  -> buildCompileGraph()
  -> buildIR()
  -> emit(vue3|react)
  -> assembleProjectFiles()
  -> FileManifest[]
```

---

## 4. 分层设计

## 4.1 Input Layer

统一入口：

1. `generateFromProject(project: ProjectSchema, options)`
2. `generateFromPage(page: PageSchema, projectContext, options)`（调试/局部生成）
3. `generateFromNode(root: NodeSchema, pageContext, options)`（组件片段生成）

输入只接受 `@vela/core` 类型，不再接受旧 `Component` 模型。

## 4.2 Validation Layer

职责：

1. 结构合法性校验（zod + 语义校验）
2. 引用完整性校验（页面路由、动作引用、API 引用、变量路径）

建议实现：

1. 复用 `@vela/core/validation` 的 `NodeZodSchema` 等基础校验
2. 增补 `ProjectSchema` 级别生成前校验（当前 `PageSchema` 在 zod 中仍较宽松，需加约束）
3. 汇总为 `CompileDiagnostic[]`（error/warn/info）

## 4.3 Normalization Layer

把协议数据转换为“生成友好结构”，核心动作：

1. 统一字段与默认值
2. 解析布局继承链（父容器 `container.mode` -> 子节点）
3. 解析页面默认布局模式（`PageConfig.defaultLayoutMode`）
4. 解析响应式规则（`responsive` + `PageCanvasConfig.breakpoints`）
5. 建立索引：
   - `NodeIndex: Map<nodeId, NodeSchema>`
   - `PageIndex: Map<pageId, PageSchema>`
   - `ActionIndex: global/page/node`

输出建议：

1. `NormalizedProject`
2. `NormalizedPage`
3. `NormalizedNode`

## 4.4 IR Builder（IR）

IR 必须语义化，而不是模板字符串拼接对象。建议核心结构：

1. `IRProject`
2. `IRPageUnit`
3. `IRNodeUnit`
4. `IRActionGraph`
5. `IRStateGraph`
6. `IRApiGraph`

`IRNodeUnit` 必含语义：

1. `layout`：`free | flow` + 计算后的定位参数
2. `renderControl`：`renderIf/repeat`
3. `props`：静态值与表达式分离
4. `style`：静态样式、响应式覆盖、运行时样式表达式
5. `events`：事件名 -> ActionRef 链路
6. `slots`：命名插槽树

## 4.5 Emitter Layer

按目标框架实现发射器：

1. `emitters/vue3`
2. `emitters/react`

两端共用 IR，不共用模板拼接细节。

Vue3 发射重点：

1. `renderIf/repeat` -> `v-if/v-for`
2. `free` 布局 -> `position:absolute + geometry`
3. `flow` 布局 -> flex/grid 容器语义
4. 事件 -> 统一 `dispatchActionRef`

React 发射重点：

1. `renderIf/repeat` -> 条件渲染 + `map`
2. 样式对象 camelCase 转换
3. 事件修饰符语义映射（`prevent/stop/self/capture`）

## 4.6 Project Assembler

最终组装工程文件，不参与业务语义计算。

建议输出：

1. `src/pages/*`
2. `src/layouts/*`
3. `src/runtime/actions/*`
4. `src/runtime/state/*`
5. `src/runtime/apis/*`
6. `src/router/*`
7. `src/main.* / App.*`

---

## 5. 与 Core 协议的映射策略

## 5.1 布局映射

1. `NodeGeometry(mode='free')`：
   - 生成绝对定位样式，`x/y/zIndex/rotate/scale`
2. `NodeGeometry(mode='flow')`：
   - 生成顺序与尺寸约束（`order/width/height/min/max`）
3. `NodeContainerLayout(mode='flow')`：
   - 生成容器 flex/grid 规则
4. `PageCanvasConfig`：
   - 生成页面容器尺寸、缩放、断点、网格（开发态可选）

## 5.2 渲染控制映射

1. `renderIf` -> 条件渲染
2. `repeat` -> 循环渲染（含 `itemAlias/indexAlias/itemKey`）
3. `responsive` -> 媒体查询或运行时断点分支

## 5.3 动作与事件映射

1. 统一动作调度器 `dispatchActionRef(ref, context)`
2. 支持作用域：`global/page/node`
3. `AnyActionSchema` 转换为可执行 handler 图
4. 事件绑定仅负责触发调度，不内联大段业务代码

## 5.4 数据与 API 映射

1. `ProjectDataConfig.globalState` + 页面 `state` -> 状态模块
2. `computed` 变量 -> 计算派生
3. `ApiSchema` -> API client + state binding glue
4. `autoLoad/dependencies/polling/cache/retry` -> 运行时策略层

---

## 6. 目录重构建议（generator）

```text
packages/generator/src/
  api/
    generateFromProject.ts
    generateFromPage.ts
  pipeline/
    validate/
      validateProject.ts
      diagnostics.ts
    normalize/
      normalizeProject.ts
      normalizePage.ts
      normalizeNode.ts
      resolveLayout.ts
    graph/
      buildActionGraph.ts
      buildStateGraph.ts
      buildNodeIndex.ts
    ir/
      ir.ts
      buildIRProject.ts
      buildIRPage.ts
      buildIRNode.ts
  emitters/
    vue3/
      emitProject.ts
      emitPage.ts
      emitNode.ts
    react/
      emitProject.ts
      emitPage.ts
      emitNode.ts
  assembler/
    assembleVueProject.ts
    assembleReactProject.ts
  compat/
    legacyComponentAdapter.ts
  index.ts
```

---

## 7. 迁移路径（分阶段）

## Phase 1：协议对齐（必做）

1. 新增 `generateFromProject(project: ProjectSchema, options)` 入口
2. 建立 `normalize` 层，先支持 Vue3 输出
3. 保留旧 `generateCode(components)`，但标注 deprecated

## Phase 2：IR 落地

1. 新建 IR 类型，替代旧 `IRNode/IRScriptContext` 直写脚本模式
2. 事件、动作、状态、API 分图构建
3. 页面与布局分文件生成

## Phase 3：双端完善

1. Vue3 emitter 完整覆盖（page/fragment/dialog/component）
2. React emitter 对齐功能集
3. 工程组装器统一清单输出 `FileManifest[]`

## Phase 4：清理兼容层

1. 移除旧 `Component(position/size)` 主路径
2. `toCode.ts`、旧 `projectGenerator.ts` 退役或转 `compat/`

---

## 8. 测试与验收

最少验收集：

1. 合同测试：`ProjectSchema -> IR` 快照
2. 生成测试：`IR -> Vue/React` 快照
3. 工程测试：生成项目后执行 `pnpm type-check`、`pnpm build`
4. 语义测试：
   - `free/flow` 混合布局
   - `renderIf/repeat`
   - `global/page/node` 动作引用
   - `responsive + breakpoints`

通过标准：

1. 与现有 renderer 行为一致（事件、样式、数据绑定）
2. 生成项目可直接运行，不依赖编辑器私有 store

---

## 9. 当前建议的首个实施切片（1~2 天）

1. 新增 `api/generateFromProject.ts`（仅 Vue3）
2. 新增 `pipeline/normalize/resolveLayout.ts`
3. 新增 `pipeline/ir/ir.ts` 最小集合（页面+节点+样式+事件）
4. 新增 `emitters/vue3/emitPage.ts`，先覆盖 `RoutePage + flow/free`
5. 用 3 个真实页面样例做快照测试

这个切片完成后，生成器就从“旧组件模型”切换到了“core 协议驱动”主路径。
