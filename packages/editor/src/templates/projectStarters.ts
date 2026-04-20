import type { AnyActionSchema, DialogPage, NodeSchema, PageSchema, ProjectSchema } from '@vela/core'
import { createDefaultProject, createDialogPage, createRoutePage } from '@vela/core'
import type { NodeEventAction } from '@vela/core/types/schema'
import {
  extractDefaultProps,
  extractDefaultStyles,
  materialList,
  resolveCanonicalMaterialName,
} from '@vela/materials'
import { instantiateTemplate, type PageTemplateInstance } from './index'

export type ProjectStarterId = 'sample' | 'blank'

export interface ProjectStarterDefinition {
  id: ProjectStarterId
  label: string
  description: string
  recommended?: boolean
}

interface GridNodePreset {
  id: string
  component: string
  area: readonly [number, number, number, number]
  props?: Record<string, unknown>
  style?: Record<string, unknown>
  actions?: AnyActionSchema[]
  events?: Record<string, NodeEventAction[]>
}

const STARTER_TAG_PREFIX = 'starter:'
const SYSTEM_TAG_PREFIX = 'system:'
const WORKSPACE_SAMPLE_TAG = `${SYSTEM_TAG_PREFIX}workspace-sample`
const ORDER_DIALOG_PAGE_ID = 'page_order_detail_dialog'
const materialMetaMap = new Map<string, (typeof materialList)[number]>()

for (const meta of materialList) {
  const name = meta.name || meta.componentName
  if (!name) continue
  materialMetaMap.set(resolveCanonicalMaterialName(name), meta)
}

export const projectStarterDefinitions: ProjectStarterDefinition[] = [
  {
    id: 'sample',
    label: '业务示例',
    description: '预置订单、用户和弹窗处理流程，适合作为默认示例项目或起始模板。',
    recommended: true,
  },
  {
    id: 'blank',
    label: '空白项目',
    description: '保留当前协议和编辑能力，从空白页面开始搭建。',
  },
]

function buildFrTracks(count: number): string {
  return Array.from({ length: count }, () => '1fr').join(' ')
}

function createSurfaceStyle(
  backgroundColor: string,
  textColor: string,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    width: '100%',
    height: '100%',
    backgroundColor,
    color: textColor,
    borderRadius: '12px',
    border: '1px solid rgba(148, 163, 184, 0.18)',
    boxShadow: '0 12px 28px rgba(15, 23, 42, 0.08)',
    ...overrides,
  }
}

function buildGridNode(preset: GridNodePreset): NodeSchema {
  const canonicalName = resolveCanonicalMaterialName(preset.component)
  const materialMeta = materialMetaMap.get(canonicalName)
  const defaultProps = materialMeta?.props ? extractDefaultProps(materialMeta.props) : {}
  const defaultStyles = materialMeta?.styles ? extractDefaultStyles(materialMeta.styles) : {}
  const [gridColumnStart, gridColumnEnd, gridRowStart, gridRowEnd] = preset.area

  return {
    id: preset.id,
    component: canonicalName,
    props: {
      ...defaultProps,
      ...(preset.props || {}),
    } as NodeSchema['props'],
    style: {
      ...defaultStyles,
      width: '100%',
      height: '100%',
      ...(preset.style || {}),
    },
    geometry: {
      mode: 'grid',
      gridColumnStart,
      gridColumnEnd,
      gridRowStart,
      gridRowEnd,
    },
    layoutItem: {
      mode: 'grid',
      placement: {
        colStart: gridColumnStart,
        colSpan: Math.max(1, gridColumnEnd - gridColumnStart),
        rowStart: gridRowStart,
        rowSpan: Math.max(1, gridRowEnd - gridRowStart),
      },
      sizeModeX: 'stretch',
      sizeModeY: 'stretch',
    },
    actions: preset.actions,
    events: preset.events,
  }
}

function requireTemplateInstance(templateId: string): PageTemplateInstance {
  const template = instantiateTemplate(templateId)
  if (!template) {
    throw new Error(`Template "${templateId}" is not available`)
  }
  return template
}

function applyTemplateInstanceToPage(page: PageSchema, template: PageTemplateInstance): PageSchema {
  if (!page.children) {
    return page
  }

  page.children.container = {
    mode: 'grid',
    columns: template.root.columns,
    rows: template.root.rows,
    gap: template.root.gap ?? 12,
  }
  page.children.style = {
    ...(page.children.style || {}),
    ...(template.root.style || {}),
  }
  page.children.children = template.nodes
  page.actions = template.pageActions ? [...template.pageActions] : []

  return page
}

function findNodeById(root: NodeSchema | undefined, nodeId: string): NodeSchema | undefined {
  if (!root) return undefined
  if (root.id === nodeId) return root
  for (const child of root.children || []) {
    const matched = findNodeById(child, nodeId)
    if (matched) return matched
  }
  return undefined
}

function tagProjectStarter(project: ProjectSchema, starterId: ProjectStarterId): void {
  const nextTags = new Set(project.meta?.tags || [])
  nextTags.add(`${STARTER_TAG_PREFIX}${starterId}`)
  project.meta = {
    ...(project.meta || {}),
    tags: Array.from(nextTags),
  }
}

function tagSystemProject(project: ProjectSchema, systemTag: string): void {
  const nextTags = new Set(project.meta?.tags || [])
  nextTags.add(systemTag)
  project.meta = {
    ...(project.meta || {}),
    tags: Array.from(nextTags),
  }
}

function buildBlankProject(name: string, description?: string): ProjectSchema {
  const project = createDefaultProject(name)
  project.description = description?.trim() || '从空白页面开始搭建的 Vela 项目'

  const homePage = createRoutePage('page_home', '/', '首页')
  if (homePage.children) {
    homePage.children.style = {
      ...(homePage.children.style || {}),
      width: '100%',
      height: '100%',
      position: 'relative',
      backgroundColor: '#ffffff',
    }
  }

  project.pages = [homePage]
  tagProjectStarter(project, 'blank')
  return project
}

function buildSampleDialogPage(): DialogPage {
  const dialogPage = createDialogPage(ORDER_DIALOG_PAGE_ID, '订单处理弹窗')
  dialogPage.title = '订单处理弹窗'
  dialogPage.description = '用于示例项目中的 showDialog -> closeDialog -> resultPath 回填链路'
  dialogPage.dialogConfig = {
    width: '720px',
    closable: true,
    mask: true,
    maskClosable: false,
  }
  dialogPage.state = [
    { key: 'orderNo', type: 'string', defaultValue: 'ORD-202603-002' },
    { key: 'customer', type: 'string', defaultValue: '北川科技' },
    { key: 'owner', type: 'string', defaultValue: '陈野' },
    { key: 'amount', type: 'string', defaultValue: '¥5,120' },
    { key: 'statusLabel', type: 'string', defaultValue: '待发货' },
  ]

  if (!dialogPage.children) {
    return dialogPage
  }

  dialogPage.children.container = {
    mode: 'grid',
    columns: buildFrTracks(12),
    rows: buildFrTracks(5),
    gap: 12,
  }
  dialogPage.children.style = {
    ...(dialogPage.children.style || {}),
    backgroundColor: '#f8fafc',
  }
  dialogPage.children.children = [
    buildGridNode({
      id: 'dialog_detail_intro',
      component: 'Text',
      area: [1, 13, 1, 2],
      props: {
        content: '这个弹窗页用于验证页面状态映射、关闭回传和主页面结果回填。',
        fontSize: 18,
        color: '#0f172a',
        fontWeight: 700,
      },
      style: createSurfaceStyle('#ffffff', '#0f172a'),
    }),
    buildGridNode({
      id: 'dialog_detail_hint',
      component: 'Text',
      area: [1, 13, 2, 3],
      props: {
        content: '点击下方任一动作，主页面标题会在关闭弹窗后立即更新，便于验证运行时链路。',
        fontSize: 14,
        color: '#475569',
      },
      style: createSurfaceStyle('#ffffff', '#475569'),
    }),
    buildGridNode({
      id: 'dialog_detail_ship',
      component: 'Button',
      area: [1, 5, 4, 5],
      props: {
        text: '确认发货',
        type: 'primary',
      },
      actions: [
        {
          id: 'dialog_detail_ship_action',
          type: 'closeDialog',
          payload: {
            result: {
              decision: 'shipping',
              summary: '{{state.orderNo}} 已确认发货',
              toast: '主页面已收到发货结果',
            },
          },
        },
      ],
      events: {
        click: ['dialog_detail_ship_action'],
      },
      style: createSurfaceStyle('#ffffff', '#0f172a'),
    }),
    buildGridNode({
      id: 'dialog_detail_risk',
      component: 'Button',
      area: [5, 9, 4, 5],
      props: {
        text: '标记异常',
        type: 'warning',
      },
      actions: [
        {
          id: 'dialog_detail_risk_action',
          type: 'closeDialog',
          payload: {
            result: {
              decision: 'risk',
              summary: '{{state.orderNo}} 已标记异常',
              toast: '主页面已收到异常处理结果',
            },
          },
        },
      ],
      events: {
        click: ['dialog_detail_risk_action'],
      },
      style: createSurfaceStyle('#ffffff', '#0f172a'),
    }),
    buildGridNode({
      id: 'dialog_detail_close',
      component: 'Button',
      area: [9, 13, 4, 5],
      props: {
        text: '仅关闭弹窗',
        type: 'default',
      },
      actions: [
        {
          id: 'dialog_detail_close_action',
          type: 'closeDialog',
          payload: {
            result: {
              decision: 'closed',
              summary: '{{state.orderNo}} 已关闭处理弹窗',
              toast: '弹窗已关闭，主页面结果已同步',
            },
          },
        },
      ],
      events: {
        click: ['dialog_detail_close_action'],
      },
      style: createSurfaceStyle('#ffffff', '#0f172a'),
    }),
  ]

  return dialogPage
}

function buildSampleOrdersPage(): PageSchema {
  const page = createRoutePage('page_orders', '/orders', '订单管理')
  const template = requireTemplateInstance('query-workbench')

  applyTemplateInstanceToPage(page, template)
  page.title = '订单管理页'
  page.description = '用于示例项目中的查询、刷新、弹窗处理和结果回填主链路'
  page.state = [
    {
      key: 'orders',
      type: 'object',
      defaultValue: {
        currentRecord: {
          orderNo: 'ORD-202603-002',
          customer: '北川科技',
          owner: '陈野',
          amount: '¥5,120',
          statusLabel: '待发货',
        },
        lastDialogResult: null,
      },
    },
  ]

  const root = page.children
  const titleNode = findNodeById(root, 'tpl_query_title')
  if (titleNode?.props) {
    ;(titleNode.props as Record<string, unknown>).content = '订单管理页 · 最近处理：尚未执行'
  }

  const navButton = findNodeById(root, 'tpl_query_help')
  if (navButton) {
    navButton.props = {
      ...(navButton.props || {}),
      text: '切到用户管理',
      type: 'default',
    }
    navButton.actions = [
      {
        id: 'node_query_to_users',
        type: 'navigate',
        payload: {
          path: '/users',
        },
      },
    ]
    navButton.events = {
      click: ['node_query_to_users'],
    }
  }

  const detailButton = findNodeById(root, 'tpl_query_export')
  if (detailButton) {
    detailButton.props = {
      ...(detailButton.props || {}),
      text: '处理示例订单',
      type: 'warning',
    }
    detailButton.actions = [
      {
        id: 'node_query_open_detail_dialog',
        type: 'showDialog',
        payload: {
          dialogId: ORDER_DIALOG_PAGE_ID,
          title: '处理订单 {{state.orders.currentRecord.orderNo}}',
          content:
            '客户：{{state.orders.currentRecord.customer}} · 负责人：{{state.orders.currentRecord.owner}}',
          data: {
            orderNo: '{{state.orders.currentRecord.orderNo}}',
            customer: '{{state.orders.currentRecord.customer}}',
            owner: '{{state.orders.currentRecord.owner}}',
            amount: '{{state.orders.currentRecord.amount}}',
            statusLabel: '{{state.orders.currentRecord.statusLabel}}',
          },
          resultPath: 'orders.lastDialogResult',
          showCancel: true,
          confirmText: '保留弹窗结果',
          cancelText: '关闭',
        },
        next: 'node_query_apply_detail_result',
      },
      {
        id: 'node_query_apply_detail_result',
        type: 'setState',
        targetId: 'tpl_query_title',
        payload: {
          path: 'props.content',
          value:
            '订单管理页 · 最近处理：{{(state.orders.lastDialogResult && state.orders.lastDialogResult.summary) || "尚未执行"}}',
        },
        next: 'node_query_detail_notice',
      },
      {
        id: 'node_query_detail_notice',
        type: 'showToast',
        payload: {
          message:
            '{{(state.orders.lastDialogResult && state.orders.lastDialogResult.toast) || "处理完成"}}',
          type: 'success',
        },
      },
    ]
    detailButton.events = {
      click: ['node_query_open_detail_dialog'],
    }
  }

  return page
}

function buildSampleUsersPage(): PageSchema {
  const page = createRoutePage('page_users', '/users', '用户管理')
  const template = requireTemplateInstance('approval-center')

  applyTemplateInstanceToPage(page, template)
  page.title = '用户管理页'
  page.description = '用于示例项目中的多页面管理、列表刷新和数据同步能力'

  const titleNode = findNodeById(page.children, 'tpl_approval_title')
  if (titleNode?.props) {
    ;(titleNode.props as Record<string, unknown>).content = '用户管理页 · 多页面演示'
  }

  const navButton = findNodeById(page.children, 'tpl_approval_reject')
  if (navButton) {
    navButton.props = {
      ...(navButton.props || {}),
      text: '返回订单页',
      type: 'default',
    }
    navButton.actions = [
      {
        id: 'node_users_to_orders',
        type: 'navigate',
        payload: {
          path: '/orders',
        },
      },
    ]
    navButton.events = {
      click: ['node_users_to_orders'],
    }
  }

  return page
}

function buildSampleProject(name: string, description?: string): ProjectSchema {
  const project = createDefaultProject(name)
  const ordersTemplate = requireTemplateInstance('query-workbench')
  const usersTemplate = requireTemplateInstance('approval-center')

  const ordersPage = buildSampleOrdersPage()
  const usersPage = buildSampleUsersPage()
  const dialogPage = buildSampleDialogPage()

  project.description =
    description?.trim() || '内置业务示例项目：覆盖工作台、多页面、弹窗处理、结果回填和代码导出。'
  project.config.target = 'pc'
  project.config.router = {
    ...(project.config.router || {}),
    mode: 'hash',
    homePage: { type: 'path', path: '/orders' },
  }
  project.pages = [ordersPage, usersPage, dialogPage]
  project.logic = {
    ...(project.logic || {}),
    actions: [...(ordersTemplate.globalActions || []), ...(usersTemplate.globalActions || [])],
  }

  tagProjectStarter(project, 'sample')
  return project
}

export function buildBuiltInSampleProject(
  name: string = '业务示例',
  description?: string,
): ProjectSchema {
  const project = buildSampleProject(name, description)
  tagSystemProject(project, WORKSPACE_SAMPLE_TAG)
  return project
}

export function buildProjectFromStarter(
  starterId: ProjectStarterId,
  name: string,
  description?: string,
): ProjectSchema {
  switch (starterId) {
    case 'sample':
      return buildSampleProject(name, description)
    case 'blank':
    default:
      return buildBlankProject(name, description)
  }
}

export function getProjectStarterId(
  project?: Pick<ProjectSchema, 'meta'> | null,
): ProjectStarterId | null {
  const tags = project?.meta?.tags || []
  if (
    tags.includes(`${STARTER_TAG_PREFIX}sample`) ||
    tags.some((tag) => tag.startsWith(STARTER_TAG_PREFIX) && tag.endsWith('-demo'))
  ) {
    return 'sample'
  }
  for (const starter of projectStarterDefinitions) {
    if (tags.includes(`${STARTER_TAG_PREFIX}${starter.id}`)) {
      return starter.id
    }
  }
  return null
}

export function isBuiltInSampleProject(project?: Pick<ProjectSchema, 'meta'> | null): boolean {
  return (project?.meta?.tags || []).includes(WORKSPACE_SAMPLE_TAG)
}
