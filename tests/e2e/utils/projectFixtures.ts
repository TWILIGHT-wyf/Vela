import type { Page } from '@playwright/test'
import type { ProjectSchema } from '@vela/core'
import type { ServerProject } from '@vela/core/contracts'

const primarySchema: ProjectSchema = {
  id: 'project_schema_primary',
  version: '2.0.0',
  name: '演示项目',
  description: 'GIS#示例项目',
  config: {
    target: 'pc',
  },
  pages: [
    {
      id: 'page_1',
      type: 'page',
      name: '首页',
      path: '/',
      config: {
        defaultLayoutMode: 'free',
      },
      state: [],
      apis: [],
      children: {
        id: 'root',
        component: 'Page',
        container: { mode: 'free' },
        props: {},
        style: {
          width: '100%',
          height: '100%',
          position: 'relative',
          backgroundColor: '#ffffff',
        },
        children: [
          {
            id: 'text_1',
            component: 'Text',
            props: { text: 'Vela Studio 演示项目' },
            style: {
              width: 280,
              height: 64,
              fontSize: 24,
              color: '#1f2933',
            },
            geometry: {
              mode: 'free',
              x: 120,
              y: 80,
              width: 280,
              height: 64,
              zIndex: 2,
            },
            children: [],
          },
          {
            id: 'button_1',
            component: 'Button',
            props: { text: '示例按钮', type: 'primary' },
            style: {
              width: 160,
              height: 40,
            },
            geometry: {
              mode: 'free',
              x: 120,
              y: 200,
              width: 160,
              height: 40,
              zIndex: 1,
            },
            children: [],
          },
        ],
      },
    },
  ],
}

const chartSchema: ProjectSchema = {
  id: 'project_schema_chart',
  version: '2.0.0',
  name: '图表分析',
  description: 'Chart#折线图看板',
  config: {
    target: 'pc',
  },
  pages: [
    {
      id: 'page_analytics',
      type: 'page',
      name: '分析页',
      path: '/',
      config: {
        defaultLayoutMode: 'grid',
      },
      state: [],
      apis: [],
      children: {
        id: 'root_chart',
        component: 'Page',
        container: { mode: 'grid', columns: '1fr', rows: '1fr', gap: 8 },
        props: {},
        style: {
          width: '100%',
          height: '100%',
        },
        children: [],
      },
    },
  ],
}

const serverProjects: ServerProject[] = [
  {
    _id: 'mock-project',
    name: '演示项目',
    description: 'GIS#示例项目',
    schema: primarySchema,
    createdAt: new Date('2024-01-01T00:00:00Z').toISOString(),
    updatedAt: new Date('2024-03-01T00:00:00Z').toISOString(),
  },
  {
    _id: 'chart-project',
    name: '图表分析',
    description: 'Chart#折线图看板',
    schema: chartSchema,
    createdAt: new Date('2024-02-01T00:00:00Z').toISOString(),
    updatedAt: new Date('2024-03-15T00:00:00Z').toISOString(),
  },
]

function buildServerResponse(body: unknown) {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: body }),
  }
}

export async function mockProjectApis(page: Page) {
  await page.route('**/api/projects**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname
    const method = request.method()

    if (method === 'GET' && path === '/api/projects') {
      return route.fulfill(buildServerResponse(serverProjects))
    }

    if (method === 'GET' && path.startsWith('/api/projects/')) {
      const id = path.replace('/api/projects/', '')
      const match = serverProjects.find((p) => p._id === id) || null
      return route.fulfill(buildServerResponse(match))
    }

    if (method === 'POST' && path === '/api/projects') {
      return route.fulfill(buildServerResponse(serverProjects[0]))
    }

    if (method === 'PUT' && path.startsWith('/api/projects/')) {
      const id = path.replace('/api/projects/', '')
      const match = serverProjects.find((p) => p._id === id) || serverProjects[0]
      return route.fulfill(buildServerResponse(match))
    }

    if (method === 'DELETE' && path.startsWith('/api/projects/')) {
      return route.fulfill(buildServerResponse(null))
    }

    return route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Not Found' }),
    })
  })
}

export async function seedLocalProject(page: Page) {
  await page.addInitScript((project) => {
    window.localStorage.setItem('vela_project', JSON.stringify(project))
  }, primarySchema)
}

export async function bootstrapProjects(page: Page) {
  await mockProjectApis(page)
  await seedLocalProject(page)
}

export const PRIMARY_PROJECT_ID = serverProjects[0]._id
