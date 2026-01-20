/**
 * 低代码平台后端服务
 * 集成功能：
 * - MongoDB 项目数据存储
 * - AI 代理（支持多模型）
 * - 测试数据源接口
 */

import express from 'express'
import http from 'http'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDB } from './db.js'
import projectsRouter from './routes/projects.js'
import aiRouter from './routes/ai.js'
import mockRouter from './routes/mock.js'

// 加载环境变量
dotenv.config()

const app = express()
const PORT = parseInt(process.env.PORT || process.env.PROXY_PORT || '3002', 10)

// ==================== 中间件 ====================
app.use(cors())
app.use(express.json({ limit: '10mb' })) // 支持较大的项目数据

// 请求日志
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleTimeString('zh-CN')
  console.log(`[${timestamp}] ${req.method} ${req.path}`)
  next()
})

// ==================== 路由 ====================

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: 'connected',
      ai: process.env.AI_API_KEY ? 'configured' : 'not configured',
    },
  })
})

// 项目管理
app.use('/api/projects', projectsRouter)

// AI 代理
app.use('/api/ai', aiRouter)

// 测试数据源（Mock API）
app.use('/api/mock', mockRouter)

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
  })
})

// 错误处理
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('服务器错误:', err)
  res.status(500).json({
    error: '服务器内部错误',
    message: err.message,
  })
})

// ==================== 启动服务器 ====================
async function startServer() {
  // 连接 MongoDB
  await connectDB()

  // 启动 HTTP 服务（使用 http.Server 以便监听错误事件）
  const server = http.createServer(app)

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EACCES') {
      console.error(`\n EACCES: 无法监听端口 ${PORT}，请尝试：`)
      console.error(`   1. 使用管理员权限运行`)
      console.error(`   2. 更换端口: PORT=3002 pnpm run dev`)
      console.error(`   3. 检查防火墙/杀毒软件设置\n`)
      process.exit(1)
    }
    if (err.code === 'EADDRINUSE') {
      console.error(`\n EADDRINUSE: 端口 ${PORT} 已被占用，请尝试：`)
      console.error(`   1. 结束占用进程: netstat -ano | findstr :${PORT}`)
      console.error(`   2. 更换端口: PORT=3003 pnpm run dev\n`)
      process.exit(1)
    }
    throw err
  })

  server.listen(PORT, '0.0.0.0', () => {
    console.log('═'.repeat(60))
    console.log(' Vela 后端服务已启动')
    console.log('═'.repeat(60))
    console.log(` 地址: http://localhost:${PORT}`)
    console.log(` AI Provider: ${process.env.AI_PROVIDER || 'gemini'}`)
    console.log('═'.repeat(60))
    console.log(' API 端点:')
    console.log(`   GET  http://localhost:${PORT}/api/health`)
    console.log(`   GET  http://localhost:${PORT}/api/projects`)
    console.log(`   POST http://localhost:${PORT}/api/projects`)
    console.log(`   POST http://localhost:${PORT}/api/ai/generate`)
    console.log(`   GET  http://localhost:${PORT}/api/mock/*`)
    console.log('═'.repeat(60))
  })
}

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n正在关闭服务器...')
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n正在关闭服务器...')
  process.exit(0)
})

startServer().catch((error) => {
  console.error('启动失败:', error)
  process.exit(1)
})
