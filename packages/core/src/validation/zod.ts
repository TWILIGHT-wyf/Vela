import { z } from 'zod'

// ==========================================
// 1. 基础类型
// ==========================================

// 表达式类型
const ExpressionTypeSchema = z.enum(['expression', 'template', 'function'])

// 表达式 (新版)
const ExpressionSchema = z.object({
  type: ExpressionTypeSchema,
  value: z.string(),
  mock: z.unknown().optional(),
  returnType: z.enum(['string', 'number', 'boolean', 'array', 'object', 'void', 'any']).optional(),
})

// 兼容旧版 JSExpression
const JSExpressionSchema = z.object({
  type: z.literal('JSExpression'),
  value: z.string(),
  mock: z.unknown().optional(),
})

// 属性值 (静态或表达式)
const PropValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  ExpressionSchema,
  JSExpressionSchema, // 兼容旧版
  z.array(z.unknown()),
  z.record(z.string(), z.unknown()),
])

// ==========================================
// 2. 样式与布局
// ==========================================

export const NodeStyleSchema = z
  .object({
    // Layout
    x: z.number().optional(),
    y: z.number().optional(),
    width: z.union([z.number(), z.string()]).optional(),
    height: z.union([z.number(), z.string()]).optional(),

    // Transform
    rotate: z.number().optional(),

    // Flex
    display: z.string().optional(),
    flexDirection: z.enum(['row', 'column', 'row-reverse', 'column-reverse']).optional(),
    flexWrap: z.enum(['nowrap', 'wrap', 'wrap-reverse']).optional(),
    justifyContent: z
      .enum(['flex-start', 'center', 'flex-end', 'space-between', 'space-around'])
      .optional(),
    alignItems: z.enum(['flex-start', 'center', 'flex-end', 'stretch']).optional(),
    flexGrow: z.number().optional(),
    flexShrink: z.number().optional(),

    // Visual
    backgroundColor: z.string().optional(),
    opacity: z.number().min(0).max(1).optional(),
    visible: z.boolean().optional(),
    zIndex: z.number().optional(),
  })
  .passthrough() // 允许任意 CSS

// ==========================================
// 3. 动作与事件
// ==========================================

// 确认配置
const ConfirmConfigSchema = z.object({
  title: z.string().optional(),
  message: z.union([z.string(), ExpressionSchema, JSExpressionSchema]),
  confirmText: z.string().optional(),
  cancelText: z.string().optional(),
  type: z.enum(['info', 'warning', 'danger']).optional(),
})

// 具名动作引用
const ScopedActionRefSchema = z.object({
  type: z.literal('ref'),
  id: z.string(),
  scope: z.enum(['global', 'page', 'node']).optional(),
  pageId: z.string().optional(),
  nodeId: z.string().optional(),
})

// 内联动作代码
const InlineActionCodeSchema = z.object({
  type: z.literal('inline'),
  code: z.string(),
  language: z.enum(['js', 'ts']).optional(),
})

// 动作引用
const ActionRefSchema = z.union([z.string(), ScopedActionRefSchema, InlineActionCodeSchema])

// 动作链路引用 (不支持 inline)
const ActionLinkRefSchema = z.union([z.string(), ScopedActionRefSchema])

// 回调动作引用
const ActionCallbackRefSchema = z.union([ActionRefSchema, z.array(ActionRefSchema)])

// 动作回调处理
const ActionHandlersSchema = z.object({
  success: ActionCallbackRefSchema.optional(),
  fail: ActionCallbackRefSchema.optional(),
  loading: ActionCallbackRefSchema.optional(),
  complete: ActionCallbackRefSchema.optional(),
})

export const ActionZodSchema = z
  .object({
    id: z.string(),
    type: z.string(), // 'setState', 'callApi', 'navigate', etc.
    name: z.string().optional(),
    description: z.string().optional(),
    group: z.string().optional(),

    // Payload (typed per action type, validated at runtime)
    payload: z.record(z.string(), z.unknown()).optional(),

    // 流程控制
    next: ActionLinkRefSchema.optional(),
    handlers: ActionHandlersSchema.optional(),
    condition: z.union([z.boolean(), ExpressionSchema, JSExpressionSchema]).optional(),
    delay: z.number().optional(),
    debounce: z.number().optional(),
    throttle: z.number().optional(),
    confirm: ConfirmConfigSchema.optional(),
    log: z.boolean().optional(),

    // Legacy fields (deprecated)
    targetId: z.string().optional(),
    url: z.string().optional(),
    path: z.string().optional(),
    value: z.unknown().optional(),
    args: z.array(z.unknown()).optional(),
    message: z.string().optional(),
  })
  .passthrough()

// 节点事件动作项：支持内联动作定义和动作引用
const NodeEventActionSchema = z.union([ActionZodSchema, ActionLinkRefSchema])

// ==========================================
// 4. 节点定义 (递归)
// ==========================================

const BaseNodeSchema = z.object({
  id: z.string(),
  component: z.string().optional(),
  title: z.string().optional(),
  props: z.record(z.string(), z.unknown()).optional(),
  layout: z
    .object({
      x: z.number().optional(),
      y: z.number().optional(),
      rotate: z.number().optional(),
      scale: z.number().optional(),
      locked: z.boolean().optional(),
      hidden: z.boolean().optional(),
    })
    .optional(),
  style: NodeStyleSchema.optional(),

  // 插槽
  slot: z.string().optional(),
  slotProps: z.string().optional(),

  // 引用
  ref: z.string().optional(),

  // 兼容旧版
  componentName: z.string().optional(),
  slotName: z.string().optional(),

  // 渲染控制
  renderIf: z.union([z.boolean(), ExpressionSchema, JSExpressionSchema]).optional(),
  repeat: z
    .object({
      source: z.union([z.array(z.unknown()), ExpressionSchema, JSExpressionSchema]),
      itemKey: z.string().optional(),
      itemAlias: z.string().optional(),
      indexAlias: z.string().optional(),
    })
    .optional(),
  // 兼容旧版
  condition: z.union([z.boolean(), ExpressionSchema, JSExpressionSchema]).optional(),
  loop: z
    .object({
      data: z.union([z.array(z.unknown()), ExpressionSchema, JSExpressionSchema]),
      itemArg: z.string().optional(),
      indexArg: z.string().optional(),
    })
    .optional(),

  // 事件
  events: z.record(z.string(), z.array(NodeEventActionSchema)).optional(),
  actions: z.array(ActionZodSchema).optional(),

  // 动画
  animation: z
    .object({
      name: z.string(),
      className: z.string().optional(),
      // 兼容旧字段
      class: z.string().optional(),
      duration: z.number().default(700),
      delay: z.number().default(0),
      iterations: z.union([z.number(), z.literal('infinite')]).optional(),
      easing: z.string().optional(),
      trigger: z.enum(['init', 'load', 'hover', 'click', 'visible']).default('init'),
    })
    .optional(),

  childLayout: z.enum(['free', 'flow']).optional(),
  // 兼容旧字段
  layoutMode: z.enum(['free', 'flow']).optional(),
  responsive: z.record(z.string(), z.record(z.string(), z.unknown())).optional(),
}).superRefine((node, ctx) => {
  if (!node.component && !node.componentName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Node requires "component" or legacy "componentName"',
      path: ['component'],
    })
  }
})

export type NodeSchemaType = z.infer<typeof BaseNodeSchema> & {
  children?: NodeSchemaType[]
}

export const NodeZodSchema: z.ZodType<NodeSchemaType> = BaseNodeSchema.extend({
  children: z.lazy(() => z.array(NodeZodSchema)).optional(),
  slots: z.record(z.string(), z.lazy(() => z.array(NodeZodSchema))).optional(),
})

// ==========================================
// 5. 物料协议
// ==========================================

export const PropSchemaSchema = z.object({
  name: z.string(),
  label: z.string(),
  setter: z.string(), // 'StringSetter', etc.
  defaultValue: z.unknown().optional(),
  group: z.string().optional(),
})

export const MaterialMetaSchema = z.object({
  name: z.string(),
  title: z.string(),
  version: z.string(),
  category: z.string(),
  props: z.union([
    z.array(PropSchemaSchema),
    z.record(z.string(), PropSchemaSchema), // 支持 legacy object format
  ]),
  assets: z
    .object({
      js: z.string(),
      css: z.string().optional(),
    })
    .optional(),
})

// ==========================================
// 6. 变量与 API
// ==========================================

// 验证规则
const ValidationRuleSchema = z.object({
  required: z.boolean().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
  enum: z.array(z.unknown()).optional(),
  validator: z.string().optional(),
  message: z.string().optional(),
})

// 变量定义
export const VariableSchemaSchema = z.object({
  key: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'object', 'array', 'any']),
  defaultValue: z.unknown().optional(),
  description: z.string().optional(),
  source: z.enum(['manual', 'api', 'computed', 'route', 'storage']).optional(),
  group: z.string().optional(),
  validation: ValidationRuleSchema.optional(),
  persist: z.boolean().optional(),
  readonly: z.boolean().optional(),
  expression: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
})

// API 子配置
const ApiPollingConfigSchema = z.object({
  enabled: z.boolean(),
  interval: z.number(),
  stopOnError: z.boolean().optional(),
  maxCount: z.number().optional(),
})

const ApiCacheConfigSchema = z.object({
  enabled: z.boolean(),
  ttl: z.number().optional(),
  strategy: z.enum(['memory', 'session', 'persistent']).optional(),
  cacheKey: z.string().optional(),
})

const ApiRetryConfigSchema = z.object({
  count: z.number(),
  delay: z.number().optional(),
  backoff: z.enum(['fixed', 'exponential', 'linear']).optional(),
  statusCodes: z.array(z.number()).optional(),
})

const ApiMockConfigSchema = z.object({
  enabled: z.boolean(),
  data: z.unknown().optional(),
  delay: z.number().optional(),
  handler: z.string().optional(),
})

const ApiStateBindingSchema = z.object({
  dataPath: z.string().optional(),
  loadingPath: z.string().optional(),
  errorPath: z.string().optional(),
  dataExtractor: z.string().optional(),
})

// API 定义
export const ApiSchemaSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  group: z.string().optional(),
  url: z.union([z.string(), ExpressionSchema, JSExpressionSchema]),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']),
  contentType: z.enum(['json', 'form', 'formdata', 'raw', 'none']).optional(),
  headers: z.record(z.string(), z.union([z.string(), ExpressionSchema, JSExpressionSchema])).optional(),
  params: z.record(z.string(), z.unknown()).optional(),
  body: z.unknown().optional(),
  timeout: z.number().optional(),
  withCredentials: z.boolean().optional(),
  stateBinding: ApiStateBindingSchema.optional(),
  autoLoad: z.boolean().optional(),
  dependencies: z.array(z.string()).optional(),
  polling: ApiPollingConfigSchema.optional(),
  cache: ApiCacheConfigSchema.optional(),
  retry: ApiRetryConfigSchema.optional(),
  mock: ApiMockConfigSchema.optional(),
  dataHandler: z.string().optional(),
  onSuccess: ActionCallbackRefSchema.optional(),
  onError: ActionCallbackRefSchema.optional(),
  onComplete: ActionCallbackRefSchema.optional(),
})

// ==========================================
// 7. 页面定义
// ==========================================

export const PageSchemaSchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  children: NodeZodSchema,
  state: z.array(VariableSchemaSchema).optional(),
  apis: z.array(ApiSchemaSchema).optional(),
})
