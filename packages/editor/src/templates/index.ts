import type { NodeSchema, NodeStyle } from '@vela/core'
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
      rows: buildFrTracks(8),
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
        props: { text: '查询说明', type: 'default' },
        events: { click: [{ type: 'ref', scope: 'global', id: 'global_query_help_link' }] },
        style: createSurfaceStyle('#ffffff', '#0f172a'),
      }),
      buildGridNode({
        id: 'tpl_query_keyword',
        component: 'TextInput',
        area: [1, 4, 2, 3],
        props: { placeholder: '输入订单号/客户名', clearable: true },
        style: createSurfaceStyle('#ffffff', '#0f172a'),
      }),
      buildGridNode({
        id: 'tpl_query_status',
        component: 'select',
        area: [4, 7, 2, 3],
        props: {
          placeholder: '订单状态',
          options: [
            { label: '全部', value: 'all' },
            { label: '待支付', value: 'pending' },
            { label: '待发货', value: 'shipping' },
            { label: '已完成', value: 'done' },
          ],
        },
        style: createSurfaceStyle('#ffffff', '#0f172a'),
      }),
      buildGridNode({
        id: 'tpl_query_range',
        component: 'dateRange',
        area: [7, 10, 2, 3],
        props: { startPlaceholder: '开始日期', endPlaceholder: '结束日期' },
        style: createSurfaceStyle('#ffffff', '#0f172a'),
      }),
      buildGridNode({
        id: 'tpl_query_submit',
        component: 'Button',
        area: [10, 11, 2, 3],
        props: { text: '查询', type: 'primary' },
        actions: [
          {
            id: 'node_query_call_api',
            type: 'callApi',
            payload: {
              apiId: 'https://jsonplaceholder.typicode.com/todos/1',
              method: 'GET',
              resultPath: 'orders.lastQuery',
            },
            handlers: {
              success: 'page_query_success',
              fail: 'page_query_fail',
              complete: 'node_query_complete',
            },
            debounce: 300,
          },
          {
            id: 'node_query_complete',
            type: 'setState',
            payload: { path: 'orders.loading', value: false },
          },
        ],
        events: {
          click: ['node_query_call_api', { type: 'ref', scope: 'global', id: 'global_query_emit' }],
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
            id: 'node_query_reset_filters',
            type: 'setState',
            payload: { path: 'orders.filters', value: {} },
            next: 'node_query_reset_notice',
          },
          {
            id: 'node_query_reset_notice',
            type: 'showToast',
            payload: { message: '筛选条件已重置', type: 'success' },
          },
        ],
        events: { click: ['node_query_reset_filters'] },
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
        id: 'tpl_query_table',
        component: 'table',
        area: [1, 13, 3, 9],
        props: {
          border: true,
          stripe: true,
          columns: [
            { prop: 'orderNo', label: '订单号' },
            { prop: 'customer', label: '客户' },
            { prop: 'amount', label: '金额' },
            { prop: 'status', label: '状态' },
            { prop: 'createdAt', label: '下单时间' },
          ],
          data: [
            {
              orderNo: 'Q-10021',
              customer: '张三',
              amount: '¥2,380',
              status: '待支付',
              createdAt: '2026-02-17 14:12',
            },
            {
              orderNo: 'Q-10022',
              customer: '李四',
              amount: '¥1,120',
              status: '待发货',
              createdAt: '2026-02-18 09:40',
            },
            {
              orderNo: 'Q-10023',
              customer: '王五',
              amount: '¥4,560',
              status: '已完成',
              createdAt: '2026-02-18 18:08',
            },
          ],
        },
        style: createSurfaceStyle('#ffffff', '#0f172a'),
      }),
    ],
    pageActions: [
      {
        id: 'page_query_success',
        type: 'showToast',
        payload: { message: '查询成功，表格已刷新', type: 'success' },
        next: 'page_query_refresh',
      },
      {
        id: 'page_query_fail',
        type: 'showToast',
        payload: { message: '查询失败，请稍后重试', type: 'error' },
      },
      {
        id: 'page_query_refresh',
        type: 'refresh-data',
        targetId: 'tpl_query_table',
      },
    ],
    globalActions: [
      {
        id: 'global_query_emit',
        type: 'emit',
        payload: { event: 'orders:query', data: { from: 'query-workbench-template' } },
      },
      {
        id: 'global_query_help_link',
        type: 'openUrl',
        payload: { url: 'https://example.com/query-help', target: '_blank' },
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
        area: [1, 9, 1, 2],
        props: { content: '审批中心', fontSize: 30, color: '#0f172a', fontWeight: 700 },
        style: createSurfaceStyle('#ffffff', '#0f172a'),
      }),
      buildGridNode({
        id: 'tpl_approval_pass',
        component: 'Button',
        area: [9, 11, 1, 2],
        props: { text: '通过', type: 'success' },
        actions: [
          {
            id: 'node_approval_pass_api',
            type: 'callApi',
            payload: {
              apiId: 'https://jsonplaceholder.typicode.com/posts/1',
              method: 'GET',
              resultPath: 'approval.lastResult',
            },
            confirm: { message: '确认通过当前审批？' },
            handlers: {
              success: 'page_approval_success',
              fail: 'page_approval_fail',
            },
          },
        ],
        events: {
          click: [
            'node_approval_pass_api',
            { type: 'ref', scope: 'global', id: 'global_approval_emit' },
          ],
        },
        style: createSurfaceStyle('#ffffff', '#0f172a'),
      }),
      buildGridNode({
        id: 'tpl_approval_reject',
        component: 'Button',
        area: [11, 13, 1, 2],
        props: { text: '驳回', type: 'danger' },
        actions: [
          {
            id: 'node_approval_reject_script',
            type: 'runScript',
            payload: { code: "console.warn('[template] reject approval request')" },
            confirm: { message: '确认驳回当前审批？' },
            next: 'page_approval_reject_notice',
          },
        ],
        events: { click: ['node_approval_reject_script'] },
        style: createSurfaceStyle('#ffffff', '#0f172a'),
      }),
      buildGridNode({
        id: 'tpl_approval_table',
        component: 'table',
        area: [1, 13, 2, 7],
        props: {
          border: true,
          stripe: true,
          columns: [
            { prop: 'requestId', label: '单号' },
            { prop: 'applicant', label: '申请人' },
            { prop: 'type', label: '类型' },
            { prop: 'priority', label: '优先级' },
            { prop: 'status', label: '状态' },
            { prop: 'createdAt', label: '创建时间' },
          ],
          data: [
            {
              requestId: 'APR-0901',
              applicant: 'Alex',
              type: '预算',
              priority: '高',
              status: '待审',
              createdAt: '2026-02-16 09:12',
            },
            {
              requestId: 'APR-0902',
              applicant: 'Mia',
              type: '权限',
              priority: '中',
              status: '待审',
              createdAt: '2026-02-16 10:38',
            },
            {
              requestId: 'APR-0903',
              applicant: 'Leo',
              type: '采购',
              priority: '低',
              status: '待审',
              createdAt: '2026-02-16 14:02',
            },
          ],
        },
        style: createSurfaceStyle('#ffffff', '#0f172a'),
      }),
      buildGridNode({
        id: 'tpl_approval_timeline',
        component: 'list',
        area: [1, 8, 7, 10],
        props: {
          data: [
            {
              title: '提交申请',
              timestamp: '2026-02-16 09:12',
              content: '申请人提交',
              type: 'primary',
            },
            {
              title: '主管审核',
              timestamp: '2026-02-16 10:00',
              content: '待处理',
              type: 'warning',
            },
            { title: '财务复核', timestamp: '2026-02-16 13:00', content: '待处理', type: 'info' },
          ],
        },
        style: createSurfaceStyle('#ffffff', '#0f172a'),
      }),
      buildGridNode({
        id: 'tpl_approval_notice',
        component: 'list',
        area: [8, 13, 7, 10],
        props: {
          data: [
            { title: '高优申请', description: '今日剩余 2 条', extra: '高' },
            { title: '逾期审批', description: '超过 24h 1 条', extra: '中' },
            { title: '系统公告', description: '审批规则已更新', extra: '低' },
          ],
        },
        style: createSurfaceStyle('#ffffff', '#0f172a'),
      }),
    ],
    pageActions: [
      {
        id: 'page_approval_success',
        type: 'showToast',
        payload: { message: '审批通过', type: 'success' },
        next: 'page_approval_refresh',
      },
      {
        id: 'page_approval_fail',
        type: 'showToast',
        payload: { message: '审批失败，请重试', type: 'error' },
      },
      {
        id: 'page_approval_reject_notice',
        type: 'showToast',
        payload: { message: '已驳回申请', type: 'warning' },
      },
      {
        id: 'page_approval_refresh',
        type: 'refresh-data',
        targetId: 'tpl_approval_table',
      },
    ],
    globalActions: [
      {
        id: 'global_approval_emit',
        type: 'emit',
        payload: { event: 'approval:changed', data: { source: 'approval-template' } },
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
    name: '查询列表工作台',
    description: '筛选区 + 数据表，预置查询、重置、导出等动作链路。',
    category: 'form',
    preview: ['#f8fafc', '#cbd5e1'],
    build: buildQueryWorkbenchTemplate,
  },
  {
    id: 'approval-center',
    name: '审批中心',
    description: '审批通过/驳回/刷新流程完整，适合事件联调和状态演示。',
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
