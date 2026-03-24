/**
 * AI 建议服务
 * 负责调用 Agent、校验、白名单过滤、沙箱隔离
 */

import type {
  SuggestionRequest,
  SuggestionResult,
  DiffItem,
  LegacySuggestionComponent,
  WhitelistConfig,
} from '@/types/suggestion'
import { nanoid } from 'nanoid'
import http from '@/services/http'

type ComponentLike = LegacySuggestionComponent & { id?: string }

/**
 * 构建组件能力文档（基于 Schema）
 */
function buildComponentCapabilityDoc(): string {
  // Keep the capability list explicit until schema metadata is fully normalized.
  return '- lineChart: 折线图[支持数据源]\n- barChart: 柱状图[支持数据源]\n- stat: KPI统计\n- table: 数据表[支持数据源]\n- TextInput: 文本输入\n- select: 下拉选择'
}

/**
 * 默认白名单配置
 */
const DEFAULT_WHITELIST: WhitelistConfig = {
  allowedComponents: [
    // 图表
    'lineChart',
    'barChart',
    'stackedBarChart',
    'pieChart',
    'doughnutChart',
    'scatterChart',
    'radarChart',
    'gaugeChart',
    'funnelChart',
    'sankeyChart',
    // KPI
    'stat',
    'Text',
    'countUp',
    'progress',
    'badge',
    'box',
    // 数据
    'table',
    'list',
    // 控件
    'select',
    'multiSelect',
    'dateRange',
    'searchBox',
    'slider',
    'switch',
    'checkboxGroup',
    'buttonGroup',
    // 布局
    'row',
    'col',
    'tabs',
    'grid',
    'panel',
    'modal',
    'flex',
    // 媒体
    'image',
    'video',
    // 内容
    'markdown',
    'html',
    'iframe',
  ],
  allowedPropPrefixes: ['label', 'title', 'value', 'placeholder', 'options', 'dataSource'],
  forbiddenProps: ['__proto__', 'constructor', 'prototype', 'eval', 'Function'],
  allowedDataSources: ['static', 'api', 'mock'],
}

/**
 * JSON Schema 校验（简化版）
 */
function validateComponentSchema(component: LegacySuggestionComponent): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  const componentType = typeof component.type === 'string' ? component.type : ''

  // 必需字段
  if (!componentType) {
    errors.push('组件缺少必需字段: type')
  }

  // 检查组件类型是否在白名单内
  if (componentType && !DEFAULT_WHITELIST.allowedComponents.includes(componentType)) {
    errors.push(`组件类型 "${componentType}" 不在白名单内`)
  }

  // 检查尺寸
  if (component.size) {
    if (component.size.width < 0 || component.size.width > 2000) {
      errors.push('组件宽度超出合理范围 (0-2000)')
    }
    if (component.size.height < 0 || component.size.height > 2000) {
      errors.push('组件高度超出合理范围 (0-2000)')
    }
  }

  // 检查位置
  if (component.position) {
    if (component.position.x < 0) {
      errors.push('组件 x 坐标不能为负数')
    }
    if (component.position.y < 0) {
      errors.push('组件 y 坐标不能为负数')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * 白名单过滤 - 检查属性路径
 */
function isPropertyAllowed(path: string): boolean {
  // 检查禁止属性
  if (DEFAULT_WHITELIST.forbiddenProps.some((forbidden: string) => path.includes(forbidden))) {
    return false
  }

  // 检查是否以允许的前缀开头（或为通用属性）
  const allowedGenericProps = ['x', 'y', 'w', 'h', 'style', 'name', 'visible', 'locked']
  const firstPart = path.split('.')[0]
  if (firstPart && allowedGenericProps.includes(firstPart)) {
    return true
  }

  return DEFAULT_WHITELIST.allowedPropPrefixes.some((prefix: string) => path.startsWith(prefix))
}

/**
 * 沙箱隔离 - 检查危险脚本
 */
function sanitizeValue(value: unknown): string | number | boolean | Record<string, unknown> | null {
  if (typeof value === 'string') {
    // 移除潜在危险的脚本标签和事件处理器
    const dangerous = /<script|javascript:|onerror|onload|eval\(/gi
    if (dangerous.test(value)) {
      console.warn('[SuggestionService] 检测到危险内容，已清理:', value)
      return value.replace(dangerous, '')
    }
    return value
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'object' && value !== null) {
    // 递归清理对象
    const cleaned: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value)) {
      if (!DEFAULT_WHITELIST.forbiddenProps.includes(key)) {
        // 递归调用并收窄结果
        cleaned[key] = sanitizeValue(val)
      }
    }
    return cleaned
  }

  return null
}

/**
 * 校验差异项
 */
function validateDiff(diff: DiffItem): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (diff.action === 'add' && diff.component) {
    // 校验新增组件
    const schemaResult = validateComponentSchema(diff.component)
    if (!schemaResult.valid) {
      errors.push(...schemaResult.errors)
    }
  }

  if (diff.action === 'modify' && diff.path) {
    // 校验修改路径
    if (!isPropertyAllowed(diff.path)) {
      errors.push(`属性路径 "${diff.path}" 不在白名单内`)
    }
  }

  // 清理值
  if (diff.newValue !== undefined) {
    diff.newValue = sanitizeValue(diff.newValue)
  }

  if (diff.component) {
    diff.component = sanitizeValue(diff.component) as LegacySuggestionComponent
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Agent API 配置
 * 通过 http 实例调用后端 AI 代理服务
 */
const AGENT_CONFIG = {
  endpoint: '/ai/generate',
  timeout: 60000,
}

/**
 * 请求频率限制检查
 */
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 1000 // 最小请求间隔 1 秒

function checkRateLimit(): { allowed: boolean; waitTime?: number } {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    return {
      allowed: false,
      waitTime: MIN_REQUEST_INTERVAL - timeSinceLastRequest,
    }
  }

  lastRequestTime = now
  return { allowed: true }
}

/**
 * 构建发送给 Agent 的系统提示词
 */
function buildSystemPrompt(canvasWidth: number, canvasHeight: number): string {
  const capabilityDoc = buildComponentCapabilityDoc()

  return `你是一个专业的 Vela 可视化大屏设计助手。用户会描述他们想要的组件或布局需求，你需要根据需求生成对应的组件配置。

## 【组件能力文档】
以下是系统中所有可用组件及其核心属性，请严格参考此文档生成配置：

${capabilityDoc}

## 【画布尺寸】
当前画布：${canvasWidth}x${canvasHeight}

## 【核心规则】
1. **严禁臆造属性**：只能使用【组件能力文档】中列出的属性名
2. position.x 范围：0 到 ${canvasWidth - 50}
3. position.y 范围：0 到 ${canvasHeight - 50}
4. size 合理范围：宽度 50-${Math.min(canvasWidth, 800)}，高度 50-${Math.min(canvasHeight, 600)}
5. 多组件布局时错开位置，避免重叠
6. 支持数据源的组件可配置 dataSource.enabled = true

## 【输出格式】
请严格按照以下 JSON 格式返回，不要包含任何其他文字：
{
  "diffs": [
    {
      "action": "add",
      "componentType": "组件类型",
      "component": {
        "type": "组件类型",
        "name": "组件名称",
        "position": { "x": 数字, "y": 数字 },
        "size": { "width": 数字, "height": 数字 },
        "rotation": 0,
        "zindex": 1,
        "style": { "visible": true, "locked": false },
        "props": { /* 组件特定属性 */ }
      },
      "description": "操作描述"
    }
  ],
  "summary": "总结说明"
}

## 注意事项
1. position.x 和 position.y 必须 >= 0
2. size.width 和 size.height 范围为 50-2000
3. 多个组件时注意位置错开，避免重叠
4. 根据组件类型提供合理的 props 配置
5. 只返回 JSON，不要有其他解释文字`
}

/**
 * 构建用户消息
 */
function buildUserMessage(request: SuggestionRequest): string {
  const contextInfo = request.context
    ? `\n\n【上下文信息】\n- 画布尺寸: ${request.context.canvasSize?.width || 1920}x${request.context.canvasSize?.height || 1080}\n- 已有组件: ${request.context.components?.length || 0} 个`
    : ''

  return `【用户需求】\n${request.prompt}${contextInfo}`
}

/**
 * 解析 Agent 响应
 */
function parseAgentResponse(
  responseText: string,
  request: SuggestionRequest,
): Omit<SuggestionResult, 'id'> {
  try {
    // 尝试提取 JSON（处理可能包含 markdown 代码块的情况）
    let jsonStr = responseText
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch && jsonMatch[1]) {
      jsonStr = jsonMatch[1].trim()
    }

    const parsed = JSON.parse(jsonStr)

    return {
      request,
      diffs: parsed.diffs || [],
      summary: parsed.summary || `生成了 ${parsed.diffs?.length || 0} 个组件`,
      confidence: 0.9,
      agentVersion: 'backend-proxy',
      timestamp: Date.now(),
      validated: false,
    }
  } catch (error) {
    console.error('[SuggestionService] 解析 Agent 响应失败:', error)
    // 返回错误提示
    return {
      request,
      diffs: [
        {
          action: 'add',
          componentType: 'Text',
          component: {
            type: 'Text',
            name: '错误提示',
            position: { x: 50, y: 50 },
            size: { width: 400, height: 80 },
            rotation: 0,
            zindex: 1,
            style: { visible: true, locked: false },
            props: {
              content: `Agent 响应解析失败，请重试。原始响应: ${responseText.slice(0, 200)}...`,
            },
          },
          description: '解析错误提示',
        },
      ],
      summary: 'Agent 响应解析失败',
      confidence: 0,
      agentVersion: 'backend-proxy',
      timestamp: Date.now(),
      validated: false,
    }
  }
}

/**
 * 调用真实 Agent API
 */
async function callAgent(request: SuggestionRequest): Promise<Omit<SuggestionResult, 'id'>> {
  // 频率限制检查
  const rateLimitCheck = checkRateLimit()
  if (!rateLimitCheck.allowed) {
    console.warn('[SuggestionService] 请求过于频繁，请稍候')
    return {
      request,
      diffs: [
        {
          action: 'add',
          componentType: 'Text',
          component: {
            type: 'Text',
            name: '频率限制提示',
            position: { x: 50, y: 50 },
            size: { width: 500, height: 80 },
            rotation: 0,
            zindex: 1,
            style: { visible: true, locked: false },
            props: {
              content: `请求过于频繁，请等待 ${Math.ceil((rateLimitCheck.waitTime || 0) / 1000)} 秒后重试`,
            },
          },
          description: '频率限制提示',
        },
      ],
      summary: '请求频率限制',
      confidence: 0,
      agentVersion: 'rate-limited',
      timestamp: Date.now(),
      validated: false,
    }
  }

  // 检查 API 配置
  if (!AGENT_CONFIG.endpoint) {
    console.warn('[SuggestionService] Agent API 未配置，请设置 AGENT_CONFIG')
    return {
      request,
      diffs: [
        {
          action: 'add',
          componentType: 'Text',
          component: {
            type: 'Text',
            name: '配置提示',
            position: { x: 50, y: 50 },
            size: { width: 500, height: 100 },
            rotation: 0,
            zindex: 1,
            style: { visible: true, locked: false },
            props: {
              content: 'Agent API 未配置。请确保后端服务器运行并配置 AI API 密钥。',
            },
          },
          description: 'API 配置提示',
        },
      ],
      summary: 'Agent API 未配置',
      confidence: 0,
      agentVersion: 'not-configured',
      timestamp: Date.now(),
      validated: false,
    }
  }

  let timeoutId: number | null = null

  try {
    const controller = new AbortController()

    timeoutId = window.setTimeout(() => controller.abort(), AGENT_CONFIG.timeout)

    const canvasWidth = request.context?.canvasSize?.width || 1920
    const canvasHeight = request.context?.canvasSize?.height || 1080

    const response = await http.post(
      AGENT_CONFIG.endpoint,
      {
        messages: [
          { role: 'system', content: buildSystemPrompt(canvasWidth, canvasHeight) },
          { role: 'user', content: buildUserMessage(request) },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        timeout: AGENT_CONFIG.timeout,
      },
    )

    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }

    const data = response.data
    const content = data.choices?.[0]?.message?.content || data.content || ''
    return parseAgentResponse(content, request)
  } catch (err: unknown) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }

    console.error('[SuggestionService] Agent 调用失败:', err)

    // 错误分类处理
    let errorMessage = '未知错误'
    let errorTip = ''

    const errCode = (err as { code?: string })?.code
    const errStatus = (err as { response?: { status?: number } })?.response?.status

    if (errStatus === 429) {
      errorMessage = 'API 请求频率超限'
      errorTip = '建议：等待 30-60 秒后重试，或联系管理员提升配额'
    } else if (errStatus === 401 || errStatus === 403) {
      errorMessage = 'API 认证失败'
      errorTip = '建议：检查后端 AI API 密钥配置是否正确'
    } else if (errStatus === 500 || errStatus === 502 || errStatus === 503) {
      errorMessage = '后端服务异常'
      errorTip = '建议：检查后端服务是否正常运行'
    } else if (errCode === 'ECONNABORTED' || errCode === 'ERR_CANCELED') {
      errorMessage = '请求超时或已取消'
      errorTip = '建议：检查网络连接或增加超时时间'
    } else if (errCode === 'ERR_NETWORK') {
      errorMessage = '网络连接失败'
      errorTip = '建议：检查后端服务是否启动（http://localhost:3001）'
    } else if (err instanceof Error) {
      errorMessage = err.message
    }

    return {
      request,
      diffs: [
        {
          action: 'add',
          componentType: 'Text',
          component: {
            type: 'Text',
            name: '错误提示',
            position: { x: 50, y: 50 },
            size: { width: 600, height: errorTip ? 120 : 80 },
            rotation: 0,
            zindex: 1,
            style: { visible: true, locked: false },
            props: {
              content: `AI 建议失败: ${errorMessage}\n${errorTip}`,
            },
          },
          description: '错误提示',
        },
      ],
      summary: `调用失败: ${errorMessage}`,
      confidence: 0,
      agentVersion: 'backend-proxy',
      timestamp: Date.now(),
      validated: false,
    }
  }
}

/**
 * 生成建议
 */
export async function generateSuggestion(request: SuggestionRequest): Promise<SuggestionResult> {
  // 调用 Agent
  const rawResult = await callAgent(request)

  const totalDiffs = rawResult.diffs.length
  let validDiffsCount = 0

  // 校验每个差异项
  const validationErrors: string[] = []
  const validDiffs: DiffItem[] = []

  for (const diff of rawResult.diffs) {
    const result = validateDiff(diff)
    if (result.valid) {
      validDiffs.push(diff)
      validDiffsCount++
    } else {
      validationErrors.push(...result.errors)
      console.warn('[AI 校验] 差异项未通过:', diff, result.errors)
    }
  }

  const validated = validationErrors.length === 0

  // 真实置信度计算
  const baseConfidence = 0.9
  const validationRate = totalDiffs > 0 ? validDiffsCount / totalDiffs : 0
  const confidence = baseConfidence * validationRate

  return {
    id: nanoid(),
    ...rawResult,
    diffs: validDiffs, // 只保留通过校验的差异
    confidence: Math.round(confidence * 100) / 100,
    validated,
    validationErrors: validated ? undefined : validationErrors,
  }
}

/**
 * 应用差异到组件树
 */
export function applyDiffs<T extends ComponentLike>(
  components: T[],
  diffs: DiffItem[],
): { components: T[]; appliedCount: number } {
  const newComponents = [...components]
  let appliedCount = 0

  for (const diff of diffs) {
    try {
      if (diff.action === 'add' && diff.component) {
        // 新增组件
        const newComponent = {
          id: nanoid(),
          ...diff.component,
        } as T
        newComponents.push(newComponent)
        appliedCount++
      } else if (diff.action === 'modify' && diff.componentId && diff.path && diff.newValue) {
        // 修改组件
        const targetIndex = newComponents.findIndex((c) => c.id === diff.componentId)
        if (targetIndex !== -1) {
          const target = newComponents[targetIndex]
          // 简化的路径设置
          const pathParts = diff.path.split('.')
          let current: unknown = target
          for (let i = 0; i < pathParts.length - 1; i++) {
            const key = pathParts[i]
            if (key && typeof current === 'object' && current !== null && key in current) {
              current = (current as Record<string, unknown>)[key]
            }
          }
          const lastKey = pathParts[pathParts.length - 1]
          if (lastKey && typeof current === 'object' && current !== null) {
            ;(current as Record<string, unknown>)[lastKey] = diff.newValue
          }
          appliedCount++
        }
      } else if (diff.action === 'delete' && diff.componentId) {
        // 删除组件
        const targetIndex = newComponents.findIndex((c) => c.id === diff.componentId)
        if (targetIndex !== -1) {
          newComponents.splice(targetIndex, 1)
          appliedCount++
        }
      }
    } catch (error) {
      console.error('[SuggestionService] 应用差异失败:', diff, error)
    }
  }

  return {
    components: newComponents,
    appliedCount,
  }
}
