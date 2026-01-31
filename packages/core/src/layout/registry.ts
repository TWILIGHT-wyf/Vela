import type { LayoutMode } from '../types/schema'
import type { LayoutEngine } from './base-engine'
import { FreeLayoutEngine } from './free-engine'
import { FlexLayoutEngine } from './flex-engine'
import { GridLayoutEngine } from './grid-engine'
import { FlowLayoutEngine } from './flow-engine'

const engines: Record<string, LayoutEngine> = {
  free: new FreeLayoutEngine(),
  flex: new FlexLayoutEngine(),
  grid: new GridLayoutEngine(),
  flow: new FlowLayoutEngine(),
}

export function getLayoutEngine(mode: LayoutMode = 'free'): LayoutEngine {
  return engines[mode] || engines.free
}
