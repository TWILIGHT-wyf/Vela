// Core components
export { default as RuntimeRenderer } from './runtime/RuntimeRenderer.vue'
export { default as RuntimeComponent } from './runtime/RuntimeComponent.vue'

// Plugins
export * from './runtime/plugins'

// Types
export * from './types'

// Composables
export { useComponentDataSource } from './runtime/useComponentDataSource'

// Legacy exports (deprecated)
// RecursiveRenderer is no longer exported - use RuntimeComponent instead
