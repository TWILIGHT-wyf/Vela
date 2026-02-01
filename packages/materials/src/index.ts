// @vela/materials entry point
export * from './registry'
export * from './materialsMeta'
export {
  MaterialRegistry,
  materialRegistry,
  registerMaterial,
  getMaterial,
  listMaterials,
} from './metadata-registry'
export type { CategoryConfig } from './metadata-registry'
