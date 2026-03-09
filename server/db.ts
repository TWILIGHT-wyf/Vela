import mongoose from 'mongoose'
import dotenv from 'dotenv'

// 确保环境变量已加载
dotenv.config()

const MONGO_URI =
  process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vela'

export async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI)
    console.log('✅ MongoDB 连接成功')
  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error)
    // 不退出进程，让 AI 代理和测试接口继续可用
  }
}
