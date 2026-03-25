# Delivery Plan

Last updated: 2026-03-25

## Positioning

Project 定位为“面向中后台 CRUD / 表单 / 列表 / 详情页的低代码搭建引擎”，不再主打大屏、地图、海量图表和多模型 AI。

## Scope

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

## Milestones

### 2026-03-25 to 2026-03-27

- [x] 冻结作用域与物料白名单
- [x] 修复工作台 / 编辑器 / 预览 / 保存主链路一致性
- [x] 统一预览加载逻辑

### 2026-03-28 to 2026-03-31

- [x] 收缩物料体系
- [ ] 稳定画布编辑与历史记录
- [x] 做出“查询表单 + 表格”页面
- [ ] 做出“详情弹窗 / 抽屉”页面

### 2026-04-01 to 2026-04-02

- [x] 跑通数据源与事件联动
- [ ] 稳定 Vue3 导出

### 2026-04-03 to 2026-04-06

- [ ] 视情况做自定义组件扩展 MVP
- [ ] 若 P0 提前完成，再评估接入 Agent 协作能力 MVP
- [ ] 完成两个 Demo
- [ ] 完成 README、架构图、录屏脚本、演示讲稿
- [ ] 全量回归与演示录屏

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
  - [x] 新一轮 `pnpm type-check` 通过
  - [x] 新一轮 `pnpm -F @vela/editor build` 通过
  - [x] 新一轮 `pnpm -F @vela/renderer build` 通过
  - [!] `pnpm test:run` 仍失败，原因是仓库当前没有匹配的测试文件
  - [ ] 下一步：继续收敛编辑器历史与交互稳定性，优先核实拖拽命中、多选层级选择与撤销重做的一致性
