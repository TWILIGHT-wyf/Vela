import { z } from 'zod'

// 基础 CSS 属性校验
export const NodeStyleSchema = z
  .object({
    // 位置与尺寸
    x: z.number().optional(),
    y: z.number().optional(),
    width: z.union([z.number(), z.string()]).optional(),
    height: z.union([z.number(), z.string()]).optional(),
    rotate: z.number().optional(),
    zIndex: z.number().optional(),

    // 常用样式
    visible: z.boolean().optional(),
    opacity: z.number().min(0).max(1).optional(),

    // 兼容旧格式 (Deprecated)
    left: z.string().optional(),
    top: z.string().optional(),

    backgroundColor: z.string().optional(),
    color: z.string().optional(),
    fontSize: z.union([z.number(), z.string()]).optional(),
    border: z.string().optional(),
    borderRadius: z.union([z.number(), z.string()]).optional(),
    boxShadow: z.string().optional(),

    // 允许任意其他 CSS 属性
  })
  .passthrough()

// 动作定义 (后续在 action.ts 中细化，这里先定义基础结构)
export const ActionZodSchema = z
  .object({
    id: z.string(),
    type: z.string(),
    condition: z.union([z.boolean(), z.string()]).optional(), // string for JSExpression
    delay: z.number().min(0).optional(),
  })
  .passthrough()

// 数据源配置
export const DataSourceSchema = z
  .object({
    enabled: z.boolean().optional(),
    url: z.string().url().optional(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).optional(),
    headers: z.record(z.string(), z.string()).optional(),
    body: z.string().optional(),
    interval: z.number().min(0).optional(),
    dataPath: z.string().optional(),
  })
  .passthrough()

// 递归节点定义
export const BaseNodeSchema = z.object({
  id: z.string(),
  componentName: z.string(),
  props: z.record(z.string(), z.unknown()).optional(),
  style: NodeStyleSchema.optional(),
  dataSource: DataSourceSchema.optional(),
  condition: z.union([z.boolean(), z.string()]).optional(),
  loop: z
    .object({
      data: z.union([z.array(z.unknown()), z.string()]), // string for JSExpression
      itemArg: z.string().optional(),
      indexArg: z.string().optional(),
    })
    .optional(),
  events: z.record(z.string(), z.array(ActionZodSchema)).optional(),

  // 动画
  animation: z
    .object({
      name: z.string(),
      duration: z.number().default(1),
      delay: z.number().default(0),
      iterationCount: z.union([z.number(), z.string()]).default(1),
      timingFunction: z.string().default('ease'),
      trigger: z.enum(['load', 'hover', 'click']).default('load'),
    })
    .optional(),
})

// 定义递归 Schema
export type NodeSchemaType = z.infer<typeof BaseNodeSchema> & {
  children?: NodeSchemaType[]
}

export const NodeZodSchema: z.ZodType<NodeSchemaType> = BaseNodeSchema.extend({
  children: z.lazy(() => z.array(NodeZodSchema)).optional(),
})
