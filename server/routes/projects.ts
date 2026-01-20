import { Router } from 'express'
import { Project } from '../models/Project.js'
import { nanoid } from 'nanoid'

const router = Router()

// 获取所有项目列表
router.get('/', async (req, res) => {
  try {
    console.log('📋 开始查询项目列表...')
    const projects = await Project.find()
      .select('name cover description createdAt updatedAt schema')
      .sort({ updatedAt: -1 })
      .lean()

    console.log(`✅ 查询到 ${projects.length} 个项目`)

    // 为每个项目添加页面数量统计
    const projectsWithStats = projects.map((p) => ({
      ...p,
      pageCount: p.schema?.pages?.length || p.pages?.length || 0,
    }))

    res.json({
      success: true,
      data: projectsWithStats,
    })
  } catch (error) {
    console.error('❌ 获取项目列表失败:', error)
    console.error('错误详情:', {
      name: (error as Error).name,
      message: (error as Error).message,
      stack: (error as Error).stack,
    })
    res.status(500).json({
      success: false,
      error: '获取项目列表失败',
      message: (error as Error).message,
    })
  }
})

// 获取单个项目详情
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).lean()

    if (!project) {
      return res.status(404).json({
        success: false,
        error: '项目不存在',
      })
    }

    res.json({
      success: true,
      data: project,
    })
  } catch (error) {
    console.error('获取项目详情失败:', error)
    res.status(500).json({
      success: false,
      error: '获取项目详情失败',
      message: (error as Error).message,
    })
  }
})

// 创建新项目
router.post('/', async (req, res) => {
  try {
    const { name, description, cover, schema } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: '项目名称不能为空',
      })
    }

    // 如果前端没有传 schema，生成一个默认的 V1.5 schema
    const projectSchema = schema || {
      version: '1.5.0',
      name: name.trim(),
      description: description || '',
      config: {
        layout: 'pc',
        theme: 'light',
      },
      pages: [
        {
          id: nanoid(),
          name: 'Home',
          path: '/',
          config: { layout: 'free' },
          children: {
            id: 'root',
            componentName: 'Page',
            children: [],
          },
        },
      ],
    }

    const project = await Project.create({
      name: name.trim(),
      description: description || '',
      cover: cover || '',
      schema: projectSchema,
      pages: [], // 保持为空，使用 schema 字段存储
    })

    console.log('✅ 项目创建成功，ID:', project._id) // 添加日志

    res.status(201).json({
      success: true,
      data: project,
    })
  } catch (error) {
    console.error('创建项目失败:', error)
    res.status(500).json({
      success: false,
      error: '创建项目失败',
      message: (error as Error).message,
    })
  }
})

// 更新项目
router.put('/:id', async (req, res) => {
  try {
    const { name, description, cover, schema } = req.body

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (cover !== undefined) updateData.cover = cover
    if (schema !== undefined) updateData.schema = schema

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true },
    )

    if (!project) {
      return res.status(404).json({
        success: false,
        error: '项目不存在',
      })
    }

    res.json({
      success: true,
      data: project,
    })
  } catch (error) {
    console.error('更新项目失败:', error)
    res.status(500).json({
      success: false,
      error: '更新项目失败',
      message: (error as Error).message,
    })
  }
})

// 删除项目
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id)

    if (!project) {
      return res.status(404).json({
        success: false,
        error: '项目不存在',
      })
    }

    res.json({
      success: true,
      message: '项目删除成功',
    })
  } catch (error) {
    console.error('删除项目失败:', error)
    res.status(500).json({
      success: false,
      error: '删除项目失败',
      message: (error as Error).message,
    })
  }
})

export default router
