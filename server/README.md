# Vela Server

轻量级后端服务，当前主要负责 MongoDB 项目存储和 Mock 数据源接口。

## 当前职责

- MongoDB 项目持久化
- 项目 CRUD 接口
- 面向编辑器演示和联调的 Mock 数据接口

## 快速开始

### 1. 安装依赖

```bash
cd server
pnpm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env`：

```bash
cp .env.example .env
```

最少需要确认：

```env
PORT=3001
MONGO_URI=mongodb://127.0.0.1:27017/vela
```

### 3. 启动 MongoDB

确保 MongoDB 服务已运行：

```bash
# 方式 1：本地 MongoDB
mongod --dbpath /path/to/data

# 方式 2：Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. 启动服务

```bash
# 开发模式
pnpm run dev

# 生产模式
pnpm start
```

默认地址：`http://localhost:3001`

## API 概览

### 健康检查

```text
GET /api/health
```

### 项目管理

```text
GET    /api/projects
GET    /api/projects/:id
POST   /api/projects
PUT    /api/projects/:id
DELETE /api/projects/:id
```

创建项目示例：

```json
POST /api/projects
{
  "name": "我的项目",
  "description": "项目描述",
  "cover": "https://example.com/cover.jpg"
}
```

### Mock 数据源

```text
GET /api/mock/text
GET /api/mock/list
GET /api/mock/time
GET /api/mock/chart/simple
GET /api/mock/chart/realtime
GET /api/mock/chart/pie
GET /api/mock/table-data
GET /api/mock/orders
GET /api/mock/users
GET /api/mock/map/markers
GET /api/mock/stat/realtime
GET /api/mock/progress/realtime
```

## 目录结构

```text
server/
├─ index.ts
├─ db.ts
├─ models/
│  └─ Project.ts
├─ routes/
│  ├─ projects.ts
│  └─ mock.ts
├─ package.json
├─ tsconfig.json
├─ .env
└─ .env.example
```

## 环境变量

| Variable    | Description    | Default                          | Required |
| ----------- | -------------- | -------------------------------- | -------- |
| `PORT`      | 服务端口       | `3001`                           | No       |
| `MONGO_URI` | MongoDB 连接串 | `mongodb://127.0.0.1:27017/vela` | Yes      |

## 开发说明

### 添加新的数据模型

1. 在 `models/` 下创建新的 Schema 文件。
2. 在对应路由文件里导入并使用。

### 添加新的接口

1. 在 `routes/` 下创建新的路由文件。
2. 在 `index.ts` 中注册路由。

## 故障排查

### MongoDB 连接失败

- 确认 MongoDB 服务已启动。
- 检查 `MONGO_URI` 是否正确。
- 检查本地端口和网络连接。

### 端口被占用

修改 `.env` 中的 `PORT`：

```env
PORT=3002
```

## 技术栈

- Node.js
- TypeScript
- Express
- Mongoose
- nanoid

## 许可证

MIT
