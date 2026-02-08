import type { LayoutMode, NodeSchema, PageSchema, ProjectSchema } from '@vela/core'
import type { NormalizedNodeLayout } from '../normalize/types'

export interface IRNode {
  id: string
  component: string
  title?: string
  layout: NormalizedNodeLayout
  props?: NodeSchema['props']
  style?: NodeSchema['style']
  dataSource?: NodeSchema['dataSource']
  renderIf?: NodeSchema['renderIf']
  repeat?: NodeSchema['repeat']
  events?: NodeSchema['events']
  actions?: NodeSchema['actions']
  animation?: NodeSchema['animation']
  responsive?: NodeSchema['responsive']
  ref?: NodeSchema['ref']
  slot?: NodeSchema['slot']
  slotProps?: NodeSchema['slotProps']
  children: IRNode[]
  slots: Record<string, IRNode[]>
}

export interface IRPage {
  id: string
  type: PageSchema['type']
  name: string
  path?: string
  defaultLayoutMode: LayoutMode
  raw: PageSchema
  root?: IRNode
}

export interface IRProject {
  id: ProjectSchema['id']
  name: ProjectSchema['name']
  description?: ProjectSchema['description']
  config: ProjectSchema['config']
  pages: IRPage[]
  raw: ProjectSchema
}

