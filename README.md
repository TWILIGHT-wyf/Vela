# Vela Low-Code Monorepo

一个基于 Vue 3、TypeScript 和 `pnpm workspace` 的低代码平台仓库，当前代码已经拆分为编辑器、核心协议、运行时、物料层、代码生成器、UI 组件库和后端服务多个包。

当前分支对应的是新的 monorepo 架构，重点能力包括：

- 可视化编辑器：无限画布、浮动式面板、组件拖拽、属性配置、逻辑配置、模拟运行
- 项目模型：支持页面/弹窗页、多页面路由、项目预览与项目管理
- 运行时渲染：由 `@vela/renderer` 驱动真实运行预览
- 代码导出：支持按项目生成 Vue 3 / React 代码，也支持单页代码预览
- 物料体系：`@vela/materials` 负责低代码物料包装，`@vela/ui` / `@vela/ui-react` 提供底层组件
- 服务端能力：MongoDB 项目持久化、AI 代理、Mock 数据源接口

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

## 主要页面与流程

- `/`：项目工作台，管理和进入项目
- `/editor/:id?`：主编辑器，包含 Material、Setter、Logic 三类面板和画布/模拟运行模式
- `/preview/:id?`：运行预览页，可查看运行态、JSON、单页代码和整项目代码树

## 包职责

### `@vela/editor`

- Vue 3 编辑器应用
- 使用 Pinia 管理项目、组件树、历史记录、UI 状态
- 使用 `@vela/renderer` 做模拟运行与预览渲染
- 使用 `@vela/generator` 生成 Vue / React 代码

### `@vela/core`

- `ProjectSchema`、页面模型、组件协议、动作协议
- 组件注册契约、校验逻辑、运行时基础工具
- monorepo 里所有核心包的共享类型来源

### `@vela/materials`

- 低代码面板可见物料与元数据
- 将物料名、分类、默认属性、可视化面板能力统一管理
- 负责把物料映射到 `@vela/ui` 组件实现

### `@vela/renderer`

- 渲染项目页面、弹窗页、动作和运行时插件
- 被编辑器模拟运行与预览页复用

### `@vela/generator`

- 从 `ProjectSchema` 生成完整 Vue 3 / React 项目文件
- 内置规范化、校验、表达式检查和代码校验

### `@vela/ui` / `@vela/ui-react`

- 分别提供 Vue / React 组件实现
- 作为低代码运行时与导出代码的底层组件依赖

### `@vela/server`

- 项目 CRUD
- AI 代理接口
- Mock 数据源接口，方便在编辑器里配置数据联动和演示页面

## 环境要求

- Node.js 20+
- `pnpm`
- Docker（如果你要直接跑根目录 `pnpm dev`）
- MongoDB（可由 `docker-compose` 拉起）

CI 当前使用 Node 20。

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

根目录可按需使用 `.env.example`。

服务端从 `server/.env.example` 开始：

```bash
cp server/.env.example server/.env
```

关键变量如下：

```env
PORT=3001
MONGO_URI=mongodb://127.0.0.1:27017/vela
AI_API_KEY=
AI_PROVIDER=gemini
AI_MODEL=
HTTPS_PROXY=
```

### 3. 启动开发环境

如果本机有 Docker，直接使用：

```bash
pnpm dev
```

这个命令会：

- 通过 `docker-compose up -d` 拉起依赖服务
- 同时启动 `@vela/server` 和 `@vela/editor`

如果你只想单独启动某一侧：

```bash
pnpm -F @vela/editor dev
pnpm -F @vela/server dev
```

默认地址：

- 编辑器：`http://localhost:5173`
- 服务端：`http://localhost:3001`

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

Vitest 会覆盖以下范围：

- `tests/unit/**/*.spec.ts`
- `tests/components/**/*.spec.ts`
- `tests/integration/**/*.spec.ts`
- `packages/**/tests/**/*.{test,spec}.ts`

Playwright E2E 位于 `tests/e2e`。

当前覆盖率阈值：

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

### AI 代理

- `POST /api/ai/*`

### Mock 数据源

示例接口包括：

- `GET /api/mock/text`
- `GET /api/mock/list`
- `GET /api/mock/time`
- `GET /api/mock/chart/simple`
- `GET /api/mock/orders`
- `GET /api/mock/users`
- `GET /api/mock/map/markers`

## 当前架构重点

这条分支的核心变化不是简单功能叠加，而是代码组织方式的调整：

- 从单体 `src/` 结构迁移到 `packages/*` monorepo
- 把核心协议沉淀到 `@vela/core`
- 把运行时、物料、生成器、UI 组件拆成独立包
- 编辑器预览页支持 JSON、单文件代码、整项目代码树查看
- 生成器已经对 Vue 3 / React 两条输出链路做统一入口封装

## 代码协作建议

- 优先使用 `@vela/*` workspace alias，不要写深层相对路径
- 编辑器相关改动尽量同时关注 `@vela/core`、`@vela/materials`、`@vela/renderer` 的一致性
- 修改生成器时，同步确认运行时语义是否仍然匹配
- 提交前至少运行：`pnpm lint`、`pnpm type-check`、`pnpm test:run`

## 许可证

MIT
