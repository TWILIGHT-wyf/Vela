import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const MONGO_URI =
  process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vela'

export async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI)
    console.log('MongoDB 连接成功')
  } catch (error) {
    console.error('MongoDB 连接失败:', error)
    // Keep the process alive so non-database endpoints can still respond.
  }
}
