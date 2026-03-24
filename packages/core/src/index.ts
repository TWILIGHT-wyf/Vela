// @vela/core 对外入口
export * from './types'
export * from './contracts'
export { generateId } from './utils/id'
export { countTracks } from './utils/grid'
export { normalizeGridContainerFields, syncRowsTemplate } from './utils/gridNormalize'
export {
  extractSize,
  extractRotation,
  extractZIndex,
  isNodeLocked,
  isNodeVisible,
  generateLayoutCSS,
  generateVisualCSS,
  generateAnimationCSS,
} from './utils/style'
export { createSandboxProxy, evaluate, validateCode } from './utils/sandbox'

// 说明：
// model/plugins 属于编辑引擎内部实现细节，
// 故意不暴露在根导出 API 中。
