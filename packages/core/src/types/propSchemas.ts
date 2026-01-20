import { z } from 'zod'

/**
 * Registry for component property validation schemas.
 * Key: "{componentName}.{propName}"
 * Value: ZodSchema
 */
export const PropSchemaRegistry = new Map<string, z.ZodTypeAny>()

/**
 * Register a schema for a component property
 */
export function registerPropSchema(componentName: string, propName: string, schema: z.ZodTypeAny) {
  PropSchemaRegistry.set(`${componentName}.${propName}`, schema)
}

/**
 * Get schema for validation
 */
export function getPropSchema(componentName: string, propName: string): z.ZodTypeAny | undefined {
  return PropSchemaRegistry.get(`${componentName}.${propName}`)
}

// 预定义一些通用 Schema
export const CommonSchemas = {
  Color: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}){1,2}$|^rgba?\(.*\) |^transparent$/, 'Invalid color format'),
  Url: z.string().url('Invalid URL'),
  JsonArray: z.array(z.any()),
  JsonObject: z.record(z.string(), z.any()),
}
