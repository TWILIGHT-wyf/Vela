# Vela LowCode Editor

<p align="center">
  <img src="https://img.shields.io/badge/Vue-3.5-brightgreen" alt="Vue 3">
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-6.x-646cff" alt="Vite">
  <img src="https://img.shields.io/badge/ElementPlus-2.11-409eff" alt="Element Plus">
  <img src="https://img.shields.io/badge/Node-≥20.19-339933" alt="Node">
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License">
  <img src="https://github.com/TWILIGHT-wyf/vela-lowcode-editor/actions/workflows/ci.yml/badge.svg" alt="CI">
</p>

一款基于 Vue 3 + TypeScript 的**数据可视化大屏低代码搭建平台**，支持拖拽式组件编排、实时预览、完整项目代码导出、AI 智能助手、事件联动、数据绑定等企业级功能。

### 预览地址：https://vela-lowcode-editor.vercel.app/ （需科学上网）

### 后端地址：https://vela-lowcode-editor.onrender.com （需科学上网）

### 组件库文档地址：https://visual-lib-docs.vercel.app/ （需科学上网）

<img width="2514" height="1275" alt="屏幕截图 2025-12-01 203042" src="https://github.com/user-attachments/assets/e99440b5-081d-4909-a040-f8331a123782" />
<img width="2505" height="1266" alt="屏幕截图 2025-12-10 212235" src="https://github.com/user-attachments/assets/2fdd8dee-dd0c-4f6c-974a-b14fc9ea2eca" />

## ✨ 核心特性

### 🎨 可视化编辑

- **拖拽式组件编排** - 从组件库拖拽组件到画布，所见即所得
- **精确定位与吸附** - 支持组件对齐、吸附、缩放、旋转等操作
- **多选与组合** - 支持框选多个组件，批量操作和分组管理
- **实时预览** - 编辑器内实时预览，支持画布缩放和位置调整

### 📊 丰富的组件生态

- **50+ 内置组件** - 图表、KPI、地图、表格、控件等开箱即用
- **独立组件库** - `@twi1i9ht/visual-lib` 可单独使用和扩展
- **组件文档** - 完整的组件 API 文档和使用示例
- **自定义组件** - 支持扩展和注册自定义组件

### 🔗 事件联动系统

- **事件配置** - 可视化配置组件的点击、hover、自定义事件等
- **动作执行器** - 支持切换可见性、显示提示、页面跳转等 10+ 种动作
- **条件执行** - 支持基于组件状态的条件判断
- **自定义脚本** - 支持 JavaScript 自定义脚本扩展业务逻辑
- **跨组件通信** - 组件间事件触发与监听机制

### 🔄 数据联动引擎

- **属性绑定** - 组件属性值自动同步，支持单向/双向绑定
- **数据转换** - 支持表达式转换器和模板转换器
- **循环保护** - 智能防止循环绑定导致的无限更新
- **性能优化** - 使用 Map 索引和精确路径监听，避免不必要的重渲染

### 🗺️ Vela 能力

- **地图组件** - 基于 Leaflet 的地图容器
- **多种图层** - 瓦片图层、矢量图层、热力图等
- **地图标记** - 标记点、聚合标记、自定义图标
- **地图控件** - 图例、比例尺、图层控制等

### 🤖 AI 智能助手

- **多模型支持** - Gemini、OpenAI、Claude、通义千问、DeepSeek 等
- **智能生成** - AI 辅助生成组件配置和布局
- **自然语言交互** - 通过对话快速创建和修改大屏

### 📦 项目导出

- **完整项目导出** - 生成可独立运行的 Vue 项目（包含多页面）
- **单页面导出** - 导出单个 .vue 文件
- **运行时库内置** - 自动注入事件执行器和数据绑定引擎
- **TypeScript 支持** - 生成的代码支持 TypeScript

### 🎯 其他特性

- **模板系统** - 预设大屏模板，快速开始
- **响应式设计** - 支持多种屏幕尺寸适配
- **深色模式** - 内置明暗主题切换
- **历史记录** - 支持撤销/重做操作
- **项目管理** - 支持项目保存、加载和版本管理
- **MongoDB 存储** - 项目数据持久化到数据库

## 🚀 快速开始

### 环境要求

- **Node.js** >= 20.19.0 || >= 22.12.0
- **pnpm** >= 8 (推荐) 或 npm >= 9
- **MongoDB** >= 6.0 (可选，用于项目持久化)

### 安装依赖

```bash
# 克隆项目
git clone https://github.com/TWILIGHT-wyf/vela-lowcode-editor.git
cd vela-lowcode-editor

# 安装依赖 (推荐使用 pnpm)
pnpm install

# 或使用 npm
npm install
```

### 本地开发

```bash
# 启动前端开发服务器
pnpm dev:client

# 启动后端服务器 (AI 代理 + 项目管理)
pnpm dev:server

# 同时启动前后端
pnpm dev
```

- 前端地址：http://localhost:5173
- 后端地址：http://localhost:3001

### MongoDB 配置 (可选)

如需项目持久化功能，请先启动 MongoDB：

```bash
# 使用 Docker 启动 MongoDB
docker-compose up -d

# 或手动启动 MongoDB
mongod --dbpath /path/to/data
```

环境变量配置（`server/.env`）：

```env
MONGODB_URI=mongodb://localhost:27017/vela
PORT=3001
```

### 生产构建

```bash
# 构建前后端
pnpm build

# 只构建前端
pnpm build:client

# 只构建后端
pnpm build:server

# 预览构建结果
pnpm preview
```

## 📦 组件库

项目内置 `@twi1i9ht/visual-lib` 组件库，提供开箱即用的可视化组件。

### 图表组件 (ECharts)

| 组件        | 说明       | 特性                 |
| ----------- | ---------- | -------------------- |
| 折线图      | 趋势展示   | 支持多系列、面积填充 |
| 柱状图      | 对比分析   | 支持堆叠、分组       |
| 饼图/环形图 | 占比展示   | 支持高亮、标签配置   |
| 雷达图      | 多维度对比 | 自定义指标维度       |
| 仪表盘      | 进度展示   | 支持阈值标记         |
| 散点图      | 分布展示   | 支持气泡图           |
| 漏斗图      | 转化分析   | 支持排序             |
| 桑基图      | 流向分析   | 支持节点配置         |

### KPI 指标组件

| 组件     | 说明             |
| -------- | ---------------- |
| 统计卡片 | 数据指标展示卡片 |
| 数字滚动 | 数字动画效果     |
| 进度条   | 百分比进度展示   |
| 徽章     | 状态标识         |
| 信息盒子 | 信息提示框       |
| 文本     | 富文本显示       |

### 数据展示组件

| 组件     | 说明                         |
| -------- | ---------------------------- |
| 数据表格 | 表格数据展示，支持分页、排序 |
| 列表     | 列表数据展示                 |
| 时间线   | 时间轴展示                   |
| 卡片网格 | 卡片式布局                   |
| 透视表   | 多维数据分析                 |

### 控件组件

| 组件     | 说明            |
| -------- | --------------- |
| 下拉选择 | 单选/多选下拉框 |
| 日期范围 | 日期区间选择    |
| 搜索框   | 文本搜索输入    |
| 滑块     | 数值滑动选择    |
| 开关     | 开关切换        |
| 复选框组 | 多项复选        |
| 按钮组   | 按钮集合        |

### 地图组件 (Leaflet)

| 组件           | 说明       |
| -------------- | ---------- |
| vMap           | 地图容器   |
| vTileLayer     | 瓦片图层   |
| vMarker        | 地图标记点 |
| vMarkerCluster | 标记聚合   |
| vHeatmap       | 热力图     |
| vLegend        | 地图图例   |
| vScale         | 比例尺     |
| vLayerControl  | 图层控制   |

### 布局组件

| 组件   | 说明          |
| ------ | ------------- |
| 行/列  | Flexbox 布局  |
| 网格   | Grid 网格布局 |
| 面板   | 容器面板      |
| 标签页 | Tab 切换容器  |
| 弹窗   | Modal 对话框  |

### 媒体组件

| 组件   | 说明       |
| ------ | ---------- |
| 图片   | 图片展示   |
| 视频   | 视频播放器 |
| 轮播图 | 图片轮播   |

> 📖 完整组件文档：https://visual-lib-docs.vercel.app/

## 🤖 AI 智能助手

内置多家 AI 服务提供商支持，助力快速搭建大屏。

### 支持的 AI 模型

| Provider   | 服务商           | 网络要求 | 状态      |
| ---------- | ---------------- | -------- | --------- |
| `gemini`   | Google Gemini    | 需代理   | ✅ 已测试 |
| `openai`   | OpenAI GPT       | 需代理   | 待测试    |
| `claude`   | Anthropic Claude | 需代理   | 待测试    |
| `qwen`     | 阿里通义千问     | 国内直连 | 待测试    |
| `deepseek` | DeepSeek         | 国内直连 | 待测试    |

> 💡 **提示**：预览地址 (https://vela-lowcode-editor.vercel.app/) 目前使用的是 Gemini 免费 API

### 启动 AI 代理服务

```bash
# 进入 server 目录
cd server

# 安装依赖
pnpm install

# 启动服务（指定 API Key 和 Provider）
pnpm start -- --key=你的API密钥 --provider=gemini

# 或使用环境变量
export GEMINI_API_KEY=你的API密钥
pnpm dev
```

### AI 功能

- **智能生成组件** - 通过自然语言描述生成组件配置
- **布局优化建议** - AI 辅助优化页面布局
- **数据填充** - 自动生成 Mock 数据
- **代码解释** - 解释生成的代码逻辑

## 🧪 测试

项目包含完整的测试套件，覆盖单元测试、集成测试和 E2E 测试。

### 运行测试

```bash
# 运行所有测试 (watch 模式)
pnpm test

# 运行单次测试 (CI 模式)
pnpm test -- --run

# 运行特定测试文件
pnpm test tests/unit/toCode.spec.ts

# 更新快照
pnpm test -- -u

# E2E 测试 (Playwright)
pnpm test:e2e

# 代码检查 (ESLint)
pnpm lint

# 类型检查
pnpm type-check
```

### 测试覆盖

- **单元测试** (Vitest)
  - 组件逻辑测试
  - 事件执行器测试
  - 数据绑定引擎测试
  - 工具函数测试
- **集成测试**
  - 事件流集成测试
  - ECharts 集成测试
  - Leaflet 集成测试
- **E2E 测试** (Playwright)
  - 用户操作流程测试
  - 跨浏览器兼容性测试

### CI/CD

项目配置了 GitHub Actions 自动化流程：

- ✅ ESLint 代码检查
- ✅ TypeScript 类型检查
- ✅ 单元测试
- ✅ 前后端构建测试
- ✅ E2E 测试

## 📁 项目结构

```
vela-lowcode-editor/
├── src/                          # 前端源代码
│   ├── components/              # 编辑器 UI 组件
│   │   ├── Editor/             # 编辑器核心（画布、Shape等）
│   │   ├── header/             # 顶部工具栏
│   │   ├── siderBar/           # 侧边栏（组件库、属性、事件、数据联动）
│   │   ├── componentBar/       # 组件库面板
│   │   ├── dialogs/            # 对话框组件
│   │   └── AIAssist/           # AI 助手面板
│   │
│   ├── customComponents/        # 低代码可拖拽组件库
│   │   ├── chart/              # 图表组件（折线图、柱状图等）
│   │   ├── kpi/                # KPI 指标组件
│   │   ├── map/                # 地图组件（基于 Leaflet）
│   │   ├── data/               # 数据展示组件（表格、列表等）
│   │   ├── controls/           # 控件组件（下拉、日期选择等）
│   │   ├── layout/             # 布局组件（行、列、面板等）
│   │   ├── content/            # 内容组件（文本、图片等）
│   │   ├── media/              # 媒体组件（视频、轮播图等）
│   │   ├── advanced/           # 高级组件
│   │   └── registry.ts         # 组件注册表
│   │
│   ├── runtime/                 # 运行时引擎
│   │   ├── useEventExecutor.ts     # 事件执行器（动作处理）
│   │   ├── useDataBindingEngine.ts # 数据联动引擎
│   │   └── RuntimeRenderer.vue     # 运行时渲染器
│   │
│   ├── stores/                  # Pinia 状态管理
│   │   ├── component.ts        # 组件状态
│   │   ├── project.ts          # 项目状态
│   │   ├── size.ts             # 画布尺寸
│   │   ├── suggestion.ts       # AI 建议
│   │   ├── componentOps/       # 组件操作（复制、删除等）
│   │   └── dataLinkage/        # 数据联动状态
│   │
│   ├── services/                # 服务层
│   │   ├── http.ts             # HTTP 请求封装
│   │   ├── projects.ts         # 项目 API
│   │   └── suggestService.ts   # AI 建议服务
│   │
│   ├── datasource/              # 数据源
│   │   └── useDataSource.ts    # 数据源 Hook
│   │
│   ├── templates/               # 内置大屏模板
│   │   └── index.ts            # 模板配置
│   │
│   ├── utils/                   # 工具函数
│   │   ├── projectGenerator.ts # 完整项目代码生成
│   │   ├── toCode.ts           # 单页面代码生成
│   │   ├── setValueByPath.ts   # 对象路径设置
│   │   └── snap.ts             # 吸附算法
│   │
│   ├── views/                   # 页面视图
│   │   ├── EditorView.vue      # 编辑器主页面
│   │   ├── RuntimeView.vue     # 运行时预览页面
│   │   └── RuntimeComponent.vue # 运行时组件包装器
│   │
│   ├── router/                  # 路由配置
│   │   └── index.ts
│   │
│   ├── styles/                  # 全局样式
│   │   ├── theme.css           # 主题变量
│   │   └── animations.css      # 动画效果
│   │
│   ├── types/                   # TypeScript 类型定义
│   │   ├── components.ts       # 组件类型
│   │   ├── page.ts             # 页面类型
│   │   ├── store.ts            # Store 类型
│   │   └── api.ts              # API 类型
│   │
│   ├── App.vue                 # 根组件
│   └── main.ts                 # 入口文件
│
├── packages/                    # Monorepo 包
│   └── visual-lib/             # 独立组件库 @twi1i9ht/visual-lib
│       ├── src/                # 组件源码
│       ├── docs/               # 组件文档（VitePress）
│       ├── index.ts            # 导出入口
│       └── vite.config.ts      # 组件库构建配置
│
├── server/                      # 后端服务
│   ├── index.ts                # 服务入口
│   ├── db.ts                   # MongoDB 连接
│   ├── models/                 # 数据模型
│   │   └── Project.ts          # 项目模型
│   └── routes/                 # API 路由
│       ├── ai.ts               # AI 代理路由
│       ├── projects.ts         # 项目管理路由
│       └── mock.ts             # Mock 数据路由
│
├── tests/                       # 测试文件
│   ├── unit/                   # 单元测试
│   ├── integration/            # 集成测试
│   ├── components/             # 组件测试
│   ├── e2e/                    # E2E 测试（Playwright）
│   └── setupTests.ts           # 测试配置
│
├── public/                      # 静态资源
├── dist/                        # 构建输出
├── .github/                     # GitHub 配置
│   └── workflows/              # CI/CD 工作流
│       └── ci.yml              # 持续集成配置
│
├── docker-compose.yml          # Docker Compose 配置
├── vite.config.ts              # Vite 配置
├── tsconfig.json               # TypeScript 配置
├── vitest.config.ts            # Vitest 配置
├── playwright.config.ts        # Playwright 配置
└── pnpm-workspace.yaml         # pnpm 工作区配置
```

## 🛠️ 技术栈

### 前端核心

| 技术           | 版本 | 用途                            |
| -------------- | ---- | ------------------------------- |
| **Vue 3**      | 3.5+ | 渐进式前端框架，Composition API |
| **TypeScript** | 5.x  | 类型安全的 JavaScript 超集      |
| **Vite**       | 6.x  | 下一代前端构建工具              |
| **Pinia**      | 3.x  | Vue 状态管理库                  |
| **Vue Router** | 4.x  | Vue 官方路由库                  |

### UI 与可视化

| 技术                      | 用途             |
| ------------------------- | ---------------- |
| **Element Plus**          | UI 组件库        |
| **ECharts**               | 数据图表库       |
| **vue-echarts**           | Vue ECharts 封装 |
| **Leaflet**               | 地图库           |
| **leaflet.heat**          | 热力图插件       |
| **leaflet.markercluster** | 标记聚合插件     |

### 工具库

| 库               | 用途                  |
| ---------------- | --------------------- |
| **lodash-es**    | JavaScript 实用工具库 |
| **nanoid**       | 唯一 ID 生成          |
| **axios**        | HTTP 请求库           |
| **jszip**        | ZIP 文件处理          |
| **file-saver**   | 文件下载              |
| **marked**       | Markdown 解析         |
| **highlight.js** | 代码高亮              |
| **dompurify**    | XSS 防护              |

### 开发工具

| 工具           | 用途           |
| -------------- | -------------- |
| **Vitest**     | 单元测试框架   |
| **Playwright** | E2E 测试框架   |
| **ESLint**     | 代码检查工具   |
| **Prettier**   | 代码格式化工具 |
| **VitePress**  | 文档生成工具   |

### 后端技术

| 技术         | 用途         |
| ------------ | ------------ |
| **Node.js**  | 运行时环境   |
| **Express**  | Web 框架     |
| **MongoDB**  | NoSQL 数据库 |
| **Mongoose** | MongoDB ODM  |
| **cors**     | 跨域处理     |

### 核心算法与设计

- **事件执行器** - 基于动作类型的事件分发系统
- **数据联动引擎** - 基于 Vue Watch 的响应式数据绑定
- **吸附算法** - 组件对齐和吸附计算
- **代码生成器** - AST 级别的 Vue 代码生成
- **运行时渲染** - 递归组件树渲染引擎

## 📖 使用指南

### 基础操作

1. **添加组件**
   - 从左侧组件库拖拽组件到画布
   - 或使用 AI 助手生成组件

2. **编辑组件**
   - 点击选中组件
   - 在右侧属性面板编辑组件属性
   - 支持拖动、缩放、旋转

3. **配置事件**
   - 选中组件后切换到"事件"标签
   - 添加事件监听（点击、hover等）
   - 配置动作（切换可见性、跳转页面等）

4. **数据联动**
   - 在"数据联动"标签添加绑定关系
   - 选择源组件和目标组件
   - 配置属性路径和转换器

5. **导出项目**
   - 点击顶部"导出"按钮
   - 选择导出类型（完整项目/单页面）
   - 下载生成的代码包

### 进阶功能

#### 事件系统使用

```typescript
// 事件配置示例
{
  events: {
    click: [
      {
        id: 'action-1',
        type: 'toggle-visibility',
        targetId: 'component-2',
        delay: 0,
      },
      {
        id: 'action-2',
        type: 'show-tooltip',
        message: '操作成功',
        messageType: 'success',
      },
    ]
  }
}
```

支持的动作类型：

- `toggle-visibility` - 切换组件可见性
- `show-tooltip` - 显示提示消息
- `navigate-page` - 页面跳转
- `highlight` - 高亮组件
- `custom-script` - 执行自定义脚本
- `fullscreen` - 全屏显示
- `custom-event` - 触发自定义事件

#### 数据联动配置

```typescript
// 数据绑定示例
{
  dataBindings: [
    {
      sourceId: 'slider-1',
      sourcePath: 'props.value',
      targetPath: 'props.text',
      transformer: {
        type: 'expression',
        expression: 'value * 2', // 转换表达式
      },
    },
  ]
}
```

转换器类型：

- `expression` - JavaScript 表达式
- `template` - 模板字符串 `${value}`

### 项目导出说明

导出的项目结构：

```
my-project/
├── src/
│   ├── pages/              # 所有页面 .vue 文件
│   ├── runtime/            # 运行时库（事件执行器、数据绑定引擎）
│   ├── router/             # Vue Router 配置
│   ├── App.vue            # 根组件
│   └── main.ts            # 入口文件
├── public/                # 静态资源
├── package.json           # 项目配置
├── vite.config.ts         # Vite 配置
└── tsconfig.json          # TypeScript 配置
```

运行导出的项目：

```bash
# 进入项目目录
cd my-project

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## � 部署

### Vercel 部署（推荐）

前端可以直接部署到 Vercel：

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel
```

或通过 GitHub 集成自动部署。

### 后端部署

#### Render.com

1. 连接 GitHub 仓库
2. 选择 `server` 目录作为根目录
3. 配置环境变量：
   - `MONGODB_URI`
   - `PORT`
   - AI API Keys
4. 部署

#### Docker 部署

```bash
# 使用 Docker Compose
docker-compose up -d

# 或手动构建
docker build -t webgis-lowcode .
docker run -p 5173:5173 -p 3001:3001 webgis-lowcode
```

### 环境变量配置

#### 前端环境变量 (`.env`)

```env
VITE_API_BASE_URL=https://your-backend.com
VITE_ENABLE_AI=true
```

#### 后端环境变量 (`server/.env`)

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/vela
PORT=3001

# AI Providers
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
CLAUDE_API_KEY=your_claude_key
QWEN_API_KEY=your_qwen_key
DEEPSEEK_API_KEY=your_deepseek_key

# CORS
ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出建议！

### 贡献流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 开发规范

- 遵循 ESLint 规则
- 编写单元测试覆盖新功能
- 更新相关文档
- 保持代码简洁可读

### 报告问题

在提交 Issue 前，请确保：

- 搜索已存在的 Issue
- 提供详细的复现步骤
- 附上错误截图或日志
- 说明运行环境（Node 版本、浏览器等）

## � 开源协议

本项目采用 [MIT License](./LICENSE) 开源协议。

## 🔗 相关链接

- **在线预览**：https://vela-lowcode-editor.vercel.app/
- **后端服务**：https://vela-lowcode-editor.onrender.com
- **组件库文档**：https://visual-lib-docs.vercel.app/
- **GitHub 仓库**：https://github.com/TWILIGHT-wyf/vela-lowcode-editor
- **问题反馈**：https://github.com/TWILIGHT-wyf/vela-lowcode-editor/issues

## ❓ 常见问题

<details>
<summary><b>如何添加自定义组件？</b></summary>

1. 在 `src/customComponents` 对应分类目录下创建组件
2. 创建 schema.ts 定义组件配置
3. 在 `registry.ts` 中注册组件
4. 重启开发服务器

</details>

<details>
<summary><b>如何连接自己的 MongoDB？</b></summary>

在 `server/.env` 中配置：

```env
MONGODB_URI=mongodb://your-host:27017/your-database
```

</details>

<details>
<summary><b>生成的代码可以独立运行吗？</b></summary>

可以。导出的完整项目包含所有必需的依赖和运行时代码，安装依赖后即可运行。

</details>

<details>
<summary><b>支持哪些浏览器？</b></summary>

支持所有现代浏览器：

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

</details>

<details>
<summary><b>如何实现组件间通信？</b></summary>

使用事件系统：

1. 在组件A配置自定义事件
2. 在组件B配置监听该事件
3. 配置响应动作

或使用数据联动绑定组件属性。

</details>

## 🎯 路线图

- [x] 基础拖拽编辑器
- [x] 组件库集成
- [x] 事件联动系统
- [x] 数据绑定引擎
- [x] AI 智能助手
- [x] 完整项目导出
- [x] MongoDB 持久化
- [x] 单元测试和 E2E 测试
- [ ] 组件市场
- [ ] 在线协作编辑
- [ ] 版本管理和回滚
- [ ] 更多 AI 模型支持
- [ ] 组件性能监控
- [ ] 国际化支持

## 📊 项目统计

- **组件数量**：50+
- **测试覆盖率**：>80%
- **代码行数**：~20,000
- **开发时长**：持续迭代中

## 🙏 致谢

本项目在设计和实现上深受以下优秀开源项目启发：

### 灵感来源

- **[visual-drag-demo](https://github.com/woai3c/visual-drag-demo)** by [@woai3c](https://github.com/woai3c)  
  为本项目的拖拽编辑器架构提供了重要参考

- **[vue-form-design](https://github.com/337547038/vue-form-design)** by [@337547038](https://github.com/337547038)  
  组件配置面板的设计思路借鉴了该项目

### 核心依赖

感谢以下优秀的开源项目：

| 项目                                                 | 作者/组织                 | 用途                     |
| ---------------------------------------------------- | ------------------------- | ------------------------ |
| [Vue.js](https://vuejs.org/)                         | Evan You & Vue Team       | 渐进式前端框架           |
| [Vite](https://vitejs.dev/)                          | Evan You & Vite Team      | 下一代前端构建工具       |
| [Element Plus](https://element-plus.org/)            | Element Plus Team         | Vue 3 UI 组件库          |
| [ECharts](https://echarts.apache.org/)               | Apache ECharts Team       | 数据可视化图表库         |
| [vue-echarts](https://github.com/ecomfe/vue-echarts) | Justineo                  | Vue ECharts 封装         |
| [Leaflet](https://leafletjs.com/)                    | Vladimir Agafonkin        | 开源地图库               |
| [Pinia](https://pinia.vuejs.org/)                    | Eduardo San Martin Morote | Vue 状态管理             |
| [TypeScript](https://www.typescriptlang.org/)        | Microsoft                 | 类型安全的 JavaScript    |
| [Vitest](https://vitest.dev/)                        | Anthony Fu                | Vite 原生测试框架        |
| [Playwright](https://playwright.dev/)                | Microsoft                 | 现代化 E2E 测试          |
| [VitePress](https://vitepress.dev/)                  | Evan You                  | Vue 驱动的静态网站生成器 |
| [lodash](https://lodash.com/)                        | John-David Dalton         | JavaScript 工具库        |
| [marked](https://marked.js.org/)                     | Christopher Jeffrey       | Markdown 解析器          |
| [highlight.js](https://highlightjs.org/)             | Ivan Sagalaev             | 语法高亮库               |

### 特别感谢

感谢所有为本项目提出建议、报告问题和贡献代码的开发者！

如果你是上述项目的作者或维护者，若希望我更改致谢方式或补充更详尽的署名，请在 Issue 中告知。

---

<p align="center">
  <b>Vela LowCode Editor</b>
</p>
<p align="center">
  让数据可视化大屏搭建变得简单而高效
</p>
<p align="center">
  如果这个项目对你有帮助，请给个 ⭐️ Star 支持一下！
</p>
<p align="center">
  <a href="https://github.com/TWILIGHT-wyf/vela-lowcode-editor/stargazers">
    <img src="https://img.shields.io/github/stars/TWILIGHT-wyf/vela-lowcode-editor?style=social" alt="GitHub stars">
  </a>
  <a href="https://github.com/TWILIGHT-wyf/vela-lowcode-editor/network/members">
    <img src="https://img.shields.io/github/forks/TWILIGHT-wyf/vela-lowcode-editor?style=social" alt="GitHub forks">
  </a>
</p>
