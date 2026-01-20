import mongoose from 'mongoose'
import { nanoid } from 'nanoid'

// Project Schema - 存储低代码项目完整数据
const ProjectSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => nanoid(10), // 使用短 ID
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    cover: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    // V1.5 完整项目结构存储
    schema: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // 兼容旧版结构 (可选，后续可移除)
    pages: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
  },
  {
    timestamps: true, // 自动添加 createdAt 和 updatedAt
  },
)

// 添加索引
ProjectSchema.index({ name: 1 })
ProjectSchema.index({ updatedAt: -1 })

export const Project = mongoose.model('Project', ProjectSchema)
