import { z } from 'zod'

// ==========================================
// 1. 基础类型
// ==========================================

// JS 表达式
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
  JSExpressionSchema,
  z.array(z.unknown()), // 简单处理 array
  z.record(z.string(), z.unknown()), // 简单处理 object
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

export const ActionZodSchema = z
  .object({
    id: z.string(),
    type: z.string(), // 'openUrl', 'setState', etc.
    name: z.string().optional(),
    payload: z.record(z.string(), z.unknown()).optional(),
    next: z.string().optional(), // 动作流
    handlers: z
      .object({
        success: z.string().optional(),
        fail: z.string().optional(),
      })
      .optional(),
    condition: z.union([z.string(), z.boolean(), JSExpressionSchema]).optional(),

    // Legacy fields (optional)
    url: z.string().optional(),
    path: z.string().optional(),
    delay: z.number().optional(),
  })
  .passthrough()

// ==========================================
// 4. 节点定义 (递归)
// ==========================================

const BaseNodeSchema = z.object({
  id: z.string(),
  componentName: z.string(),
  title: z.string().optional(),
  props: z.record(z.string(), z.unknown()).optional(),
  style: NodeStyleSchema.optional(),
  layoutMode: z.enum(['free', 'flex', 'grid']).default('free').optional(),

  slotName: z.string().optional(),

  // 动态指令
  condition: z.union([z.boolean(), JSExpressionSchema]).optional(),
  loop: z
    .object({
      data: z.union([z.array(z.unknown()), JSExpressionSchema]),
      itemArg: z.string().optional(),
      indexArg: z.string().optional(),
    })
    .optional(),

  // 事件
  events: z.record(z.string(), z.array(ActionZodSchema)).optional(),

  // 动画
  animation: z
    .object({
      name: z.string(),
      class: z.string(),
      duration: z.number().default(0.7),
      delay: z.number().default(0),
      trigger: z.enum(['load', 'hover', 'click']).default('load'),
    })
    .optional(),
})

export type NodeSchemaType = z.infer<typeof BaseNodeSchema> & {
  children?: NodeSchemaType[]
}

export const NodeZodSchema: z.ZodType<NodeSchemaType> = BaseNodeSchema.extend({
  children: z.lazy(() => z.array(NodeZodSchema)).optional(),
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
// 6. 页面与应用
// ==========================================

export const VariableSchemaSchema = z.object({
  key: z.string(),
  type: z.string(),
  defaultValue: z.unknown().optional(),
})

export const ApiSchemaSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
  autoLoad: z.boolean().optional(),
})

export const PageSchemaSchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  children: NodeZodSchema,
  state: z.array(VariableSchemaSchema).optional(),
  apis: z.array(ApiSchemaSchema).optional(),
})
