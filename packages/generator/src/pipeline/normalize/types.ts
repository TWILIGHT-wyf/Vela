import type { LayoutMode, LengthValue, NodeSchema, PageSchema, ProjectSchema } from '@vela/core'

export interface NormalizedNodeLayout {
  mode: LayoutMode
  childMode: LayoutMode
  x: number
  y: number
  width?: LengthValue
  height?: LengthValue
  zIndex: number
  rotate: number
  order?: number
}

export interface NormalizedNode {
  id: string
  component: string
  parentId?: string
  raw: NodeSchema
  layout: NormalizedNodeLayout
  children: NormalizedNode[]
  slots: Record<string, NormalizedNode[]>
}

export interface NormalizedPage {
  id: string
  type: PageSchema['type']
  name: string
  path?: string
  defaultLayoutMode: LayoutMode
  raw: PageSchema
  root?: NormalizedNode
  nodeIndex: Map<string, NormalizedNode>
}

export interface NormalizedProject {
  raw: ProjectSchema
  pages: NormalizedPage[]
  pageIndex: Map<string, NormalizedPage>
}
