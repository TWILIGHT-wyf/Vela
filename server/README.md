# Vela 后端服务

集成了 MongoDB 项目存储、AI 代理和测试数据源接口的轻量级后端服务。

## 功能特性

- **MongoDB 项目存储**: 支持完整的项目 CRUD 操作，存储低代码编辑器的项目数据
- **AI 代理**: 支持多家 AI 提供商（Gemini、OpenAI、Claude、通义千问、DeepSeek）
- **测试数据源**: 提供丰富的模拟数据接口，用于测试可视化组件

## 快速开始

### 1. 安装依赖

```bash
cd server
pnpm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写配置：

```bash
cp .env.example .env
```

必需配置：

```env
# MongoDB 连接（本地或远程）
MONGO_URI=mongodb://127.0.0.1:27017/vela

# AI API Key（可选，如果需要使用 AI 功能）
AI_API_KEY=your_api_key_here
AI_PROVIDER=gemini
```

### 3. 启动 MongoDB

确保 MongoDB 服务正在运行：

```bash
# 方式 1: 本地 MongoDB
mongod --dbpath /path/to/data

# 方式 2: Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# 方式 3: 使用 MongoDB Atlas（云服务）
# 直接在 .env 中配置连接字符串
```

### 4. 启动服务器

```bash
# 开发模式（支持热重载）
pnpm run dev

# 生产模式
pnpm start
```

服务器将在 `http://localhost:3001` 启动。

## API 端点

### 健康检查

```
GET /api/health
```

### 项目管理

```
GET    /api/projects           # 获取所有项目
GET    /api/projects/:id       # 获取单个项目
POST   /api/projects           # 创建项目
PUT    /api/projects/:id       # 更新项目
DELETE /api/projects/:id       # 删除项目
```

**创建项目示例**:

```json
POST /api/projects
{
  "name": "我的项目",
  "description": "项目描述",
  "cover": "https://example.com/cover.jpg"
}
```

### AI 代理

```
POST /api/ai/generate          # AI 文本生成
GET  /api/ai/models            # 获取支持的模型列表
```

**AI 生成示例**:

```json
POST /api/ai/generate
{
  "messages": [
    { "role": "user", "content": "介绍一下 Vela" }
  ],
  "temperature": 0.7,
  "max_tokens": 4096,
  "provider": "gemini",
  "model": "gemini-2.0-flash"
}
```

### 测试数据源

```
GET /api/mock/text             # 文本数据
GET /api/mock/list             # 列表数据
GET /api/mock/time             # 实时时间
GET /api/mock/chart/simple     # 简单图表数据
GET /api/mock/chart/realtime   # 实时图表数据
GET /api/mock/chart/pie        # 饼图数据
GET /api/mock/table-data       # 表格数据
GET /api/mock/map/markers      # 地图标记点
GET /api/mock/stat/realtime    # 实时统计
GET /api/mock/progress/realtime # 实时进度
```

## 项目结构

```
server/
├── index.ts              # 主入口文件
├── db.ts                 # MongoDB 连接配置
├── models/
│   └── Project.ts        # 项目数据模型
├── routes/
│   ├── projects.ts       # 项目管理路由
│   ├── ai.ts             # AI 代理路由
│   └── mock.ts           # 测试数据源路由
├── package.json          # 依赖配置
├── tsconfig.json         # TypeScript 配置
├── .env                  # 环境变量（需自行创建）
└── .env.example          # 环境变量示例
```

## 环境变量说明

| 变量名        | 说明               | 默认值                           | 必需           |
| ------------- | ------------------ | -------------------------------- | -------------- |
| `PORT`        | 服务器端口         | `3001`                           | 否             |
| `MONGO_URI`   | MongoDB 连接字符串 | `mongodb://127.0.0.1:27017/vela` | 是             |
| `AI_API_KEY`  | AI API 密钥        | -                                | 使用 AI 时必需 |
| `AI_PROVIDER` | AI 提供商          | `gemini`                         | 否             |
| `AI_MODEL`    | AI 模型            | 使用默认模型                     | 否             |
| `HTTPS_PROXY` | 代理服务器         | `http://127.0.0.1:7897`          | 否             |

## 开发指南

### 添加新的数据模型

1. 在 `models/` 目录创建新的 Schema 文件
2. 在对应的路由文件中导入并使用

### 添加新的 API 端点

1. 在 `routes/` 目录创建新的路由文件
2. 在 `index.ts` 中注册路由

### 数据库迁移

MongoDB 是无模式数据库，Schema 变更会自动应用。如需初始化数据：

```javascript
// 可以在 db.ts 中添加初始化逻辑
export async function seedDatabase() {
  // 初始化数据...
}
```

## 故障排查

### MongoDB 连接失败

- 检查 MongoDB 服务是否启动
- 验证 `MONGO_URI` 配置是否正确
- 检查防火墙和网络连接

### AI API 调用失败

- 确认 `AI_API_KEY` 已正确配置
- 检查网络代理设置（国外服务需要代理）
- 查看服务器日志了解具体错误

### 端口被占用

修改 `.env` 中的 `PORT` 配置：

```env
PORT=3002
```

## 技术栈

- **Node.js** + **TypeScript**
- **Express** - Web 框架
- **Mongoose** - MongoDB ODM
- **undici** - HTTP 客户端（支持代理）
- **nanoid** - ID 生成

## 许可证

MIT
