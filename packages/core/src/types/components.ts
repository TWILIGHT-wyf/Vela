/**
 * Legacy component types for backward compatibility
 * @deprecated V2.0 uses NodeSchema - this file is kept only for migration support
 *
 * All new code should import from:
 * - NodeSchema from '@vela/core/types/schema'
 * - ActionSchema from '@vela/core/types/action'
 */

import type { NodeSchema } from './schema'
import type { ActionSchema } from './action'

/**
 * Legacy Component type - alias to NodeSchema for backward compatibility
 * @deprecated Use NodeSchema instead
 */
export interface Component {
  id: string
  type: string // componentName
  name?: string // display name
  position: { x: number; y: number }
  size: { width: number | string; height: number | string }
  rotation?: number
  zindex?: number
  props?: Record<string, unknown>
  style?: Record<string, unknown> & {
    width?: number | string
    height?: number | string
    visible?: boolean
    opacity?: number
    fontSize?: number
    fontColor?: string
    fontWeight?: string
    textAlign?: string
    lineHeight?: string | number
    backgroundColor?: string
    borderRadius?: number
    border?: string
    boxShadow?: string
    padding?: number
    locked?: boolean
  }
  animation?: {
    class?: string
    duration?: number
    delay?: number
    iterationCount?: number | string
    timingFunction?: string
    trigger?: 'load' | 'hover' | 'click'
  }
  events?: {
    click?: EventAction[]
    hover?: EventAction[]
    doubleClick?: EventAction[]
    [key: string]: EventAction[] | undefined
  }
  groupId?: string
  children?: string[]
  layout?: {
    mode?: 'horizontal' | 'vertical'
    gap?: number
    align?: string
    padding?: number
  }
  dataSource?: {
    enabled?: boolean
    url?: string
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    headers?: Record<string, string>
    body?: string
    interval?: number
    dataPath?: string
  }
}

/**
 * Legacy event action configuration
 * @deprecated Use ActionSchema from '@vela/core/types/action' instead
 */
export interface EventAction {
  id: string
  type: string
  targetId?: string
  delay?: number
  message?: string
  messageType?: 'success' | 'warning' | 'error' | 'info'
  url?: string
  openInNewTab?: boolean
  script?: string
  eventName?: string
  [key: string]: unknown
}

/**
 * Convert legacy Component to NodeSchema
 * @deprecated Migration utility - will be removed in future versions
 */
export function componentToNodeSchema(comp: Component): NodeSchema {
  return {
    id: comp.id,
    componentName: comp.type,
    props: comp.props as NodeSchema['props'],
    style: {
      x: comp.position?.x ?? 0,
      y: comp.position?.y ?? 0,
      width: comp.size?.width ?? 100,
      height: comp.size?.height ?? 100,
      rotate: comp.rotation ?? 0,
      zIndex: comp.zindex ?? 0,
      ...comp.style,
    },
    animation: comp.animation
      ? {
          name: comp.animation.class || '',
          class: comp.animation.class || '',
          duration: comp.animation.duration || 0.7,
          delay: comp.animation.delay || 0,
          iterationCount: comp.animation.iterationCount || 1,
          timingFunction: comp.animation.timingFunction || 'ease',
          trigger: comp.animation.trigger || 'load',
        }
      : undefined,
    events: comp.events as Record<string, ActionSchema[]>,
  }
}

/**
 * Convert NodeSchema to legacy Component
 * @deprecated Migration utility - will be removed in future versions
 */
export function nodeSchemaToComponent(node: NodeSchema): Component {
  const { x, y, width, height, rotate, zIndex, ...visualStyles } = node.style || {}

  return {
    id: node.id,
    type: node.componentName,
    position: {
      x: (x as number) ?? 0,
      y: (y as number) ?? 0,
    },
    size: {
      width: width ?? 100,
      height: height ?? 100,
    },
    rotation: (rotate as number) ?? 0,
    zindex: (zIndex as number) ?? 0,
    props: node.props,
    style: visualStyles as Component['style'],
    animation: node.animation
      ? {
          class: node.animation.class,
          duration: node.animation.duration,
          delay: node.animation.delay,
          iterationCount: node.animation.iterationCount,
          timingFunction: node.animation.timingFunction,
          trigger: node.animation.trigger,
        }
      : undefined,
    events: node.events as Component['events'],
    children: node.children?.map((c) => c.id),
  }
}
