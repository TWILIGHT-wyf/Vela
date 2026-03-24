# Interview Plan

Last updated: 2026-03-25

## Positioning

Project定位为“面向中后台 CRUD / 表单 / 列表 / 详情页的低代码搭建引擎”，不再主打大屏、地图、海量图表和多模型 AI。

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
- [ ] 数据源映射与基础联动
- [ ] Vue3 + TypeScript 导出稳定
- [ ] 2 个完整 Demo：用户管理页、订单管理页
- [ ] README 架构说明与面试讲稿

### P1 If Time Allows

- [ ] React 导出补强
- [ ] 自定义组件扩展 MVP：manifest + 远程 ESM 注册
- [ ] 查询表单 + 表格组合模板
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

- [ ] 收缩物料体系
- [ ] 稳定画布编辑与历史记录
- [ ] 做出“查询表单 + 表格”页面
- [ ] 做出“详情弹窗 / 抽屉”页面

### 2026-04-01 to 2026-04-02

- [ ] 跑通数据源与事件联动
- [ ] 稳定 Vue3 导出

### 2026-04-03 to 2026-04-06

- [ ] 视情况做自定义组件扩展 MVP
- [ ] 完成两个 Demo
- [ ] 完成 README、架构图、录屏脚本、面试讲稿
- [ ] 全量回归与演示录屏

## Progress Log

- 2026-03-25:
  - [x] 完成面试版定位与范围收缩
  - [x] 写入仓库内持久化计划文件 `INTERVIEW_PLAN.md`
  - [x] 修复 `preview` 路由支持 `/preview/:id?`
  - [x] `PreviewView` 支持按路由独立加载项目，并可返回对应编辑页
  - [x] `AppHeader` 保存行为改为“本地保存 + 服务器同步（若存在路由项目 ID）”
  - [x] 物料面板收缩到面试版白名单，隐藏大屏/长尾组件
  - [x] 模板面板收缩到中后台语义模板，移除过度承诺的自定义组件文案
  - [x] 两轮 `pnpm type-check` 通过
  - [ ] 下一步：开始做中后台模板与事件/数据链路的稳定化
