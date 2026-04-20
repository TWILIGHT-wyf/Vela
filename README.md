# Vela Low-Code Monorepo

一个基于 Vue 3、TypeScript 和 `pnpm workspace` 的低代码平台 monorepo。

当前仓库重点是新的 monorepo 架构，以及围绕编辑器、运行时、物料体系、代码生成和项目持久化的整体链路。

## 当前能力

- 工作台 Starter：支持空白项目和“业务示例”项目一键创建
- 可视化编辑器：无限画布、浮动面板、组件拖拽、属性配置、逻辑配置、模拟运行
- 项目模型：支持页面、弹窗页、多页面路由、项目预览和项目管理
- 运行时渲染：由 `@vela/renderer` 提供运行预览能力
- 代码导出：支持生成 Vue 3 / React 项目代码，也支持单页代码预览
- 物料体系：`@vela/materials` 负责低代码物料包装，`@vela/ui` / `@vela/ui-react` 提供底层组件
- 服务端能力：MongoDB 项目持久化、项目 CRUD、Mock 数据源接口

## 推荐演示路径

如果你要快速了解当前项目主链路，建议直接从工作台创建“业务示例”项目。

这个 starter 会预置：

- 订单管理页：查询表单、汇总卡、表格、弹窗处理按钮
- 用户管理页：用户列表、汇总卡、活动动态
- 订单处理弹窗页：演示 `showDialog -> closeDialog -> resultPath` 回填链路

建议演示顺序：

1. 工作台创建项目并进入编辑器
2. 预览订单管理页，演示查询刷新
3. 点击“处理示例订单”，展示弹窗关闭后主页面结果回填
4. 切到用户管理页，展示多页面项目结构
5. 打开预览页的“项目代码”或编辑器导出功能，说明生成器链路

可直接参考 [DEMO_SCRIPT.md](/C:/Users/TWILIGHT/Desktop/Typescript/webgis/DEMO_SCRIPT.md)。

## Monorepo 结构

```text
.
├─ packages/
│  ├─ core/        # 协议、类型、校验、运行时基础工具
│  ├─ editor/      # Vue 3 编辑器应用（Dashboard / Editor / Preview）
│  ├─ generator/   # Vue3 / React 项目代码生成器
│  ├─ materials/   # 低代码物料注册、元数据、包装层
│  ├─ renderer/    # 运行时渲染器与插件系统
│  ├─ ui/          # Vue 组件库
│  └─ ui-react/    # React 组件库
├─ server/         # Express + MongoDB 后端服务
├─ tests/          # 单元、组件、集成、E2E 测试
├─ public/         # 静态资源
├─ data/           # 本地/示例数据
└─ .github/        # CI 工作流
```

## 主要页面

- `/`：项目工作台
- `/editor/:id?`：主编辑器
- `/preview/:id?`：运行预览页，可查看运行态、JSON、单页代码和整项目代码树

## 包职责

### `@vela/editor`

- Vue 3 编辑器应用
- 使用 Pinia 管理项目、组件树、历史记录和 UI 状态
- 使用 `@vela/renderer` 做模拟运行和预览渲染
- 使用 `@vela/generator` 生成 Vue / React 代码

### `@vela/core`

- `ProjectSchema`、页面模型、组件协议、动作协议
- 组件注册契约、校验逻辑、运行时基础工具
- monorepo 共享类型来源

### `@vela/materials`

- 管理低代码面板可见物料与元数据
- 统一物料名、分类、默认属性和面板展示信息
- 将物料映射到 `@vela/ui` 组件实现

### `@vela/renderer`

- 渲染项目页面和弹窗页
- 提供运行时渲染和插件能力

### `@vela/generator`

- 从 `ProjectSchema` 生成完整 Vue 3 / React 项目文件
- 内置规范化、校验和代码检查流程

### `@vela/ui` / `@vela/ui-react`

- 分别提供 Vue / React 组件实现
- 作为运行时和导出代码的底层组件依赖

### `@vela/server`

- 项目 CRUD
- MongoDB 持久化
- Mock 数据源接口

## 环境要求

- Node.js 20+
- `pnpm`
- Docker，可选；如果你直接运行根目录 `pnpm dev` 会用到
- MongoDB

CI 当前使用 Node 20。

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

服务端从 `server/.env.example` 开始：

```bash
cp server/.env.example server/.env
```

至少需要确认以下变量：

```env
PORT=3001
MONGO_URI=mongodb://127.0.0.1:27017/vela
```

### 3. 启动开发环境

如果本机有 Docker，可直接运行：

```bash
pnpm dev
```

这个命令会：

- 通过 `docker-compose up -d` 拉起依赖服务
- 同时启动 `@vela/server` 和 `@vela/editor`

如果只想单独启动某一侧：

```bash
pnpm -F @vela/editor dev
pnpm -F @vela/server dev
```

默认地址：

- 编辑器：`http://localhost:5173`
- 服务端：`http://localhost:3001`

启动后建议先在工作台创建“业务示例”项目，再按上面的推荐演示路径走一遍。

## 常用命令

```bash
# 开发
pnpm dev
pnpm -F @vela/editor dev
pnpm -F @vela/server dev

# 构建
pnpm build
pnpm build:editor
pnpm build:server
pnpm preview

# 质量检查
pnpm lint
pnpm lint:fix
pnpm type-check

# 测试
pnpm test
pnpm test:run
pnpm test:coverage
pnpm exec playwright test
```

也可以只构建某个 workspace 包：

```bash
pnpm -F @vela/core build
pnpm -F @vela/generator build
pnpm -F @vela/ui build
pnpm -F @vela/renderer build
```

## 测试说明

Vitest 当前覆盖以下范围：

- `tests/unit/**/*.spec.ts`
- `tests/components/**/*.spec.ts`
- `tests/integration/**/*.spec.ts`
- `packages/**/tests/**/*.{test,spec}.ts`

Playwright E2E 位于 `tests/e2e`。

覆盖率阈值：

- statements: 60
- branches: 50
- functions: 60
- lines: 60

## 服务端接口概览

### 健康检查

- `GET /api/health`

### 项目管理

- `GET /api/projects`
- `GET /api/projects/:id`
- `POST /api/projects`
- `PUT /api/projects/:id`
- `DELETE /api/projects/:id`

### Mock 数据源

- `GET /api/mock/text`
- `GET /api/mock/list`
- `GET /api/mock/time`
- `GET /api/mock/chart/simple`
- `GET /api/mock/orders`
- `GET /api/mock/users`
- `GET /api/mock/map/markers`

## 当前架构重点

这条主线变更的重点不是单纯加功能，而是重组代码结构：

- 从单体 `src/` 结构迁移到 `packages/*` monorepo
- 把核心协议沉淀到 `@vela/core`
- 把运行时、物料、生成器、UI 组件拆成独立包
- 编辑器预览页支持 JSON、单文件代码、整项目代码树查看
- 生成器已经统一 Vue 3 / React 两条输出链路

## 协作建议

- 优先使用 `@vela/*` workspace alias，不要写深层相对路径
- 编辑器相关改动尽量同时关注 `@vela/core`、`@vela/materials`、`@vela/renderer`
- 修改生成器时，同步确认运行时语义是否仍然匹配
- 提交前至少运行：`pnpm lint`、`pnpm type-check`、`pnpm test:run`

## 许可证

MIT
