# Editor Canvas 到 Renderer 到 Generator 链路与文件职责清单

## 1. 总链路（先看结论）

`editor` 的画布编辑链路是：

`物料拖拽/属性编辑` -> `组件树状态变更（component store + history command）` -> `project schema 同步` -> `RuntimeRenderer 运行态渲染（simulation/preview）` -> `Generator 生成代码（validate -> normalize -> IR -> emit）` -> `导出 zip`

核心入口文件：

- `packages/editor/src/views/editor.vue`（编辑页，画布 + 模拟运行）
- `packages/editor/src/views/Preview.vue`（运行预览 + 代码预览）
- `packages/editor/src/components/dialogs/ExportConfigDialog.vue`（导出源码）

---

## 2. Editor 侧：画布相关文件与职责

### 2.1 入口与页面编排

| 文件                                                            | 主要职责                                                                  | 关键上下游                                                 |
| --------------------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `packages/editor/src/main.ts`                                   | 初始化 Vue/Pinia/Router/ElementPlus；注册 `@vela/materials` 组件          | 依赖 `@vela/materials`、`@vela/core/contracts`             |
| `packages/editor/src/router/index.ts`                           | 路由：`/editor`、`/preview`                                               | 连接编辑页与预览页                                         |
| `packages/editor/src/views/editor.vue`                          | 编辑主页面；切换画布编辑/模拟运行；挂载 Header/Material/Setter/Logic 面板 | 编辑态走 `CanvasBoard`，模拟态走 `RuntimeRenderer`         |
| `packages/editor/src/views/Preview.vue`                         | 运行预览、JSON 查看、代码生成预览、项目文件树                             | 运行态用 `RuntimeRenderer`，生成态调 `generateFromProject` |
| `packages/editor/src/components/dialogs/ExportConfigDialog.vue` | 选择框架/语言并导出源码 zip                                               | 调 `generateFromProject` + `jszip`                         |
| `packages/editor/src/composables/useRuntimePlugins.ts`          | 统一注入运行时插件                                                        | 返回 `DataBindingPlugin` + `EventExecutorPlugin`           |

### 2.2 画布渲染与交互核心

| 文件                                                                    | 主要职责                                                                   | 关键上下游                                           |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------- |
| `packages/editor/src/components/Canvas/CanvasBoard.vue`                 | 画布组合层（`CanvasViewport` + `FlowCanvas`）                              | 编辑态画布入口                                       |
| `packages/editor/src/components/Canvas/CanvasViewport.vue`              | 无限画布平移/缩放、网格背景、Space 拖拽；与 UI Store 同步 scale/offset     | 提供画布坐标上下文                                   |
| `packages/editor/src/components/Canvas/composables/useCanvasContext.ts` | 画布坐标转换与 pan/zoom 状态注入                                           | 被 `CanvasViewport` 提供，子组件注入使用             |
| `packages/editor/src/components/Canvas/modes/Flow/FlowCanvas.vue`       | 画布主容器；根级 drop；右键菜单；快捷键；Zoom-to-fit                       | 递归渲染 `UniversalRenderer + NodeWrapper`           |
| `packages/editor/src/components/Canvas/UniversalRenderer.vue`           | 编辑态递归渲染器；节点组件分发与子树渲染                                   | 每个节点外层由 `NodeWrapper` 包装                    |
| `packages/editor/src/components/Canvas/modes/Flow/NodeWrapper.vue`      | 节点交互包装：选中、拖拽、drop、flow/grid 尺寸调整、间距拖拽               | 调 `useFlowDrop` + `componentStore`                  |
| `packages/editor/src/components/Canvas/modes/Flow/useFlowDrop.ts`       | 拖放算法：before/after/inside 判定、防循环嵌套、grid 放置求位、根容器 drop | 调 `componentStore.add/move/updateGeometry`          |
| `packages/editor/src/components/Canvas/modes/Flow/types.ts`             | Flow 拖放类型定义                                                          | 被 Flow 交互文件共享                                 |
| `packages/editor/src/components/Canvas/modes/Flow/DropIndicator.vue`    | 拖放插入指示器渲染                                                         | 显示 `useFlowDrop` 计算结果                          |
| `packages/editor/src/components/Canvas/modes/Flow/ContextMenu.vue`      | 画布/节点右键菜单 UI                                                       | 配合 `useContextMenu`                                |
| `packages/editor/src/components/Canvas/selection/SelectionLayer.vue`    | 自由布局选择框层、手柄层、辅助线层入口                                     | 组合 `SnapLines/DistanceIndicators/AlignmentToolbar` |
| `packages/editor/src/components/Canvas/composables/useTransform.ts`     | 自由布局拖拽/缩放/旋转的几何更新逻辑                                       | 依赖 `useSnapping` 与 `componentStore`               |
| `packages/editor/src/components/Canvas/composables/useSnapping.ts`      | 吸附计算（同级/边界）与吸附线数据                                          | 输出 `snapLines`                                     |
| `packages/editor/src/components/Canvas/guides/SnapLines.vue`            | 吸附线渲染                                                                 | 读取 `snapLines`                                     |
| `packages/editor/src/components/Canvas/guides/DistanceIndicators.vue`   | 组件间距测量标注渲染                                                       | 选中态辅助                                           |
| `packages/editor/src/components/Canvas/guides/AlignmentToolbar.vue`     | 多选对齐/分布工具条                                                        | 自由布局对齐操作                                     |
| `packages/editor/src/composables/useEditorShortcuts.ts`                 | Delete/复制粘贴/方向键/Escape 等快捷键                                     | 作用在画布当前选择                                   |
| `packages/editor/src/composables/useContextMenu.ts`                     | 右键菜单状态管理                                                           | 被 `FlowCanvas` 使用                                 |
| `packages/editor/src/composables/useDataSourceAdapter.ts`               | 编辑态数据源 props 适配（复用 renderer 数据源映射）                        | 基于 `useComponentDataSource`                        |
| `packages/editor/src/utils/layoutConverter.ts`                          | free/grid/flow 模式转换                                                    | 被 editor 页和 PageSetting 使用                      |
| `packages/editor/src/utils/gridPlacement.ts`                            | grid 放置模型、碰撞检测、首个可放置位计算                                  | 被 `useFlowDrop`、`layoutConverter` 调用             |

### 2.3 面板层（改变画布数据的输入来源）

| 文件                                                                     | 主要职责                                                | 关键上下游                                             |
| ------------------------------------------------------------------------ | ------------------------------------------------------- | ------------------------------------------------------ |
| `packages/editor/src/components/MaterialPanel/MaterialPanel.vue`         | 物料面板；拖拽时写入 `application/x-vela`；应用页面模板 | 触发节点新增/整页替换                                  |
| `packages/editor/src/components/SetterPanel/SetterPanel.vue`             | 右侧属性面板容器                                        | 挂载 Props/Style/Event/Animation/Relations/PageSetting |
| `packages/editor/src/components/SetterPanel/panes/PropsPane.vue`         | 基于物料 meta 编辑 props                                | `componentStore.updateProps`                           |
| `packages/editor/src/components/SetterPanel/panes/StylePaneEnhanced.vue` | 样式与容器布局设置                                      | `updateStyle` / `updateContainerLayout`                |
| `packages/editor/src/components/SetterPanel/panes/EventPane.vue`         | 节点事件与动作配置                                      | 更新节点 `events/actions`                              |
| `packages/editor/src/components/SetterPanel/panes/AnimationPane.vue`     | 动画配置                                                | 写入节点 animation 配置                                |
| `packages/editor/src/components/SetterPanel/panes/RelationsPane.vue`     | 组件关系视图                                            | 查看当前树结构                                         |
| `packages/editor/src/components/SetterPanel/panes/PageSettingPane.vue`   | 页面配置（尺寸、布局模式、路由等）                      | 可触发布局转换                                         |
| `packages/editor/src/components/SetterPanel/composables/useEvents.ts`    | 事件面板数据操作封装                                    | 服务 `EventPane`                                       |
| `packages/editor/src/components/SetterPanel/composables/useAnimation.ts` | 动画面板数据操作封装                                    | 服务 `AnimationPane`                                   |
| `packages/editor/src/components/SetterPanel/composables/useRelations.ts` | 关系面板辅助逻辑                                        | 服务 `RelationsPane`                                   |
| `packages/editor/src/components/SetterPanel/setters/*.vue`               | 各类属性输入控件（String/Number/Color/Object/JSON 等）  | 被 Props/Style 面板复用                                |
| `packages/editor/src/components/LogicPanel/LogicPanel.vue`               | 页面动作/全局动作管理；复用事件编辑能力                 | 更新 `project.logic` 或 `page.actions`                 |
| `packages/editor/src/components/Layout/Header/Header.vue`                | 顶栏：保存、导出 JSON、打开导出配置、跳转预览           | 调 `projectStore.saveProject` 与导出对话框             |
| `packages/editor/src/components/Layout/Header/PageNavigator.vue`         | 页面增删改切换                                          | 调 `projectStore.add/switch/delete/renamePage`         |
| `packages/editor/src/components/Layout/Header/SaveStatusIndicator.vue`   | 保存状态与手动保存入口                                  | 绑定 `projectStore.saveStatus`                         |

### 2.4 编辑器状态与命令系统

| 文件                                                            | 主要职责                                              | 关键上下游                            |
| --------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------- |
| `packages/editor/src/stores/component/index.ts`                 | 组件树总入口（对外 add/move/delete/update/select 等） | 调用 command + history                |
| `packages/editor/src/stores/component/useComponentTree.ts`      | 树结构操作（load/set/add/move/delete）                | 维护节点层级                          |
| `packages/editor/src/stores/component/useComponentStyle.ts`     | 节点 style/props/geometry/container 更新              | 支持 raw 更新与版本号                 |
| `packages/editor/src/stores/component/useComponentSelection.ts` | 单选、多选、命中路径选择                              | 画布交互依赖                          |
| `packages/editor/src/stores/component/useComponentIndex.ts`     | 节点索引与父子查询                                    | 提供 O(1) 查找能力                    |
| `packages/editor/src/stores/component/useComponentClipboard.ts` | 复制/剪切/粘贴                                        | 快捷键依赖                            |
| `packages/editor/src/stores/commands/component-commands.ts`     | 各类可撤销命令实现                                    | add/delete/move/update\* 命令         |
| `packages/editor/src/stores/history.ts`                         | undo/redo 栈、命令合并                                | `executeCommand/undo/redo`            |
| `packages/editor/src/stores/project.ts`                         | ProjectSchema 管理、页面管理、自动保存                | editor/preview/export 共用项目源      |
| `packages/editor/src/stores/ui.ts`                              | 画布 UI 状态（mode/scale/offset/模拟态）              | `CanvasViewport` 与 `editor.vue` 使用 |
| `packages/editor/src/stores/size.ts`                            | 画布设备尺寸与预设                                    | `Preview.vue` 用于运行视口            |

---

## 3. Core / Materials / Renderer / Generator 侧文件

### 3.1 Core（跨包协议与契约）

| 文件                                                | 主要职责                                                                |
| --------------------------------------------------- | ----------------------------------------------------------------------- |
| `packages/core/src/types/schema.ts`                 | 节点 Schema（props/style/events/actions/container/layoutItem/geometry） |
| `packages/core/src/types/layout.ts`                 | free/flow/grid 布局类型定义                                             |
| `packages/core/src/types/action.ts`                 | 动作协议（inline/ref/builtin）                                          |
| `packages/core/src/types/page.ts`                   | 页面级 schema                                                           |
| `packages/core/src/types/project.ts`                | 项目级 schema                                                           |
| `packages/core/src/contracts/component-registry.ts` | 组件统一注册表（editor/materials/renderer/generator 同源）              |
| `packages/core/src/contracts/action-runtime.ts`     | 动作运行时共享常量                                                      |
| `packages/core/src/utils/grid.ts`                   | grid 模板解析/构建工具                                                  |
| `packages/core/src/utils/gridNormalize.ts`          | grid 容器字段规范化                                                     |

### 3.2 Materials（画布组件实现来源）

| 文件/目录                            | 主要职责                                              |
| ------------------------------------ | ----------------------------------------------------- |
| `packages/materials/src/index.ts`    | 物料包出口                                            |
| `packages/materials/src/registry.ts` | 物料 meta 聚合、组件解析、分类与默认值提取            |
| `packages/materials/src/**/index.ts` | 单物料导出入口                                        |
| `packages/materials/src/**/meta.ts`  | 单物料配置（props/styles/defaultSize/isContainer 等） |
| `packages/materials/src/**/*.vue`    | 单物料运行时组件实现                                  |

说明：画布上“当前使用到哪个具体组件”，就会落到对应的 `packages/materials/src/**/*.vue` 文件中。

### 3.3 Renderer（运行时渲染链路）

| 文件                                                      | 主要职责                                                       |
| --------------------------------------------------------- | -------------------------------------------------------------- |
| `packages/renderer/src/index.ts`                          | 运行时对外导出                                                 |
| `packages/renderer/src/types.ts`                          | RuntimeContext / RuntimePlugin / RuntimeMode                   |
| `packages/renderer/src/runtime/RuntimeRenderer.vue`       | 运行时根渲染器；本地树副本；插件生命周期；事件分发             |
| `packages/renderer/src/runtime/RuntimeComponent.vue`      | 节点级运行时渲染；事件触发；dataSource props 合并；动画触发    |
| `packages/renderer/src/runtime/plugins.ts`                | `DataBindingPlugin` + `EventExecutorPlugin`                    |
| `packages/renderer/src/runtime/useDataBindingEngine.ts`   | 数据绑定引擎；远程数据源刷新                                   |
| `packages/renderer/src/runtime/useComponentDataSource.ts` | `dataSource -> props` 映射                                     |
| `packages/renderer/src/runtime/useEventExecutor.ts`       | 动作执行器（setState/navigate/showToast/runScript/callApi 等） |
| `packages/renderer/src/composables/useComponentStyle.ts`  | 运行时样式组装（layout + style）                               |

### 3.4 Generator（代码生成链路）

| 文件                                                                    | 主要职责                                      |
| ----------------------------------------------------------------------- | --------------------------------------------- |
| `packages/generator/src/index.ts`                                       | generator 对外 API                            |
| `packages/generator/src/api/generateFromProject.ts`                     | 总调度：`validate -> normalize -> IR -> emit` |
| `packages/generator/src/pipeline/validate/validateProject.ts`           | 生成前校验（页面/节点/action/router 引用）    |
| `packages/generator/src/pipeline/validate/diagnostics.ts`               | 诊断对象模型                                  |
| `packages/generator/src/pipeline/normalize/normalizeProject.ts`         | 项目归一化入口                                |
| `packages/generator/src/pipeline/normalize/normalizePage.ts`            | 页面归一化                                    |
| `packages/generator/src/pipeline/normalize/normalizeNode.ts`            | 节点归一化                                    |
| `packages/generator/src/pipeline/normalize/resolveLayout.ts`            | 布局归一化                                    |
| `packages/generator/src/pipeline/normalize/types.ts`                    | normalize 中间结构类型                        |
| `packages/generator/src/pipeline/ir/buildIRProject.ts`                  | 项目 IR 构建                                  |
| `packages/generator/src/pipeline/ir/buildIRPage.ts`                     | 页面 IR 构建                                  |
| `packages/generator/src/pipeline/ir/buildIRNode.ts`                     | 节点 IR 构建                                  |
| `packages/generator/src/pipeline/ir/ir.ts`                              | IR 类型定义                                   |
| `packages/generator/src/emitters/shared/buildStyle.ts`                  | Vue/React 共用样式构建逻辑                    |
| `packages/generator/src/emitters/shared/createActionExecutorRuntime.ts` | 生成项目内动作执行 runtime 源码               |
| `packages/generator/src/emitters/vue3/emitProject.ts`                   | 生成 Vue 工程文件（页面、路由、runtime）      |
| `packages/generator/src/emitters/react/emitProject.ts`                  | 生成 React 工程文件（页面、路由、runtime）    |

---

## 4. 三条验收链路（按执行顺序）

### 4.1 拖一个物料到画布

1. `packages/editor/src/components/MaterialPanel/MaterialPanel.vue`  
   拖拽开始时写 `application/x-vela`。
2. `packages/editor/src/components/Canvas/modes/Flow/NodeWrapper.vue`  
   接管 dragover/drop，委托 `useFlowDrop`。
3. `packages/editor/src/components/Canvas/modes/Flow/useFlowDrop.ts`  
   计算 before/after/inside 或 grid 放置位，执行 add/move/updateGeometry。
4. `packages/editor/src/stores/component/index.ts`  
   通过命令系统更新组件树并可撤销。
5. `packages/editor/src/stores/history.ts` + `packages/editor/src/stores/commands/component-commands.ts`  
   落入 undo/redo 栈。
6. `packages/editor/src/stores/project.ts`  
   标记项目 `unsaved`，触发后续保存逻辑。

### 4.2 编辑器里点击“模拟运行”或进入 Preview 运行

1. `packages/editor/src/views/editor.vue` / `packages/editor/src/views/Preview.vue`  
   均挂载 `RuntimeRenderer`，并注入 `runtimePlugins`。
2. `packages/renderer/src/runtime/RuntimeRenderer.vue`  
   clone 根树、初始化插件系统、接收组件事件。
3. `packages/renderer/src/runtime/RuntimeComponent.vue`  
   渲染每个节点，触发 click/hover 等事件，透传动作。
4. `packages/renderer/src/runtime/plugins.ts`  
   `DataBindingPlugin` 处理数据源，`EventExecutorPlugin` 执行动作。
5. `packages/renderer/src/runtime/useEventExecutor.ts`  
   执行 setState/navigate/showToast/runScript/callApi 等行为。

### 4.3 预览代码 / 导出项目源码

1. `packages/editor/src/views/Preview.vue` 或 `packages/editor/src/components/dialogs/ExportConfigDialog.vue`  
   动态导入并调用 `generateFromProject`。
2. `packages/generator/src/api/generateFromProject.ts`  
   执行 `validate -> normalize -> build IR -> emit`。
3. `packages/generator/src/emitters/vue3/emitProject.ts` / `packages/generator/src/emitters/react/emitProject.ts`  
   产出目标框架项目文件。
4. `packages/editor/src/components/dialogs/ExportConfigDialog.vue`  
   用 `jszip` 打包为 zip 并下载。

---

## 5. 与本链路直接相关的测试文件

- `packages/editor/tests/flow-drop-helpers.spec.ts`
- `packages/editor/tests/grid-interactions.spec.ts`
- `packages/editor/tests/two-way-binding.spec.ts`
- `packages/core/tests/grid.spec.ts`
- `packages/core/tests/material-v2.spec.ts`

---

## 6. 验收建议（按最短路径）

1. 在 `editor.vue` 画布拖拽一个组件，确认 `NodeWrapper + useFlowDrop` 的新增/移动行为。
2. 切到模拟运行，确认 `RuntimeRenderer + plugins` 的事件和数据绑定行为。
3. 在 `Preview.vue` 切换 `Vue/React + TS/JS`，确认 `generateFromProject` 输出随配置变化。
4. 在 `ExportConfigDialog.vue` 导出 zip，确认文件树和 `vela.diagnostics.txt`（有诊断时）符合预期。
