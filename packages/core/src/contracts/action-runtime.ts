/**
 * 渲染器与生成器共享的动作运行时常量。
 */
export const ACTION_TARGET_DATA_ATTRIBUTES = Object.freeze([
  'data-node-id',
  'data-id',
  'data-component-id',
] as const)

export const ACTION_CONFIRM_DEFAULT_MESSAGE = '确认执行该动作吗？'
