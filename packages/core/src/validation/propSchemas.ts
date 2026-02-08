import { z } from 'zod'

/**
 * Registry for component property validation schemas.
 * Key: "{component}.{prop}"
 * Value: ZodSchema
 */
export const PropSchemaRegistry = new Map<string, z.ZodTypeAny>()

function buildPropSchemaKey(component: string, prop: string): string {
  return `${component}.${prop}`
}

/**
 * Register a schema for a component property
 */
export function registerPropSchema(component: string, prop: string, schema: z.ZodTypeAny) {
  PropSchemaRegistry.set(buildPropSchemaKey(component, prop), schema)
}

/**
 * Get schema for validation
 */
export function getPropSchema(component: string, prop: string): z.ZodTypeAny | undefined {
  return PropSchemaRegistry.get(buildPropSchemaKey(component, prop))
}

// 预定义一些通用 Schema
export const CommonSchemas = {
  Color: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}){1,2}$|^rgba?\(.*\)$|^transparent$/, 'Invalid color format'),
  Url: z.string().url('Invalid URL'),
  JsonArray: z.array(z.unknown()),
  JsonObject: z.record(z.string(), z.unknown()),
}
