# Delivery Plan

Last updated: 2026-03-26

## Positioning

Project 定位为“面向中后台 CRUD / 表单 / 列表 / 详情页的低代码搭建引擎”，不再主打大屏、地图、海量图表和多模型 AI。

## Execution Rules

- 后续执行优先级固定为：`P0 主链路闭环 > P0 编辑器稳定性 > P0 导出可运行 > Demo 页面 > 文档 > P1`
- 不再为了“让 test:run 变绿”单独补测试文件；测试只在 P0 主链路明显稳定后回补
- 每次开发必须尽量命中一个明确任务项，避免只做零散小修
- 每次提交前至少跑与改动范围匹配的校验，并把结果写入进度日志
- 提交信息统一中文，且每次只对应一个主要任务点

## Delivery Scope

### P0 Must Ship

- [ ] 工作台 -> 编辑器 -> 预览 -> 导出闭环稳定
- [ ] 多页面管理与基础页面配置
- [ ] 拖拽编排、选中、多选、复制粘贴、删除
- [ ] 撤销重做稳定
- [ ] 中后台布局体系：Grid / Flex / Card / Tabs / Modal / Drawer
- [ ] 核心物料：Text / Button / Input / Textarea / Select / Switch / CheckboxGroup / RadioGroup / DatePicker / Table / List / Stat
- [ ] 属性面板：Props / Style / Events / Relations
- [ ] 运行时动作：setState / callApi / navigate / showToast / openDialog / closeDialog
- [x] 数据源映射与基础联动
- [ ] Vue3 + TypeScript 导出稳定
- [ ] 2 个完整 Demo：用户管理页、订单管理页
- [ ] README 架构说明与演示讲稿

### P1 If Time Allows

- [ ] React 导出补强
- [ ] 自定义组件扩展 MVP：manifest + 远程 ESM 注册
- [ ] Agent 协作能力 MVP：基于页面协议和组件注册表，提供页面骨架生成、事件联动配置、协议审查三类能力
- [x] 查询表单 + 表格组合模板
- [ ] 导出诊断信息增强

### P2 Explicitly Cut

- [x] 大屏项目定位
- [x] 地图 / Leaflet / 热力图 / 聚合点
- [x] AI 多模型主卖点
- [x] 服务端持久化作为核心路线
- [x] 长尾图表和未闭环高级能力

## Current Snapshot

当前真实状态，不按理想目标写，只按仓库现状写：

- `T1 主链路闭环`：`70%`
  已完成：工作台/编辑器/预览主链路、页面类型区分、预览态弹窗页打开关闭
  未完成：导出态和预览态的完全一致性、导出态真实 smoke 验证
- `T2 画布编辑与历史记录稳定化`：`65%`
  已完成：多选归一化、批量删除、批量粘贴、空容器粘贴目标、移动后索引刷新
  未完成：拖拽取消路径、跨容器移动后的几何/反馈一致性、最后一轮交互收口
- `T3 页面关系与弹窗页平台能力`：`75%`
  已完成：页面类型、页面状态/API、弹窗页配置、预览态传参/回参
  未完成：基于平台能力做出完整“详情弹窗页”闭环，并验证抽屉/弹窗语义边界
- `T4 数据源与动作联动平台化`：`80%`
  已完成：组件级数据源、页面状态驱动、refresh-data、基础 callApi 链路
  未完成：再做一轮以真实 CRUD 页面为目标的稳定性验证
- `T5 Vue 导出稳定化`：`55%`
  已完成：页面状态初始值、页面 API 注入、DialogHost、showDialog/closeDialog 基础承接
  未完成：导出态 dialog resultPath 主链路验证、导出诊断、真实项目生成 smoke
- `T6 Demo 页面落地`：`20%`
  已完成：有模板雏形和 mock 数据
  未完成：必须在平台能力稳定后重新按平台协议组装，不再继续提前做模板逻辑
- `T7 文档与演示材料`：`0%`
  代码闭环前不启动

## Detailed Tasks

### T1 主链路闭环

状态：`进行中`

目标：

- 从工作台创建项目/页面后，能进入编辑器编辑、进入预览、再导出到 Vue 项目
- 主链路中的页面 ID、页面类型、保存来源、预览加载来源保持一致

要修改什么：

- 工作台 / 页面入口 / 预览入口 / 导出入口之间的项目读取与页面定位逻辑
- 导出时的项目级元信息、页面级元信息、路由页与弹窗页识别逻辑

主要文件：

- [project.ts](/C:/Users/TWILIGHT/Desktop/Typescript/webgis/packages/editor/src/stores/project.ts)
- [DashboardView.vue](/C:/Users/TWILIGHT/Desktop/Typescript/webgis/packages/editor/src/views/DashboardView.vue)
- [PreviewView.vue](/C:/Users/TWILIGHT/Desktop/Typescript/webgis/packages/editor/src/views/PreviewView.vue)
- [generateFromProject.ts](/C:/Users/TWILIGHT/Desktop/Typescript/webgis/packages/generator/src/api/generateFromProject.ts)
- [emitProject.ts](/C:/Users/TWILIGHT/Desktop/Typescript/webgis/packages/generator/src/emitters/vue3/emitProject.ts)

通过什么方式实现：

- 继续收敛导出链路，让生成器明确区分 `page / dialog / fragment`
- 让预览态与导出态共享相同的页面运行时语义，而不是各自维护一套特判
- 尽量基于 `@vela/core` 协议字段实现，不新增 editor 私有语义

验收标准：

- 可以创建路由页和弹窗页，并在预览态正确打开/关闭弹窗页
- 导出的 Vue 项目至少包含有效的 `router`、`pages`、`DialogHost`、`actionExecutor`
- 导出产物中，页面状态初始化、页面 API 查找、弹窗关闭结果回填可以工作

验证命令：

- `pnpm type-check`
- `pnpm -F @vela/editor build`
- `pnpm -F @vela/generator build`

### T2 画布编辑与历史记录稳定化

状态：`进行中`

目标：

- 把拖拽、选中、多选、复制粘贴、删除、方向键移动、撤销重做收敛成统一状态流
- 避免出现父子选择冲突、拖拽指示器残留、跨容器移动后状态不同步

要修改什么：

- 画布拖拽命中和放置反馈
- 选择状态的单选/多选/命中路径切换
- 命令栈和批处理的边界，确保预期支持撤销的操作都走命令

主要文件：

- [EditorCanvas.vue](/C:/Users/TWILIGHT/Desktop/Typescript/webgis/packages/editor/src/components/Canvas/EditorCanvas.vue)
- [NodeWrapper.vue](/C:/Users/TWILIGHT/Desktop/Typescript/webgis/packages/editor/src/components/Canvas/NodeWrapper.vue)
- [useCanvasDrop.ts](/C:/Users/TWILIGHT/Desktop/Typescript/webgis/packages/editor/src/components/Canvas/useCanvasDrop.ts)
- [index.ts](/C:/Users/TWILIGHT/Desktop/Typescript/webgis/packages/editor/src/stores/component/index.ts)
- [useComponentSelection.ts](/C:/Users/TWILIGHT/Desktop/Typescript/webgis/packages/editor/src/stores/component/useComponentSelection.ts)
- [useComponentTree.ts](/C:/Users/TWILIGHT/Desktop/Typescript/webgis/packages/editor/src/stores/component/useComponentTree.ts)
- [history.ts](/C:/Users/TWILIGHT/Desktop/Typescript/webgis/packages/editor/src/stores/history.ts)
- [component-commands.ts](/C:/Users/TWILIGHT/Desktop/Typescript/webgis/packages/editor/src/stores/commands/component-commands.ts)

通过什么方式实现：

- 所有结构性变更继续统一走 `Command / BatchCommand`
- 视觉反馈问题优先从状态源修，不从样式层硬补
- 每修一类交互，只保留一个状态来源，不做多层并行写入

验收标准：

- 单选、多选、Alt 选父容器、点击空白取消选择都符合预期
- 复制/剪切/粘贴不会把父子嵌套节点重复写入
- 跨容器拖拽后关系树、属性面板、选择状态、历史记录保持一致
- 一次用户操作只生成一条合理的撤销记录，或明确是一条批处理记录

验证命令：

- `pnpm lint`
- `pnpm type-check`
- `pnpm -F @vela/editor build`

当前子任务拆解：

- [x] `T2.1` 选择状态层级归一化
- [x] `T2.2` 复制/剪切/粘贴批处理化
- [x] `T2.3` 空容器粘贴目标识别修正
- [x] `T2.4` 组件移动后的索引刷新
- [ ] `T2.5` 拖拽取消路径收口
      完成标准：按下 `Esc` 或拖拽中断后，指示器、hover、dragging、dropEffect 全部恢复
- [ ] `T2.6` 跨容器移动后的几何/反馈一致性
      完成标准：关系树、画布、属性面板、历史记录四者一致

### T3 页面关系与弹窗页平台能力

状态：`进行中`

目标：

- 让“详情弹窗页 / 抽屉页”成为平台能力，而不是模板特例
- 页面级状态、页面级 API、页面动作、弹窗页传参/回参完整可配置

要修改什么：

- 页面设置面板、事件面板、关系面板
- 页面 store 中的页面元数据、页面状态、页面 API、弹窗配置
- 运行时中的 `showDialog / closeDialog / resultPath`

主要文件：

- [PageSettingPane.vue](/C:/Users/TWILIGHT/Desktop/Typescript/webgis/packages/editor/src/components/SetterPanel/panes/PageSettingPane.vue)
- [EventPane.vue](/C:/Users/TWILIGHT/Desktop/Typescript/webgis/packages/editor/src/components/SetterPanel/panes/EventPane.vue)
- [RelationsPane.vue](/C:/Users/TWILIGHT/Desktop/Typescript/webgis/packages/editor/src/components/SetterPanel/panes/RelationsPane.vue)
- [PageNavigator.vue](/C:/Users/TWILIGHT/Desktop/Typescript/webgis/packages/editor/src/components/shell/PageNavigator.vue)
- [project.ts](/C:/Users/TWILIGHT/Desktop/Typescript/webgis/packages/editor/src/stores/project.ts)
- [RuntimeRenderer.vue](/C:/Users/TWILIGHT/Desktop/Typescript/webgis/packages/renderer/src/runtime/RuntimeRenderer.vue)
- [useEventExecutor.ts](/C:/Users/TWILIGHT/Desktop/Typescript/webgis/packages/renderer/src/runtime/useEventExecutor.ts)

通过什么方式实现：

- 页面管理继续以 `PageSchema` 为中心，不引入编辑器私有页面类型
- 事件面板中能配到的能力，必须能在运行时和导出中被承接
- 优先打通 `showDialog -> state mapping -> closeDialog -> resultPath`

验收标准：

- 可以在编辑器中创建弹窗页，配置弹窗尺寸、遮罩、关闭策略
- 可以在普通页面中通过动作选择目标弹窗页，并传入页面状态映射
- 可以在弹窗页中关闭自己，并把结果回填到宿主页面状态

验证命令：

- `pnpm type-check`
- `pnpm -F @vela/editor build`
- `pnpm -F @vela/renderer build`

当前子任务拆解：

- [x] `T3.1` 页面类型与页面导航能力
- [x] `T3.2` 页面级状态 / API / 运行时配置面板
- [x] `T3.3` 弹窗页 showDialog / closeDialog / resultPath 预览态闭环
- [ ] `T3.4` 详情弹窗页平台化落地
      完成标准：不用模板特判，只靠页面状态、页面 API、动作面板即可完成“列表打开详情弹窗 -> 回填结果”
- [ ] `T3.5` 抽屉/弹窗语义边界收敛
      完成标准：明确当前版本只主打弹窗页，Drawer 若未打通则不作为主卖点

### T4 数据源与动作联动平台化

状态：`基础完成，继续收敛`

目标：

- 让查询表单驱动表格刷新、列表刷新、统计卡刷新成为平台表达能力
- 避免把中后台场景逻辑写死在模板里

要修改什么：

- 组件级数据源配置
- 页面级 API 配置
- 运行时动作对 `state`、`api`、`data-refresh` 的处理

主要文件：

- [DataSourcePane.vue](/C:/Users/TWILIGHT/Desktop/Typescript/webgis/packages/editor/src/components/SetterPanel/panes/DataSourcePane.vue)
- [PageSettingPane.vue](/C:/Users/TWILIGHT/Desktop/Typescript/webgis/packages/editor/src/components/SetterPanel/panes/PageSettingPane.vue)
- [useComponentDataSource.ts](/C:/Users/TWILIGHT/Desktop/Typescript/webgis/packages/renderer/src/runtime/useComponentDataSource.ts)
- [useDataBindingEngine.ts](/C:/Users/TWILIGHT/Desktop/Typescript/webgis/packages/renderer/src/runtime/useDataBindingEngine.ts)
- [useEventExecutor.ts](/C:/Users/TWILIGHT/Desktop/Typescript/webgis/packages/renderer/src/runtime/useEventExecutor.ts)

通过什么方式实现：

- 表单值优先进入页面状态，再由数据源参数模板读取
- `callApi / refresh-data / setState` 三个动作保持可组合
- 模板只引用平台能力，不再承载业务逻辑实现

验收标准：

- 表格/List/Stat 可以从页面状态派生请求参数
- 点击查询按钮后可以更新状态并触发数据刷新
- 不依赖写死组件 ID，也能完成查询联动

验证命令：

- `pnpm type-check`
- `pnpm -F @vela/renderer build`
- `pnpm -F @vela/editor build`

### T5 Vue 导出稳定化

状态：`进行中`

目标：

- 让导出的 Vue3 + TS 项目至少可以承接当前平台主打能力
- 覆盖路由页、弹窗页、页面状态、页面 API、动作执行器

要修改什么：

- IR 层的页面信息保真
- Vue emitter 的路由、页面组件、运行时文件输出
- 导出时的诊断信息和不支持能力的 warning

主要文件：

- [buildIRProject.ts](/C:/Users/TWILIGHT/Desktop/Typescript/webgis/packages/generator/src/pipeline/ir/buildIRProject.ts)
- [buildIRPage.ts](/C:/Users/TWILIGHT/Desktop/Typescript/webgis/packages/generator/src/pipeline/ir/buildIRPage.ts)
- [ir.ts](/C:/Users/TWILIGHT/Desktop/Typescript/webgis/packages/generator/src/pipeline/ir/ir.ts)
- [emitProject.ts](/C:/Users/TWILIGHT/Desktop/Typescript/webgis/packages/generator/src/emitters/vue3/emitProject.ts)
- [createActionExecutorRuntime.ts](/C:/Users/TWILIGHT/Desktop/Typescript/webgis/packages/generator/src/emitters/shared/createActionExecutorRuntime.ts)

通过什么方式实现：

- 继续让页面状态、页面 API、项目动作、页面动作都进入导出运行时上下文
- 对暂时不支持的协议能力输出诊断，而不是静默丢失
- 优先保证“当前项目常用能力导出后可跑”，再追求覆盖所有边缘协议

验收标准：

- 导出结果包含有效的 `index.html / package.json / router / pages / runtime`
- 路由页可以访问，弹窗页可以被宿主打开
- `showToast / navigate / setState / callApi / showDialog / closeDialog / refresh-data` 至少主链可用

验证命令：

- `pnpm type-check`
- `pnpm -F @vela/generator build`
- `pnpm -F @vela/editor build`

当前子任务拆解：

- [x] `T5.1` 页面状态初始值注入
- [x] `T5.2` 页面级 API 注入
- [x] `T5.3` 导出态 DialogHost 与 showDialog/closeDialog 基础承接
- [ ] `T5.4` 导出态 dialog resultPath 主链路验证
      完成标准：导出项目中打开弹窗、关闭弹窗、结果写回页面状态可工作
- [ ] `T5.5` 导出诊断增强
      完成标准：不支持能力至少输出 warning，不再静默丢失
- [ ] `T5.6` 真实项目生成 smoke
      完成标准：用当前项目真实 schema 生成一份 Vue 项目，并能通过基本安装/构建检查

### T6 Demo 页面落地

状态：`未开始，必须在平台能力稳定后进行`

目标：

- 用已经稳定的平台能力搭出两个可演示页面，而不是单独写页面逻辑

页面范围：

- 用户管理页：查询表单、用户表格、状态切换、详情弹窗页
- 订单管理页：筛选表单、统计卡、订单表格、详情弹窗页

要修改什么：

- 仅修改模板定义和 mock 数据，不新增平台特判

主要文件：

- [index.ts](/C:/Users/TWILIGHT/Desktop/Typescript/webgis/packages/editor/src/templates/index.ts)
- [mock.ts](/C:/Users/TWILIGHT/Desktop/Typescript/webgis/server/routes/mock.ts)

通过什么方式实现：

- 页面逻辑优先复用页面状态、页面 API、事件动作、弹窗页能力
- 模板层只装配 schema，不写平台外逻辑

验收标准：

- 两个页面都能在编辑器里打开、预览里运行、导出后承接
- 每个页面至少有一条“查询 -> 刷新 -> 表格更新”和一条“点击详情 -> 打开弹窗 -> 回填结果”闭环

验证命令：

- `pnpm -F @vela/editor build`
- `pnpm -F @vela/renderer build`
- `pnpm -F @vela/generator build`

### T7 文档与演示材料

状态：`未开始`

目标：

- 在代码稳定后补简洁但可复述的说明材料，避免演示阶段只能靠口述

要修改什么：

- README
- 架构说明文档
- 录屏脚本 / 演示讲稿

验收标准：

- README 能讲清项目定位、模块分层、主链路、运行方式
- 架构说明能讲清 `core / editor / renderer / generator / materials`
- 演示讲稿能覆盖 3 到 5 分钟的完整讲述路径

## Immediate Next Actions

当前之后的执行顺序固定为：

1. 完成 `T5.4 导出态 dialog resultPath 主链路验证`
   要做什么：
   - 生成真实 Vue 项目
   - 检查导出态 `showDialog -> closeDialog -> vela:dialog:closed -> resultPath`
     做完才算进入下一项
2. 完成 `T3.4 详情弹窗页平台化落地`
   要做什么：
   - 用现有页面状态/API/动作能力做出完整详情弹窗页闭环
   - 不允许在模板里写平台外逻辑
3. 完成 `T2.5 / T2.6`
   要做什么：
   - 收口拖拽取消路径
   - 收口跨容器移动后的几何和状态一致性
4. 再进入 `T6 Demo 页面落地`
   进入条件：
   - `T3.4` 和 `T5.4` 至少完成一个真实页面 smoke

## Progress Log

- 2026-03-25:
  - [x] 完成项目定位与范围收缩
  - [x] 写入仓库内持久化计划文件 `DELIVERY_PLAN.md`
  - [x] 修复 `preview` 路由支持 `/preview/:id?`
  - [x] `PreviewView` 支持按路由独立加载项目，并可返回对应编辑页
  - [x] `AppHeader` 保存行为改为“本地保存 + 服务器同步（若存在路由项目 ID）”
  - [x] 物料面板收缩到当前版本白名单，隐藏大屏/长尾组件
  - [x] 模板面板收缩到中后台语义模板，移除过度承诺的自定义组件文案
  - [x] 两轮 `pnpm type-check` 通过
  - [x] `RuntimeComponent` 监听 `data-refresh`，补齐运行时手动刷新闭环
  - [x] `useComponentDataSource` 为 Table/List 注入 loading，并暴露手动刷新能力
  - [x] mock API 新增订单管理 / 用户管理场景接口，替换外网占位接口
  - [x] `query-workbench` 收敛为“订单管理页”，接入筛选、汇总、列表、表格的数据源闭环
  - [x] `approval-center` 收敛为“用户管理页”，接入用户表格、汇总卡片、活动动态
  - [x] `pnpm -F @vela/editor build` 通过
  - [x] `pnpm -F @vela/renderer build` 通过
  - [!] `pnpm test:run` 失败，原因是仓库当前没有匹配的测试文件
  - [x] 编辑器新增组件级 `DataSourcePane`，正式提供数据源配置入口
  - [x] `updateDataSourceRaw` 支持删除字段并触发响应式刷新，数据源修改可立即预览
  - [x] 页面设置面板新增页面级状态 / API / 基础运行时配置入口
  - [x] `projectStore` 新增当前页面元信息、路径、运行时、状态、API 更新方法
  - [x] 根级 `tsconfig.base.json` 与 `packages/editor/tsconfig.json` 补齐 `@/*` 与 `.vue` 任意扩展解析兜底
  - [x] `RelationsPane` 接入真实组件树拖拽编排，跨容器移动走 `componentStore.moveComponent(...)`
  - [x] `RelationsPane` 的布局更新收敛到 `updateStyle(...)`，减少旁路直接改值带来的历史记录漂移
  - [x] 页面导航支持创建路由页 / 弹窗页 / 片段页，页面树能区分非路由页面类型
  - [x] `projectStore.addPage(...)` 收敛到 `@vela/core` 的页面工厂函数，减少平台协议漂移
  - [x] 页面设置面板补齐弹窗页配置入口，可编辑宽高、关闭按钮、遮罩与遮罩关闭策略
  - [x] 动作面板为 `showDialog / closeDialog` 补齐弹窗页目标选择和常用 payload 表单，保留 JSON 兜底
  - [x] 运行时新增弹窗事件承接层，预览态可根据 `showDialog / closeDialog` 打开与关闭弹窗页
  - [x] `RuntimeRenderer` 将激活中的弹窗页并入节点索引，弹窗内组件事件也能继续走运行时插件链路
  - [x] 运行时主页面与弹窗页都建立独立 `runtime state`，`showDialog` 的传入数据可映射到目标页面状态
  - [x] 组件数据源支持基于运行时状态做 URL / headers / body 模板插值
  - [x] 动作执行器补齐 `{{state.xxx}}` 模板求值，事件动作与弹窗入参不再停留在静态字符串
  - [x] 动作面板为 `showDialog` 补齐目标弹窗页状态映射表单，可直接按页面状态字段配置入参
  - [x] `showDialog` 新增结果写回路径，配置后会在弹窗关闭时回填当前页面状态
  - [x] `showDialog` 在配置结果写回路径后会等待弹窗关闭，后续 `next` 动作链可直接消费回传结果
  - [x] 运行时新增 `vela:dialog:closed` 事件，弹窗关闭结果可回传到主页面状态
  - [x] 将 Agent 协作能力记入 P1 计划，明确仅在 P0 明显超前完成时再启动
  - [x] 编辑器多选删除改为单条批量历史记录，撤销/重做不再拆成多步
  - [x] 复制/剪切会过滤嵌套重复选中，避免父子节点重复进入剪贴板和删除链路
  - [x] 粘贴改为走命令批处理，恢复撤销能力并修正根节点粘贴路径
  - [x] 多选方向键移动改为单次批处理历史记录，避免一次键盘操作生成多条撤销记录
  - [x] 选择状态自身新增层级归一化，父子节点不再长期并存于多选结果中
  - [x] 多选时从画布开始拖拽会主动收敛为当前节点单选，避免单节点拖拽与多选状态语义冲突
  - [x] 非法拖拽目标现在会主动清理旧放置指示器，并显式回退 `dropEffect`，减少跨容器拖拽残留反馈
  - [x] 画布目录去掉 `modes/Flow` 单一模式分层，默认画布实现与拖拽 hook 收敛到 `Canvas` 主目录
  - [x] 剪贴板粘贴目标改为复用组件注册表 `isContainer` 协议，空容器不再误粘到根节点
  - [x] 组件移动后主动刷新索引版本，依赖父子关系的面板与选择计算不再吃到旧 `parentIndex`
  - [x] Vue 导出补齐页面状态初始值、页面级 API 注入和 `DialogHost`，导出产物开始承接弹窗页运行时
  - [x] 顺手清理 `renderer` 里阻塞校验的既有未使用变量，恢复仓库 `lint` 通过
  - [x] 新一轮 `pnpm type-check` 通过
  - [x] 新一轮 `pnpm lint` 通过
  - [x] 新一轮 `pnpm -F @vela/editor build` 通过
  - [x] 新一轮 `pnpm -F @vela/ui build` 通过
  - [x] 新一轮 `pnpm -F @vela/materials build` 通过
  - [x] 新一轮 `pnpm -F @vela/renderer build` 通过
  - [x] 新一轮 `pnpm -F @vela/generator build` 通过
  - [!] 测试补充按当前优先级暂缓，后续以代码开发为主，`pnpm test:run` 目前不会作为阶段性验收项
  - [!] 当前计划已修正：下一步优先完成导出态弹窗页主链路验证，其次再回到详情弹窗页平台化和画布交互收口
