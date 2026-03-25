import { Router } from 'express'

const router = Router()

// 简单计数器（用于演示状态）
let counter = 0

const orderRecords = [
  {
    id: 1,
    orderNo: 'ORD-202603-001',
    customer: '星河零售',
    owner: '周婷',
    amount: 2380,
    status: 'pending',
    statusLabel: '待支付',
    createdAt: '2026-03-18',
  },
  {
    id: 2,
    orderNo: 'ORD-202603-002',
    customer: '北川科技',
    owner: '陈野',
    amount: 5120,
    status: 'shipping',
    statusLabel: '待发货',
    createdAt: '2026-03-19',
  },
  {
    id: 3,
    orderNo: 'ORD-202603-003',
    customer: '云岚医疗',
    owner: '林夏',
    amount: 1680,
    status: 'done',
    statusLabel: '已完成',
    createdAt: '2026-03-20',
  },
  {
    id: 4,
    orderNo: 'ORD-202603-004',
    customer: '栖光教育',
    owner: '顾言',
    amount: 4200,
    status: 'shipping',
    statusLabel: '待发货',
    createdAt: '2026-03-21',
  },
  {
    id: 5,
    orderNo: 'ORD-202603-005',
    customer: '远山文旅',
    owner: '方宁',
    amount: 980,
    status: 'pending',
    statusLabel: '待支付',
    createdAt: '2026-03-22',
  },
  {
    id: 6,
    orderNo: 'ORD-202603-006',
    customer: '青禾制造',
    owner: '江澈',
    amount: 7560,
    status: 'done',
    statusLabel: '已完成',
    createdAt: '2026-03-23',
  },
  {
    id: 7,
    orderNo: 'ORD-202603-007',
    customer: '未央传媒',
    owner: '苏禾',
    amount: 2890,
    status: 'shipping',
    statusLabel: '待发货',
    createdAt: '2026-03-24',
  },
  {
    id: 8,
    orderNo: 'ORD-202603-008',
    customer: '泽安物流',
    owner: '许知远',
    amount: 3410,
    status: 'done',
    statusLabel: '已完成',
    createdAt: '2026-03-25',
  },
]

const userRecords = [
  {
    id: 1,
    name: '林晨',
    department: '平台研发',
    role: '管理员',
    status: '正常',
    lastLoginAt: '2026-03-25 09:12',
    email: 'linchen@vela.dev',
  },
  {
    id: 2,
    name: '沈月',
    department: '运营增长',
    role: '运营',
    status: '冻结',
    lastLoginAt: '2026-03-24 19:30',
    email: 'shenyue@vela.dev',
  },
  {
    id: 3,
    name: '周燃',
    department: '财务共享',
    role: '审核人',
    status: '正常',
    lastLoginAt: '2026-03-25 08:44',
    email: 'zhouran@vela.dev',
  },
  {
    id: 4,
    name: '顾念',
    department: '客户成功',
    role: '客服',
    status: '待激活',
    lastLoginAt: '2026-03-22 11:08',
    email: 'gunian@vela.dev',
  },
  {
    id: 5,
    name: '韩川',
    department: '数据分析',
    role: '分析师',
    status: '正常',
    lastLoginAt: '2026-03-25 10:03',
    email: 'hanchuan@vela.dev',
  },
]

const userActivities = [
  {
    title: '批量导入完成',
    description: '新增 12 个用户账号，等待首登激活',
    extra: '10:20',
  },
  {
    title: '冻结用户提醒',
    description: '运营组有 1 个账号连续输错密码 5 次',
    extra: '09:48',
  },
  {
    title: '角色变更',
    description: '林晨已从编辑升级为管理员',
    extra: '08:35',
  },
]

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function formatCurrency(value: number): string {
  return `¥${value.toLocaleString('zh-CN')}`
}

function filterOrders(query: Record<string, unknown>) {
  const keyword = normalizeText(query.keyword)
  const status = normalizeText(query.status)
  const startDate = typeof query.startDate === 'string' ? query.startDate.trim() : ''
  const endDate = typeof query.endDate === 'string' ? query.endDate.trim() : ''

  return orderRecords.filter((record) => {
    const matchesKeyword =
      !keyword ||
      [record.orderNo, record.customer, record.owner].some((field) =>
        field.toLowerCase().includes(keyword),
      )
    const matchesStatus = !status || status === 'all' || record.status === status
    const matchesStart = !startDate || record.createdAt >= startDate
    const matchesEnd = !endDate || record.createdAt <= endDate

    return matchesKeyword && matchesStatus && matchesStart && matchesEnd
  })
}

function buildOrderSummary(query: Record<string, unknown>) {
  const rows = filterOrders(query)
  const doneCount = rows.filter((item) => item.status === 'done').length
  const change = rows.length === 0 ? 0 : Number(((doneCount / rows.length) * 100 - 50).toFixed(1))

  return {
    title: '匹配订单',
    value: rows.length,
    change,
  }
}

// ========== 基础数据测试 ==========

router.get('/text', (req, res) => {
  res.json({ text: '这是从后端获取的文本内容 ✨' })
})

router.get('/nested', (req, res) => {
  res.json({
    code: 200,
    data: { message: '欢迎使用数据源功能！', user: { name: '张三', age: 25 } },
  })
})

router.get('/list', (req, res) => {
  res.json({
    items: [
      { id: 1, text: '第一项内容' },
      { id: 2, text: '第二项内容' },
      { id: 3, text: '第三项内容' },
    ],
  })
})

router.get('/time', (req, res) => {
  const now = new Date()
  res.json({
    time: now.toLocaleTimeString('zh-CN'),
    date: now.toLocaleDateString('zh-CN'),
    timestamp: now.getTime(),
  })
})

router.get('/counter', (req, res) => {
  counter++
  res.json({ count: counter, message: `计数器: ${counter}` })
})

// ========== 图表数据 ==========

router.get('/chart/simple', (req, res) => {
  res.json({
    chartData: [120, 200, 150, 80, 70, 110, 130],
    labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
  })
})

router.get('/chart/realtime', (req, res) => {
  const count = 7
  const data = Array.from({ length: count }, () => Math.floor(Math.random() * 200 + 50))
  const now = new Date()
  const labels = Array.from({ length: count }, (_, i) => {
    const time = new Date(now.getTime() - (count - 1 - i) * 60000)
    return time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  })

  res.json({
    success: true,
    result: { series: data, xAxis: labels, timestamp: now.getTime() },
  })
})

router.get('/chart/pie', (req, res) => {
  res.json({
    title: '市场份额分布',
    data: {
      values: [335, 310, 234, 135, 148],
      labels: ['产品A', '产品B', '产品C', '产品D', '产品E'],
    },
  })
})

// ========== 表格/列表数据 ==========

router.get('/table-data', (req, res) => {
  res.json({
    code: 200,
    data: [
      {
        id: 1,
        name: '张三',
        age: 28,
        address: '北京市朝阳区',
        department: '技术部',
      },
      {
        id: 2,
        name: '李四',
        age: 32,
        address: '上海市浦东新区',
        department: '市场部',
      },
      {
        id: 3,
        name: '王五',
        age: 25,
        address: '广州市天河区',
        department: '设计部',
      },
    ],
  })
})

router.get('/select-options', (req, res) => {
  res.json({
    code: 200,
    data: [
      { label: '北京', value: 'beijing' },
      { label: '上海', value: 'shanghai' },
      { label: '广州', value: 'guangzhou' },
      { label: '深圳', value: 'shenzhen' },
    ],
  })
})

router.get('/orders/status-options', (req, res) => {
  res.json({
    code: 200,
    data: [
      { label: '全部状态', value: 'all' },
      { label: '待支付', value: 'pending' },
      { label: '待发货', value: 'shipping' },
      { label: '已完成', value: 'done' },
    ],
  })
})

router.get('/orders/summary', (req, res) => {
  res.json({
    code: 200,
    data: buildOrderSummary(req.query),
  })
})

router.get('/orders/insights', (req, res) => {
  const rows = filterOrders(req.query)
  const topRows = rows.slice(0, 3).map((item) => ({
    title: `${item.customer} · ${item.orderNo}`,
    description: `${item.statusLabel} · 负责人 ${item.owner}`,
    extra: formatCurrency(item.amount),
  }))

  res.json({
    code: 200,
    data: topRows,
  })
})

router.get('/orders', (req, res) => {
  const rows = filterOrders(req.query).map((item) => ({
    id: item.id,
    orderNo: item.orderNo,
    customer: item.customer,
    owner: item.owner,
    amount: formatCurrency(item.amount),
    status: item.statusLabel,
    createdAt: `${item.createdAt} 10:30`,
  }))

  res.json({
    code: 200,
    data: rows,
    meta: {
      total: rows.length,
    },
  })
})

router.get('/users/summary', (req, res) => {
  const activeCount = userRecords.filter((item) => item.status === '正常').length
  res.json({
    code: 200,
    data: {
      title: '正常账号',
      value: activeCount,
      change: 12.5,
    },
  })
})

router.get('/users/activity', (req, res) => {
  res.json({
    code: 200,
    data: userActivities,
  })
})

router.get('/users', (req, res) => {
  res.json({
    code: 200,
    data: userRecords,
  })
})

// ========== 地图数据 ==========

router.get('/map/markers', (req, res) => {
  res.json({
    code: 200,
    data: [
      { lat: 39.9042, lng: 116.4074, name: '北京', value: 100 },
      { lat: 31.2304, lng: 121.4737, name: '上海', value: 200 },
      { lat: 23.1291, lng: 113.2644, name: '广州', value: 150 },
    ],
  })
})

// ========== 实时监控数据 ==========

router.get('/stat/realtime', (req, res) => {
  const metrics = ['销售额', '用户数', '转化率', '活跃度']
  const title = metrics[Math.floor(Math.random() * metrics.length)]
  const value = Math.floor(Math.random() * 10000 + 1000)
  const change = parseFloat((Math.random() * 30 - 15).toFixed(1))

  res.json({
    title,
    value,
    change,
    timestamp: new Date().toLocaleTimeString('zh-CN'),
  })
})

router.get('/progress/realtime', (req, res) => {
  const progress = Math.floor(Math.random() * 100)
  const status = progress >= 80 ? 'success' : progress >= 50 ? 'warning' : 'exception'

  res.json({
    value: progress,
    status,
    timestamp: new Date().toLocaleTimeString('zh-CN'),
  })
})

export default router
