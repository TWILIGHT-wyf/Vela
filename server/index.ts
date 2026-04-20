import express from 'express'
import http from 'http'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDB } from './db.js'
import projectsRouter from './routes/projects.js'
import mockRouter from './routes/mock.js'

dotenv.config()

const app = express()
const PORT = parseInt(process.env.PORT || process.env.PROXY_PORT || '3001', 10)

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use((req, _res, next) => {
  const timestamp = new Date().toLocaleTimeString('zh-CN')
  console.log(`[${timestamp}] ${req.method} ${req.path}`)
  next()
})

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: 'connected',
    },
  })
})

app.use('/api/projects', projectsRouter)
app.use('/api/mock', mockRouter)

app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
  })
})

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  void _next
  console.error('服务器错误:', err)
  res.status(500).json({
    error: '服务器内部错误',
    message: err.message,
  })
})

async function startServer() {
  await connectDB()

  const server = http.createServer(app)

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EACCES') {
      console.error(`\nEACCES: 无法监听端口 ${PORT}，请尝试：`)
      console.error('  1. 使用管理员权限运行')
      console.error('  2. 更换端口: PORT=3002 pnpm run dev')
      console.error('  3. 检查防火墙/杀毒软件设置\n')
      process.exit(1)
    }

    if (err.code === 'EADDRINUSE') {
      console.error(`\nEADDRINUSE: 端口 ${PORT} 已被占用，请尝试：`)
      console.error(`  1. 结束占用进程: netstat -ano | findstr :${PORT}`)
      console.error('  2. 更换端口: PORT=3003 pnpm run dev\n')
      process.exit(1)
    }

    throw err
  })

  server.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(60))
    console.log('Vela 后端服务已启动')
    console.log('='.repeat(60))
    console.log(`地址: http://localhost:${PORT}`)
    console.log('='.repeat(60))
    console.log('API 端点:')
    console.log(`  GET  http://localhost:${PORT}/api/health`)
    console.log(`  GET  http://localhost:${PORT}/api/projects`)
    console.log(`  POST http://localhost:${PORT}/api/projects`)
    console.log(`  GET  http://localhost:${PORT}/api/mock/*`)
    console.log('='.repeat(60))
  })
}

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
