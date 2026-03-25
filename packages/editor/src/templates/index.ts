import { expr, type NodeSchema, type NodeStyle } from '@vela/core'
import type { AnyActionSchema } from '@vela/core/types/action'
import type { NodeEventAction } from '@vela/core/types/schema'
import {
  extractDefaultProps,
  extractDefaultStyles,
  materialList,
  resolveCanonicalMaterialName,
} from '@vela/materials'
import { nanoid } from 'nanoid'

export type TemplateCategory = 'dashboard' | 'analysis' | 'form' | 'management'

export type TemplatePreview = readonly [string, string]

type GridArea = readonly [number, number, number, number]

interface TemplateRootConfig {
  columns: string
  rows: string
  gap?: number
  style?: Partial<NodeStyle>
}

interface TemplateNodePreset {
  id?: string
  component: string
  area: GridArea
  props?: Record<string, unknown>
  dataSource?: Record<string, unknown>
  style?: Partial<NodeStyle>
  actions?: AnyActionSchema[]
  events?: Record<string, NodeEventAction[]>
  ref?: string
}

export interface PageTemplateInstance {
  root: TemplateRootConfig
  nodes: NodeSchema[]
  pageActions?: AnyActionSchema[]
  globalActions?: AnyActionSchema[]
}

export interface PageTemplate {
  id: string
  name: string
  description: string
  category: TemplateCategory
  preview: TemplatePreview
  build: () => PageTemplateInstance
}

const materialMetaMap = new Map<string, (typeof materialList)[number]>()

for (const meta of materialList) {
  const name = meta.name || meta.componentName
  if (!name) continue
  materialMetaMap.set(resolveCanonicalMaterialName(name), meta)
}

function buildFrTracks(count: number): string {
  return Array.from({ length: count }, () => '1fr').join(' ')
}

function createSurfaceStyle(
  backgroundColor: string,
  textColor: string,
  elevation: 'flat' | 'card' = 'card',
): Partial<NodeStyle> {
  const shadow = elevation === 'flat' ? 'none' : '0 8px 24px rgba(15, 23, 42, 0.12)'

  return {
    width: '100%',
    height: '100%',
    backgroundColor,
    color: textColor,
    borderRadius: '12px',
    border: '1px solid rgba(148, 163, 184, 0.22)',
    boxShadow: shadow,
  }
}

const DEFAULT_ORDER_TABLE_URL = '/api/mock/orders?status=all'
const DEFAULT_ORDER_SUMMARY_URL = '/api/mock/orders/summary?status=all'
const DEFAULT_ORDER_INSIGHT_URL = '/api/mock/orders/insights?status=all'

function buildOrderQueryUrl(endpoint: string) {
  return expr(
    `(() => {
      const keyword = String(components.find((item) => item.id === 'tpl_query_keyword')?.props?.modelValue ?? '').trim()
      const status = String(components.find((item) => item.id === 'tpl_query_status')?.props?.modelValue ?? 'all')
      const range = components.find((item) => item.id === 'tpl_query_range')?.props?.modelValue
      const startDate = Array.isArray(range) ? String(range[0] ?? '') : ''
      const endDate = Array.isArray(range) ? String(range[1] ?? '') : ''
      return '${endpoint}?keyword=' + keyword + '&status=' + status + '&startDate=' + startDate + '&endDate=' + endDate
    })()`,
  )
}

function buildGridNode(preset: TemplateNodePreset): NodeSchema {
  const canonicalName = resolveCanonicalMaterialName(preset.component)
  const materialMeta = materialMetaMap.get(canonicalName)
  const defaultProps = materialMeta?.props ? extractDefaultProps(materialMeta.props) : {}
  const defaultStyles = materialMeta?.styles ? extractDefaultStyles(materialMeta.styles) : {}
  const [gridColumnStart, gridColumnEnd, gridRowStart, gridRowEnd] = preset.area

  return {
    id: preset.id || `tpl_${canonicalName}_${nanoid(8)}`,
    component: canonicalName,
    props: {
      ...defaultProps,
      ...(preset.props || {}),
    } as NodeSchema['props'],
    dataSource: preset.dataSource,
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
    ref: preset.ref,
  }
}

function buildOpsDashboardTemplate(): PageTemplateInstance {
  return {
    root: {
      columns: buildFrTracks(12),
      rows: buildFrTracks(9),
      gap: 12,
      style: { backgroundColor: '#0b1220' },
    },
    nodes: [
      buildGridNode({
        id: 'tpl_ops_title',
        component: 'Text',
        area: [1, 9, 1, 2],
        props: {
          content: '运营总览大屏',
          fontSize: 32,
          color: '#f8fafc',
          fontWeight: 700,
          textAlign: 'left',
        },
        style: createSurfaceStyle('#111827', '#f8fafc', 'flat'),
      }),
      buildGridNode({
        id: 'tpl_ops_refresh',
        component: 'Button',
        area: [9, 11, 1, 2],
        props: { text: '刷新数据', type: 'primary' },
        actions: [
          {
            id: 'node_ops_refresh_notice',
            type: 'showToast',
            payload: { message: '已触发刷新', type: 'info' },
          },
          {
            id: 'node_ops_refresh_table',
            type: 'refresh-data',
            targetId: 'tpl_ops_table',
          },
        ],
        events: {
          click: [
            'node_ops_refresh_notice',
            'node_ops_refresh_table',
            { type: 'ref', scope: 'global', id: 'global_ops_refresh_emit' },
          ],
        },
        style: createSurfaceStyle('#111827', '#f8fafc'),
      }),
      buildGridNode({
        id: 'tpl_ops_help',
        component: 'Button',
        area: [11, 13, 1, 2],
        props: { text: '帮助文档', type: 'default' },
        events: {
          click: [{ type: 'ref', scope: 'global', id: 'global_ops_open_doc' }],
        },
        style: createSurfaceStyle('#111827', '#f8fafc'),
      }),
      buildGridNode({
        id: 'tpl_ops_stat_1',
        component: 'stat',
        area: [1, 5, 2, 4],
        props: {
          title: '今日访问',
          value: 12854,
          change: 9.2,
          showChange: true,
          valueColor: '#60a5fa',
          titleColor: '#cbd5e1',
        },
        style: createSurfaceStyle('#111827', '#f8fafc'),
      }),
      buildGridNode({
        id: 'tpl_ops_stat_2',
        component: 'stat',
        area: [5, 9, 2, 4],
        props: {
          title: '支付转化',
          value: 14.8,
          suffix: '%',
          precision: 1,
          change: 1.6,
          showChange: true,
          valueColor: '#34d399',
          titleColor: '#cbd5e1',
        },
        style: createSurfaceStyle('#111827', '#f8fafc'),
      }),
      buildGridNode({
        id: 'tpl_ops_stat_3',
        component: 'stat',
        area: [9, 13, 2, 4],
        props: {
          title: '异常告警',
          value: 7,
          change: -22.2,
          showChange: true,
          valueColor: '#f59e0b',
          titleColor: '#cbd5e1',
        },
        style: createSurfaceStyle('#111827', '#f8fafc'),
      }),
      buildGridNode({
        id: 'tpl_ops_trend',
        component: 'lineChart',
        area: [1, 8, 4, 7],
        props: {
          title: '过去 24 小时流量',
          seriesName: '流量',
          xAxisData: ['00', '04', '08', '12', '16', '20', '24'],
          data: [120, 180, 260, 310, 285, 340, 320],
          smooth: true,
          showArea: true,
          lineColor: '#38bdf8',
        },
        style: createSurfaceStyle('#111827', '#f8fafc'),
      }),
      buildGridNode({
        id: 'tpl_ops_channel',
        component: 'pieChart',
        area: [8, 13, 4, 7],
        props: {
          title: '渠道占比',
          legendTop: 'bottom',
          data: [
            { name: '自然流量', value: 46 },
            { name: '广告', value: 24 },
            { name: '私域', value: 18 },
            { name: '合作', value: 12 },
          ],
        },
        style: createSurfaceStyle('#111827', '#f8fafc'),
      }),
      buildGridNode({
        id: 'tpl_ops_table',
        component: 'table',
        area: [1, 13, 7, 10],
        props: {
          border: true,
          stripe: true,
          columns: [
            { prop: 'event', label: '事件' },
            { prop: 'source', label: '来源' },
            { prop: 'count', label: '次数' },
            { prop: 'updatedAt', label: '更新时间' },
          ],
          data: [
            { event: '下单成功', source: 'App', count: 128, updatedAt: '2026-02-20 10:15' },
            { event: '登录失败', source: 'Web', count: 37, updatedAt: '2026-02-20 10:18' },
            { event: '退款申请', source: 'Mini', count: 11, updatedAt: '2026-02-20 10:21' },
          ],
        },
        style: createSurfaceStyle('#111827', '#f8fafc'),
      }),
    ],
    globalActions: [
      {
        id: 'global_ops_refresh_emit',
        type: 'emit',
        payload: { event: 'ops:refresh', data: { source: 'ops-dashboard-template' } },
      },
      {
        id: 'global_ops_open_doc',
        type: 'openUrl',
        payload: { url: 'https://example.com/ops-dashboard-doc', target: '_blank' },
      },
    ],
  }
}

function buildAnalysisTemplate(): PageTemplateInstance {
  return {
    root: {
      columns: buildFrTracks(12),
      rows: buildFrTracks(9),
      gap: 12,
      style: { backgroundColor: '#f5f7fb' },
    },
    nodes: [
      buildGridNode({
        component: 'Text',
        area: [1, 13, 1, 2],
        props: {
          content: '多维数据分析报表',
          fontSize: 30,
          color: '#0f172a',
          fontWeight: 700,
          textAlign: 'center',
        },
        style: createSurfaceStyle('#ffffff', '#0f172a'),
      }),
      buildGridNode({
        component: 'lineChart',
        area: [1, 7, 2, 6],
        props: {
          title: '营收趋势',
          seriesName: '营收',
          xAxisData: ['Q1', 'Q2', 'Q3', 'Q4'],
          data: [320, 460, 520, 680],
          smooth: true,
          showArea: true,
          lineColor: '#2563eb',
        },
        style: createSurfaceStyle('#ffffff', '#0f172a'),
      }),
      buildGridNode({
        component: 'barChart',
        area: [7, 13, 2, 6],
        props: {
          title: '区域销售',
          seriesName: '销售额',
          xAxisData: ['华东', '华南', '华北', '西南', '海外'],
          data: [180, 240, 210, 160, 130],
          barColor: '#0ea5e9',
        },
        style: createSurfaceStyle('#ffffff', '#0f172a'),
      }),
      buildGridNode({
        component: 'pieChart',
        area: [1, 7, 6, 10],
        props: {
          title: '成本结构',
          legendTop: 'bottom',
          data: [
            { name: '研发', value: 38 },
            { name: '市场', value: 27 },
            { name: '运营', value: 23 },
            { name: '其他', value: 12 },
          ],
        },
        style: createSurfaceStyle('#ffffff', '#0f172a'),
      }),
      buildGridNode({
        component: 'table',
        area: [7, 13, 6, 10],
        props: {
          border: true,
          stripe: true,
          columns: [
            { prop: 'metric', label: '指标' },
            { prop: 'value', label: '当前值' },
            { prop: 'trend', label: '环比' },
          ],
          data: [
            { metric: '客单价', value: '¥328', trend: '+5.6%' },
            { metric: '复购率', value: '32.4%', trend: '+1.3%' },
            { metric: '退款率', value: '1.8%', trend: '-0.5%' },
          ],
        },
        style: createSurfaceStyle('#ffffff', '#0f172a'),
      }),
    ],
  }
}

function buildQueryWorkbenchTemplate(): PageTemplateInstance {
  return {
    root: {
      columns: buildFrTracks(12),
      rows: buildFrTracks(9),
      gap: 12,
      style: { backgroundColor: '#f8fafc' },
    },
    nodes: [
      buildGridNode({
        id: 'tpl_query_title',
        component: 'Text',
        area: [1, 10, 1, 2],
        props: {
          content: '订单查询工作台',
          fontSize: 28,
          color: '#0f172a',
          fontWeight: 700,
        },
        style: createSurfaceStyle('#ffffff', '#0f172a'),
      }),
      buildGridNode({
        id: 'tpl_query_help',
        component: 'Button',
        area: [10, 13, 1, 2],
        props: { text: '筛选说明', type: 'default' },
        actions: [
          {
            id: 'node_query_help_notice',
            type: 'showToast',
            payload: {
              message: '支持按订单号、客户名、状态和日期区间筛选',
              type: 'info',
            },
          },
        ],
        events: { click: ['node_query_help_notice'] },
        style: createSurfaceStyle('#ffffff', '#0f172a'),
      }),
      buildGridNode({
        id: 'tpl_query_keyword',
        component: 'TextInput',
        area: [1, 4, 2, 3],
        props: { placeholder: '输入订单号/客户名', clearable: true, modelValue: '' },
        style: createSurfaceStyle('#ffffff', '#0f172a'),
      }),
      buildGridNode({
        id: 'tpl_query_status',
        component: 'select',
        area: [4, 7, 2, 3],
        props: {
          placeholder: '订单状态',
          modelValue: 'all',
          labelField: 'label',
          valueField: 'value',
        },
        dataSource: {
          enabled: true,
          url: '/api/mock/orders/status-options',
          method: 'GET',
          dataPath: 'data',
        },
        style: createSurfaceStyle('#ffffff', '#0f172a'),
      }),
      buildGridNode({
        id: 'tpl_query_range',
        component: 'dateRange',
        area: [7, 10, 2, 3],
        props: {
          startPlaceholder: '开始日期',
          endPlaceholder: '结束日期',
          modelValue: null,
        },
        style: createSurfaceStyle('#ffffff', '#0f172a'),
      }),
      buildGridNode({
        id: 'tpl_query_submit',
        component: 'Button',
        area: [10, 11, 2, 3],
        props: { text: '查询', type: 'primary' },
        actions: [
          {
            id: 'node_query_set_table_url',
            type: 'setState',
            targetId: 'tpl_query_table',
            payload: {
              path: 'dataSource.url',
              value: buildOrderQueryUrl('/api/mock/orders'),
            },
          },
          {
            id: 'node_query_set_summary_url',
            type: 'setState',
            targetId: 'tpl_query_stat',
            payload: {
              path: 'dataSource.url',
              value: buildOrderQueryUrl('/api/mock/orders/summary'),
            },
          },
          {
            id: 'node_query_set_insight_url',
            type: 'setState',
            targetId: 'tpl_query_insight',
            payload: {
              path: 'dataSource.url',
              value: buildOrderQueryUrl('/api/mock/orders/insights'),
            },
          },
          {
            id: 'node_query_refresh_table',
            type: 'refresh-data',
            targetId: 'tpl_query_table',
          },
          {
            id: 'node_query_refresh_summary',
            type: 'refresh-data',
            targetId: 'tpl_query_stat',
          },
          {
            id: 'node_query_refresh_insight',
            type: 'refresh-data',
            targetId: 'tpl_query_insight',
          },
          {
            id: 'node_query_success_notice',
            type: 'showToast',
            payload: { message: '筛选条件已应用', type: 'success' },
          },
        ],
        events: {
          click: [
            'node_query_set_table_url',
            'node_query_set_summary_url',
            'node_query_set_insight_url',
            'node_query_refresh_table',
            'node_query_refresh_summary',
            'node_query_refresh_insight',
            'node_query_success_notice',
            { type: 'ref', scope: 'global', id: 'global_query_emit' },
          ],
        },
        style: createSurfaceStyle('#ffffff', '#0f172a'),
      }),
      buildGridNode({
        id: 'tpl_query_reset',
        component: 'Button',
        area: [11, 12, 2, 3],
        props: { text: '重置', type: 'default' },
        actions: [
          {
            id: 'node_query_reset_keyword',
            type: 'setState',
            targetId: 'tpl_query_keyword',
            payload: { path: 'props.modelValue', value: '' },
          },
          {
            id: 'node_query_reset_status',
            type: 'setState',
            targetId: 'tpl_query_status',
            payload: { path: 'props.modelValue', value: 'all' },
          },
          {
            id: 'node_query_reset_range',
            type: 'setState',
            targetId: 'tpl_query_range',
            payload: { path: 'props.modelValue', value: null },
          },
          {
            id: 'node_query_reset_table_url',
            type: 'setState',
            targetId: 'tpl_query_table',
            payload: { path: 'dataSource.url', value: DEFAULT_ORDER_TABLE_URL },
          },
          {
            id: 'node_query_reset_summary_url',
            type: 'setState',
            targetId: 'tpl_query_stat',
            payload: { path: 'dataSource.url', value: DEFAULT_ORDER_SUMMARY_URL },
          },
          {
            id: 'node_query_reset_insight_url',
            type: 'setState',
            targetId: 'tpl_query_insight',
            payload: { path: 'dataSource.url', value: DEFAULT_ORDER_INSIGHT_URL },
          },
          {
            id: 'node_query_reset_refresh_table',
            type: 'refresh-data',
            targetId: 'tpl_query_table',
          },
          {
            id: 'node_query_reset_refresh_summary',
            type: 'refresh-data',
            targetId: 'tpl_query_stat',
          },
          {
            id: 'node_query_reset_refresh_insight',
            type: 'refresh-data',
            targetId: 'tpl_query_insight',
          },
          {
            id: 'node_query_reset_notice',
            type: 'showToast',
            payload: { message: '已恢复默认筛选条件', type: 'success' },
          },
          {
            id: 'node_query_reset_state',
            type: 'setState',
            payload: { path: 'orders.filters', value: {} },
          },
        ],
        events: {
          click: [
            'node_query_reset_keyword',
            'node_query_reset_status',
            'node_query_reset_range',
            'node_query_reset_table_url',
            'node_query_reset_summary_url',
            'node_query_reset_insight_url',
            'node_query_reset_refresh_table',
            'node_query_reset_refresh_summary',
            'node_query_reset_refresh_insight',
            'node_query_reset_notice',
            'node_query_reset_state',
          ],
        },
        style: createSurfaceStyle('#ffffff', '#0f172a'),
      }),
      buildGridNode({
        id: 'tpl_query_export',
        component: 'Button',
        area: [12, 13, 2, 3],
        props: { text: '导出', type: 'default' },
        actions: [
          {
            id: 'node_query_export_notice',
            type: 'showToast',
            payload: { message: '已提交导出任务', type: 'info' },
          },
        ],
        events: { click: ['node_query_export_notice'] },
        style: createSurfaceStyle('#ffffff', '#0f172a'),
      }),
      buildGridNode({
        id: 'tpl_query_stat',
        component: 'stat',
        area: [1, 4, 3, 5],
        props: {
          title: '匹配订单',
          value: 0,
          change: 0,
          showChange: true,
          valueColor: '#2563eb',
          titleColor: '#475569',
        },
        dataSource: {
          enabled: true,
          url: DEFAULT_ORDER_SUMMARY_URL,
          method: 'GET',
          titlePath: 'data.title',
          valuePath: 'data.value',
          changePath: 'data.change',
        },
        style: createSurfaceStyle('#ffffff', '#0f172a'),
      }),
      buildGridNode({
        id: 'tpl_query_insight',
        component: 'list',
        area: [4, 13, 3, 5],
        props: {
          showExtra: true,
          showAction: false,
          data: [],
        },
        dataSource: {
          enabled: true,
          url: DEFAULT_ORDER_INSIGHT_URL,
          method: 'GET',
          dataPath: 'data',
        },
        style: createSurfaceStyle('#ffffff', '#0f172a'),
      }),
      buildGridNode({
        id: 'tpl_query_table',
        component: 'table',
        area: [1, 13, 5, 10],
        props: {
          border: true,
          stripe: true,
          columns: [
            { prop: 'orderNo', label: '订单号' },
            { prop: 'customer', label: '客户' },
            { prop: 'owner', label: '负责人' },
            { prop: 'amount', label: '金额' },
            { prop: 'status', label: '状态' },
            { prop: 'createdAt', label: '下单时间' },
          ],
          data: [],
        },
        dataSource: {
          enabled: true,
          url: DEFAULT_ORDER_TABLE_URL,
          method: 'GET',
          dataPath: 'data',
        },
        style: createSurfaceStyle('#ffffff', '#0f172a'),
      }),
    ],
    globalActions: [
      {
        id: 'global_query_emit',
        type: 'emit',
        payload: { event: 'orders:query', data: { from: 'order-management-template' } },
      },
    ],
  }
}

function buildApprovalCenterTemplate(): PageTemplateInstance {
  return {
    root: {
      columns: buildFrTracks(12),
      rows: buildFrTracks(9),
      gap: 12,
      style: { backgroundColor: '#f1f5f9' },
    },
    nodes: [
      buildGridNode({
        id: 'tpl_approval_title',
        component: 'Text',
        area: [1, 8, 1, 2],
        props: { content: '用户管理页', fontSize: 30, color: '#0f172a', fontWeight: 700 },
        style: createSurfaceStyle('#ffffff', '#0f172a'),
      }),
      buildGridNode({
        id: 'tpl_approval_pass',
        component: 'Button',
        area: [8, 10, 1, 2],
        props: { text: '刷新列表', type: 'primary' },
        actions: [
          {
            id: 'node_approval_refresh_users',
            type: 'refresh-data',
            targetId: 'tpl_approval_table',
          },
          {
            id: 'node_approval_refresh_summary',
            type: 'refresh-data',
            targetId: 'tpl_approval_summary',
          },
          {
            id: 'node_approval_refresh_activity',
            type: 'refresh-data',
            targetId: 'tpl_approval_timeline',
          },
          {
            id: 'node_approval_refresh_notice',
            type: 'showToast',
            payload: { message: '用户列表已刷新', type: 'success' },
          },
        ],
        events: {
          click: [
            'node_approval_refresh_users',
            'node_approval_refresh_summary',
            'node_approval_refresh_activity',
            'node_approval_refresh_notice',
            { type: 'ref', scope: 'global', id: 'global_approval_emit' },
          ],
        },
        style: createSurfaceStyle('#ffffff', '#0f172a'),
      }),
      buildGridNode({
        id: 'tpl_approval_reject',
        component: 'Button',
        area: [10, 13, 1, 2],
        props: { text: '同步状态', type: 'default' },
        actions: [
          {
            id: 'node_approval_sync_api',
            type: 'callApi',
            payload: {
              apiId: '/api/mock/counter',
              method: 'GET',
              resultPath: 'users.syncCounter',
            },
            handlers: {
              success: 'page_approval_success',
              fail: 'page_approval_fail',
            },
          },
        ],
        events: { click: ['node_approval_sync_api'] },
        style: createSurfaceStyle('#ffffff', '#0f172a'),
      }),
      buildGridNode({
        id: 'tpl_approval_summary',
        component: 'stat',
        area: [1, 4, 2, 4],
        props: {
          title: '正常账号',
          value: 0,
          change: 0,
          showChange: true,
          valueColor: '#16a34a',
          titleColor: '#475569',
        },
        dataSource: {
          enabled: true,
          url: '/api/mock/users/summary',
          method: 'GET',
          titlePath: 'data.title',
          valuePath: 'data.value',
          changePath: 'data.change',
        },
        style: createSurfaceStyle('#ffffff', '#0f172a'),
      }),
      buildGridNode({
        id: 'tpl_approval_table',
        component: 'table',
        area: [4, 13, 2, 7],
        props: {
          border: true,
          stripe: true,
          columns: [
            { prop: 'name', label: '用户名' },
            { prop: 'department', label: '部门' },
            { prop: 'role', label: '角色' },
            { prop: 'status', label: '状态' },
            { prop: 'lastLoginAt', label: '最近登录' },
            { prop: 'email', label: '邮箱' },
          ],
          data: [],
        },
        dataSource: {
          enabled: true,
          url: '/api/mock/users',
          method: 'GET',
          dataPath: 'data',
        },
        style: createSurfaceStyle('#ffffff', '#0f172a'),
      }),
      buildGridNode({
        id: 'tpl_approval_timeline',
        component: 'list',
        area: [1, 7, 7, 10],
        props: {
          showExtra: true,
          showAction: false,
          data: [],
        },
        dataSource: {
          enabled: true,
          url: '/api/mock/users/activity',
          method: 'GET',
          dataPath: 'data',
        },
        style: createSurfaceStyle('#ffffff', '#0f172a'),
      }),
      buildGridNode({
        id: 'tpl_approval_notice',
        component: 'list',
        area: [7, 13, 7, 10],
        props: {
          data: [
            { title: '冻结账号', description: '当前 1 个账号处于冻结状态', extra: '需复核' },
            { title: '待激活账号', description: '当前 1 个新账号待首登激活', extra: '关注' },
            { title: '角色同步', description: '最近一次同步已完成', extra: '完成' },
          ],
          showExtra: true,
          showAction: false,
        },
        style: createSurfaceStyle('#ffffff', '#0f172a'),
      }),
    ],
    pageActions: [
      {
        id: 'page_approval_success',
        type: 'showToast',
        payload: { message: '同步完成，正在刷新数据', type: 'success' },
        next: 'page_approval_refresh',
      },
      {
        id: 'page_approval_fail',
        type: 'showToast',
        payload: { message: '同步失败，请重试', type: 'error' },
      },
      {
        id: 'page_approval_refresh',
        type: 'refresh-data',
        targetId: 'tpl_approval_table',
        next: 'page_approval_refresh_summary',
      },
      {
        id: 'page_approval_refresh_summary',
        type: 'refresh-data',
        targetId: 'tpl_approval_summary',
        next: 'page_approval_refresh_activity',
      },
      {
        id: 'page_approval_refresh_activity',
        type: 'refresh-data',
        targetId: 'tpl_approval_timeline',
      },
    ],
    globalActions: [
      {
        id: 'global_approval_emit',
        type: 'emit',
        payload: { event: 'users:changed', data: { source: 'user-management-template' } },
      },
    ],
  }
}

function buildSecureLoginTemplate(): PageTemplateInstance {
  return {
    root: {
      columns: buildFrTracks(12),
      rows: buildFrTracks(8),
      gap: 12,
      style: { backgroundColor: '#0f172a' },
    },
    nodes: [
      buildGridNode({
        id: 'tpl_login_title',
        component: 'Text',
        area: [4, 10, 2, 3],
        props: {
          content: '账号登录',
          fontSize: 34,
          color: '#f8fafc',
          fontWeight: 700,
          textAlign: 'center',
        },
        style: createSurfaceStyle('#111827', '#f8fafc', 'flat'),
      }),
      buildGridNode({
        id: 'tpl_login_user',
        component: 'TextInput',
        area: [4, 10, 3, 4],
        props: { placeholder: '用户名 / 邮箱', clearable: true },
        style: createSurfaceStyle('#111827', '#f8fafc'),
      }),
      buildGridNode({
        id: 'tpl_login_pass',
        component: 'TextInput',
        area: [4, 10, 4, 5],
        props: { placeholder: '密码', type: 'password' },
        style: createSurfaceStyle('#111827', '#f8fafc'),
      }),
      buildGridNode({
        id: 'tpl_login_submit',
        component: 'Button',
        area: [4, 7, 5, 6],
        props: { text: '登录', type: 'primary' },
        actions: [
          {
            id: 'node_login_call_api',
            type: 'callApi',
            payload: {
              apiId: 'https://jsonplaceholder.typicode.com/todos/1',
              method: 'GET',
              resultPath: 'auth.lastLoginResult',
            },
            confirm: { message: '确认登录？' },
            debounce: 500,
            handlers: {
              success: 'page_login_success',
              fail: 'page_login_fail',
              complete: 'node_login_complete',
            },
          },
          {
            id: 'node_login_complete',
            type: 'setState',
            payload: { path: 'auth.loading', value: false },
          },
        ],
        events: {
          click: ['node_login_call_api', { type: 'ref', scope: 'global', id: 'global_login_emit' }],
        },
        style: createSurfaceStyle('#111827', '#f8fafc'),
      }),
      buildGridNode({
        id: 'tpl_login_reset',
        component: 'Button',
        area: [7, 10, 5, 6],
        props: { text: '重置', type: 'default' },
        actions: [
          {
            id: 'node_login_reset',
            type: 'setState',
            payload: { path: 'auth.form', value: {} },
            next: 'node_login_reset_toast',
          },
          {
            id: 'node_login_reset_toast',
            type: 'showToast',
            payload: { message: '已重置登录信息', type: 'info' },
          },
        ],
        events: { click: ['node_login_reset'] },
        style: createSurfaceStyle('#111827', '#f8fafc'),
      }),
      buildGridNode({
        id: 'tpl_login_policy',
        component: 'Button',
        area: [4, 10, 6, 7],
        props: { text: '隐私政策', type: 'default' },
        events: { click: [{ type: 'ref', scope: 'global', id: 'global_login_policy' }] },
        style: createSurfaceStyle('#111827', '#f8fafc'),
      }),
    ],
    pageActions: [
      {
        id: 'page_login_success',
        type: 'showToast',
        payload: { message: '登录成功', type: 'success' },
        next: 'page_login_navigate',
      },
      {
        id: 'page_login_navigate',
        type: 'navigate',
        payload: { path: '/dashboard' },
      },
      {
        id: 'page_login_fail',
        type: 'showToast',
        payload: { message: '登录失败，请重试', type: 'error' },
      },
    ],
    globalActions: [
      {
        id: 'global_login_emit',
        type: 'emit',
        payload: { event: 'auth:login', data: { source: 'secure-login-template' } },
      },
      {
        id: 'global_login_policy',
        type: 'openUrl',
        payload: { url: 'https://example.com/privacy', target: '_blank' },
      },
    ],
  }
}

function buildProjectBoardTemplate(): PageTemplateInstance {
  return {
    root: {
      columns: buildFrTracks(12),
      rows: buildFrTracks(9),
      gap: 12,
      style: { backgroundColor: '#f3f4f6' },
    },
    nodes: [
      buildGridNode({
        id: 'tpl_board_title',
        component: 'Text',
        area: [1, 8, 1, 2],
        props: {
          content: '项目推进看板',
          fontSize: 30,
          color: '#0f172a',
          fontWeight: 700,
        },
        style: createSurfaceStyle('#ffffff', '#0f172a'),
      }),
      buildGridNode({
        id: 'tpl_board_focus',
        component: 'Button',
        area: [8, 10, 1, 2],
        props: { text: '聚焦风险', type: 'warning' },
        actions: [
          { id: 'node_board_highlight_risk', type: 'highlight', targetId: 'tpl_board_risk' },
          {
            id: 'node_board_highlight_notice',
            type: 'showToast',
            payload: { message: '已聚焦风险区域', type: 'warning' },
          },
        ],
        events: { click: ['node_board_highlight_risk', 'node_board_highlight_notice'] },
        style: createSurfaceStyle('#ffffff', '#0f172a'),
      }),
      buildGridNode({
        id: 'tpl_board_progress',
        component: 'progress',
        area: [10, 13, 1, 2],
        props: {
          percentage: 72,
          status: 'success',
          strokeWidth: 16,
          textInside: true,
          showStripe: true,
          animateStripe: true,
        },
        style: createSurfaceStyle('#ffffff', '#0f172a'),
      }),
      buildGridNode({
        id: 'tpl_board_timeline',
        component: 'list',
        area: [1, 7, 2, 10],
        props: {
          data: [
            {
              title: '需求冻结',
              timestamp: '2026-02-01',
              content: '范围确认完成',
              type: 'success',
            },
            { title: '设计评审', timestamp: '2026-02-06', content: '主流程通过', type: 'success' },
            { title: '开发联调', timestamp: '2026-02-12', content: '进行中', type: 'primary' },
            { title: '灰度发布', timestamp: '2026-02-24', content: '计划中', type: 'info' },
          ],
        },
        style: createSurfaceStyle('#ffffff', '#0f172a'),
      }),
      buildGridNode({
        id: 'tpl_board_member',
        component: 'table',
        area: [7, 13, 2, 7],
        props: {
          border: true,
          stripe: true,
          columns: [
            { prop: 'role', label: '角色' },
            { prop: 'count', label: '人数' },
            { prop: 'stack', label: '技能' },
          ],
          data: [
            { role: '产品经理', count: '1 人', stack: '需求/排期' },
            { role: '前端开发', count: '3 人', stack: 'Vue/TS' },
            { role: '后端开发', count: '2 人', stack: 'Node/API' },
            { role: '测试', count: '2 人', stack: '功能/回归' },
          ],
        },
        style: createSurfaceStyle('#ffffff', '#0f172a'),
      }),
      buildGridNode({
        id: 'tpl_board_risk',
        component: 'list',
        area: [7, 13, 7, 10],
        props: {
          data: [
            { title: '接口响应偏慢', description: '建议排查数据库索引', extra: '高' },
            { title: '回归覆盖不足', description: '补充支付链路用例', extra: '中' },
            { title: '上线窗口冲突', description: '需与运维二次确认', extra: '低' },
          ],
        },
        style: createSurfaceStyle('#ffffff', '#0f172a'),
      }),
    ],
  }
}

export const templates: PageTemplate[] = [
  {
    id: 'ops-dashboard',
    name: '运营总览大屏',
    description: 'KPI + 趋势图 + 占比图 + 明细表，含刷新与帮助动作。',
    category: 'dashboard',
    preview: ['#0f172a', '#1e293b'],
    build: buildOpsDashboardTemplate,
  },
  {
    id: 'analysis-report',
    name: '多维分析报表',
    description: '趋势、柱状、饼图与指标表组合，适合周报/月报页面。',
    category: 'analysis',
    preview: ['#f8fafc', '#dbeafe'],
    build: buildAnalysisTemplate,
  },
  {
    id: 'query-workbench',
    name: '订单管理页',
    description: '筛选表单 + 汇总卡片 + 明细表，使用本地 mock API 演示真实查询刷新。',
    category: 'form',
    preview: ['#f8fafc', '#cbd5e1'],
    build: buildQueryWorkbenchTemplate,
  },
  {
    id: 'approval-center',
    name: '用户管理页',
    description: '用户表格 + 状态同步 + 活动动态，适合演示数据源与事件联动。',
    category: 'management',
    preview: ['#f1f5f9', '#94a3b8'],
    build: buildApprovalCenterTemplate,
  },
  {
    id: 'secure-login',
    name: '登录页',
    description: '登录、重置、跳转、外链等常见交互已预置。',
    category: 'form',
    preview: ['#0f172a', '#334155'],
    build: buildSecureLoginTemplate,
  },
  {
    id: 'project-board',
    name: '项目推进看板',
    description: '进度、时间线、团队与风险视图，内置风险聚焦动作。',
    category: 'management',
    preview: ['#f3f4f6', '#9ca3af'],
    build: buildProjectBoardTemplate,
  },
]

export function getTemplateById(id: string): PageTemplate | undefined {
  return templates.find((item) => item.id === id)
}

export function instantiateTemplate(id: string): PageTemplateInstance | undefined {
  const template = getTemplateById(id)
  if (!template) return undefined
  return template.build()
}

export function getTemplatesByCategory(category: TemplateCategory): PageTemplate[] {
  return templates.filter((item) => item.category === category)
}
