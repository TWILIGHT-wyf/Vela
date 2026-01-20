import type { Page } from '@playwright/test'
import type { ServerProject } from '@/types/api'
import type { Project as StoreProject } from '@/stores/project'

const baseStyle = { opacity: 100, visible: true, locked: false } as const

const serverProjects: ServerProject[] = [
  {
    _id: 'mock-project',
    name: '演示项目',
    description: 'GIS#示例项目',
    category: 'GIS',
    cover: '',
    createdAt: new Date('2024-01-01T00:00:00Z').toISOString(),
    updatedAt: new Date('2024-03-01T00:00:00Z').toISOString(),
    pages: [
      {
        id: 'page-1',
        name: '首页',
        components: [
          {
            id: 'text_1',
            type: 'Text',
            name: '标题',
            position: { x: 120, y: 80 },
            size: { width: 280, height: 64 },
            rotation: 0,
            zindex: 2,
            style: { ...baseStyle, fontSize: 24, fontColor: '#1f2933' },
            props: { text: 'Vela Studio 演示项目' },
            dataSource: undefined,
          },
          {
            id: 'panel_1',
            type: 'panel',
            name: '信息面板',
            position: { x: 80, y: 180 },
            size: { width: 320, height: 200 },
            rotation: 0,
            zindex: 1,
            style: { ...baseStyle, backgroundColor: '#ffffff', border: '1px solid #e5e7eb' },
            props: { title: '实时监控', content: '总览数据将在此展示' },
            dataSource: undefined,
          },
        ],
        canvasSettings: {
          width: 1440,
          height: 900,
          backgroundColor: '#101623',
          gridEnabled: true,
          snapEnabled: true,
        },
      },
    ],
  },
  {
    _id: 'chart-project',
    name: '图表分析',
    description: 'Chart#折线图看板',
    category: 'Chart',
    cover: '',
    createdAt: new Date('2024-02-01T00:00:00Z').toISOString(),
    updatedAt: new Date('2024-03-15T00:00:00Z').toISOString(),
    pages: [
      {
        id: 'page-analytics',
        name: '分析页',
        components: [],
      },
    ],
  },
]

const localProjects: StoreProject[] = serverProjects.map((project, idx) => ({
  id: project._id,
  name: project.name,
  description: project.description,
  cover: project.cover,
  createdAt: Date.now() - idx * 1000,
  updatedAt: Date.now() - idx * 1000,
  pages: project.pages.map((page) => ({
    ...page,
    components: page.components.map((comp) => ({ ...comp })),
  })),
}))

function buildServerResponse(body: unknown) {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: body }),
  }
}

export async function mockProjectApis(page: Page) {
  await page.route('**/api/projects**', async (route) => {
    const url = new URL(route.request().url())
    const isListEndpoint = url.pathname === '/api/projects'
    if (route.request().method() !== 'GET') {
      return route.fulfill({ status: 200, body: JSON.stringify({ data: null }) })
    }

    if (isListEndpoint) {
      return route.fulfill(buildServerResponse(serverProjects))
    }

    const id = url.pathname.replace('/api/projects/', '')
    const match = serverProjects.find((p) => p._id === id)
    return route.fulfill(buildServerResponse(match ?? null))
  })
}

export async function seedLocalProjects(page: Page) {
  await page.addInitScript((projects) => {
    window.localStorage.setItem('vela_projects', JSON.stringify(projects))
  }, localProjects)
}

export async function bootstrapProjects(page: Page) {
  await mockProjectApis(page)
  await seedLocalProjects(page)
}

export const PRIMARY_PROJECT_ID = serverProjects[0]._id
export const serverProjectFixtures = serverProjects
export const localProjectFixtures = localProjects
