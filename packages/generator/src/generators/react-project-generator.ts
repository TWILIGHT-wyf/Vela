/**
 * React 项目脚手架生成器
 * 生成完整的 React + TypeScript + Vite 项目结构
 */

import { generateReactCode, generateReactFiles } from './react-generator'
import { transformToIRComponent } from '../transformer/schema-to-ir'
import type { Component } from '../components'
import type { IRComponent } from '../types/ir'

// ============================================================
// 类型定义
// ============================================================

export interface ReactPage {
  id: string
  name: string
  route?: string
  components: Component[]
}

export interface ReactProject {
  name: string
  description?: string
  pages: ReactPage[]
}

export interface ReactExportOptions {
  typescript: boolean
  cssModules: boolean
  router: 'react-router' | 'tanstack-router'
  stateManagement?: 'zustand' | 'jotai' | 'redux' | 'none'
}

export interface GeneratedFile {
  path: string
  content: string
}

// ============================================================
// 项目生成
// ============================================================

/**
 * 生成 React 项目文件列表
 */
export function generateReactProject(
  project: ReactProject,
  options: ReactExportOptions
): GeneratedFile[] {
  const files: GeneratedFile[] = []
  const ext = options.typescript ? 'tsx' : 'jsx'
  const configExt = options.typescript ? 'ts' : 'js'

  // 配置文件
  files.push({
    path: 'package.json',
    content: createPackageJson(project, options),
  })

  files.push({
    path: `vite.config.${configExt}`,
    content: createViteConfig(options),
  })

  if (options.typescript) {
    files.push({
      path: 'tsconfig.json',
      content: createTsConfig(),
    })

    files.push({
      path: 'tsconfig.node.json',
      content: createTsConfigNode(),
    })
  }

  files.push({
    path: 'index.html',
    content: createIndexHtml(project.name, options),
  })

  // 源代码文件
  files.push({
    path: `src/main.${ext}`,
    content: createMainEntry(options),
  })

  files.push({
    path: `src/App.${ext}`,
    content: createAppComponent(project, options),
  })

  files.push({
    path: 'src/index.css',
    content: createGlobalStyles(),
  })

  // 路由配置
  files.push({
    path: `src/router/index.${ext}`,
    content: createRouterConfig(project, options),
  })

  // 页面组件
  for (const page of project.pages) {
    const ir = transformToIRComponent(page.components, toPascalCase(page.name))
    const { tsx, css } = generateReactFiles(ir)

    files.push({
      path: `src/pages/${toPascalCase(page.name)}.${ext}`,
      content: tsx,
    })

    if (options.cssModules) {
      files.push({
        path: `src/pages/${toPascalCase(page.name)}.module.css`,
        content: css,
      })
    }
  }

  // 运行时库
  files.push({
    path: `src/hooks/useEventExecutor.${configExt}`,
    content: createUseEventExecutor(options),
  })

  files.push({
    path: `src/hooks/useDataBinding.${configExt}`,
    content: createUseDataBinding(options),
  })

  // 图表组件包装器
  files.push({
    path: `src/components/Chart.${ext}`,
    content: createChartComponent(options),
  })

  // ESLint 和 Prettier
  files.push({
    path: 'eslint.config.js',
    content: createEslintConfig(options),
  })

  files.push({
    path: '.prettierrc',
    content: createPrettierConfig(),
  })

  // .gitignore
  files.push({
    path: '.gitignore',
    content: createGitignore(),
  })

  return files
}

// ============================================================
// 文件生成函数
// ============================================================

function createPackageJson(project: ReactProject, options: ReactExportOptions): string {
  const deps: Record<string, string> = {
    react: '^18.3.1',
    'react-dom': '^18.3.1',
  }

  // 路由
  if (options.router === 'react-router') {
    deps['react-router-dom'] = '^6.28.0'
  } else {
    deps['@tanstack/react-router'] = '^1.82.0'
  }

  // 状态管理
  if (options.stateManagement === 'zustand') {
    deps['zustand'] = '^5.0.2'
  } else if (options.stateManagement === 'jotai') {
    deps['jotai'] = '^2.10.3'
  } else if (options.stateManagement === 'redux') {
    deps['@reduxjs/toolkit'] = '^2.4.0'
    deps['react-redux'] = '^9.2.0'
  }

  // UI 和工具库
  deps['axios'] = '^1.7.9'
  deps['echarts'] = '^5.5.1'
  deps['echarts-for-react'] = '^3.0.2'
  deps['lodash-es'] = '^4.17.21'
  // 注意：@vela/ui-react 组件库暂未发布，生成的代码可能需要手动调整组件导入

  const devDeps: Record<string, string> = {
    vite: '^6.0.5',
    '@vitejs/plugin-react': '^4.3.4',
  }

  if (options.typescript) {
    devDeps['typescript'] = '^5.7.2'
    devDeps['@types/react'] = '^18.3.17'
    devDeps['@types/react-dom'] = '^18.3.5'
    devDeps['@types/lodash-es'] = '^4.17.12'
  }

  // ESLint
  devDeps['eslint'] = '^9.17.0'
  devDeps['@eslint/js'] = '^9.17.0'
  devDeps['eslint-plugin-react'] = '^7.37.2'
  devDeps['eslint-plugin-react-hooks'] = '^5.1.0'
  devDeps['eslint-plugin-react-refresh'] = '^0.4.16'
  devDeps['prettier'] = '^3.4.2'

  if (options.typescript) {
    devDeps['typescript-eslint'] = '^8.18.2'
  }

  const scripts: Record<string, string> = {
    dev: 'vite',
    build: options.typescript ? 'tsc -b && vite build' : 'vite build',
    preview: 'vite preview',
    lint: 'eslint .',
    format: 'prettier --write .',
  }

  const pkg = {
    name: sanitizeName(project.name),
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts,
    dependencies: deps,
    devDependencies: devDeps,
  }

  return JSON.stringify(pkg, null, 2)
}

function createViteConfig(options: ReactExportOptions): string {
  return `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
`
}

function createTsConfig(): string {
  return JSON.stringify({
    compilerOptions: {
      target: 'ES2020',
      useDefineForClassFields: true,
      lib: ['ES2020', 'DOM', 'DOM.Iterable'],
      module: 'ESNext',
      skipLibCheck: true,
      moduleResolution: 'bundler',
      allowImportingTsExtensions: true,
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: 'react-jsx',
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noFallthroughCasesInSwitch: true,
      paths: {
        '@/*': ['./src/*'],
      },
    },
    include: ['src'],
    references: [{ path: './tsconfig.node.json' }],
  }, null, 2)
}

function createTsConfigNode(): string {
  return JSON.stringify({
    compilerOptions: {
      composite: true,
      skipLibCheck: true,
      module: 'ESNext',
      moduleResolution: 'bundler',
      allowSyntheticDefaultImports: true,
      strict: true,
    },
    include: ['vite.config.ts'],
  }, null, 2)
}

function createIndexHtml(projectName: string, options: ReactExportOptions): string {
  const ext = options.typescript ? 'tsx' : 'jsx'
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.${ext}"></script>
  </body>
</html>
`
}

function createMainEntry(options: ReactExportOptions): string {
  if (options.router === 'tanstack-router') {
    return `import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')${options.typescript ? '!' : ''}).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
`
  }

  return `import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')${options.typescript ? '!' : ''}).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
`
}

function createAppComponent(project: ReactProject, options: ReactExportOptions): string {
  const imports = project.pages.map((p) =>
    `const ${toPascalCase(p.name)} = React.lazy(() => import('./pages/${toPascalCase(p.name)}'))`
  ).join('\n')

  const routes = project.pages.map((p) => {
    const path = p.route || `/${toKebabCase(p.name)}`
    return `        <Route path="${path}" element={<${toPascalCase(p.name)} />} />`
  }).join('\n')

  const firstRoute = project.pages[0]?.route || `/${toKebabCase(project.pages[0]?.name || 'home')}`

  return `import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

${imports}

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
${routes}
        <Route path="/" element={<Navigate to="${firstRoute}" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
`
}

function createRouterConfig(project: ReactProject, options: ReactExportOptions): string {
  if (options.router === 'react-router') {
    const routes = project.pages.map((p) => ({
      path: p.route || `/${toKebabCase(p.name)}`,
      name: toPascalCase(p.name),
    }))

    return `import { createBrowserRouter } from 'react-router-dom'
${routes.map((r) => `import ${r.name} from '../pages/${r.name}'`).join('\n')}

export const router = createBrowserRouter([
${routes.map((r) => `  { path: '${r.path}', element: <${r.name} /> },`).join('\n')}
  { path: '/', element: null }, // Redirect to first page
])
`
  }

  // TanStack Router
  const routes = project.pages.map((p) => ({
    path: p.route || `/${toKebabCase(p.name)}`,
    name: toPascalCase(p.name),
    id: toKebabCase(p.name),
  }))

  const firstRoute = routes[0]?.path || '/'

  return `import { createRouter, createRoute, createRootRoute, redirect } from '@tanstack/react-router'
import React from 'react'

// Lazy load page components
${routes.map((r) => `const ${r.name} = React.lazy(() => import('../pages/${r.name}'))`).join('\n')}

// Root route
const rootRoute = createRootRoute()

// Page routes
${routes.map((r) => `const ${r.id}Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '${r.path}',
  component: ${r.name},
})`).join('\n\n')}

// Index route (redirect to first page)
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '${firstRoute}' })
  },
})

// Route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
${routes.map((r) => `  ${r.id}Route,`).join('\n')}
])

// Create router instance
export const router = createRouter({ routeTree })

// Type declaration for TypeScript
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
`
}

function createGlobalStyles(): string {
  return `:root {
  font-family: 'Segoe UI', Roboto, Oxygen, sans-serif;
  color: #e5e9f0;
  background-color: #0f111a;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body, #root {
  height: 100%;
}

body {
  overflow: hidden;
}

.runtime-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background-color: #0f111a;
}
`
}

function createUseEventExecutor(options: ReactExportOptions): string {
  const types = options.typescript ? `
interface EventAction {
  type: string
  targetId?: string
  delay?: number
  [key: string]: unknown
}

interface ExecutorOptions {
  components: React.MutableRefObject<Record<string, unknown>[]>
}
` : ''

  return `${types}
import { useCallback } from 'react'

export function useEventExecutor(options${options.typescript ? ': ExecutorOptions' : ''}) {
  const executeAction = useCallback(async (action${options.typescript ? ': EventAction' : ''}) => {
    // 延迟处理
    if (action.delay && action.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, action.delay))
    }

    switch (action.type) {
      case 'toggle-visibility':
        // 切换组件可见性
        console.log('Toggle visibility:', action.targetId)
        break

      case 'navigate':
        // 页面导航
        if (action.url) {
          window.open(action.url${options.typescript ? ' as string' : ''}, action.target${options.typescript ? ' as string' : ''} || '_blank')
        }
        break

      case 'show-toast':
        // 显示消息
        console.log('Show toast:', action.message)
        break

      case 'custom-script':
        // 自定义脚本 (沙箱执行)
        try {
          const fn = new Function('components', action.content${options.typescript ? ' as string' : ''})
          fn(options.components.current)
        } catch (error) {
          console.error('Script execution error:', error)
        }
        break

      default:
        console.log('Unknown action:', action.type)
    }
  }, [options.components])

  return { executeAction }
}
`
}

function createUseDataBinding(options: ReactExportOptions): string {
  const types = options.typescript ? `
interface DataBinding {
  sourceId: string
  sourcePath: string
  targetPath: string
  transformer?: string
}

interface ComponentData {
  id: string
  props: Record<string, unknown>
  [key: string]: unknown
}
` : ''

  return `${types}
import { useEffect, useRef } from 'react'
import { get, set, isEqual } from 'lodash-es'

export function useDataBinding(
  componentsData${options.typescript ? ': ComponentData[]' : ''},
  setComponentsData${options.typescript ? ': React.Dispatch<React.SetStateAction<ComponentData[]>>' : ''}
) {
  const updateLocks = useRef(new Set${options.typescript ? '<string>' : ''}())

  useEffect(() => {
    // 收集所有绑定关系
    const bindings${options.typescript ? ': DataBinding[]' : ''} = []

    for (const comp of componentsData) {
      const compBindings = (comp${options.typescript ? ' as any' : ''}).dataBindings || []
      for (const binding of compBindings) {
        bindings.push({
          ...binding,
          targetId: comp.id,
        })
      }
    }

    if (bindings.length === 0) return

    // 创建组件索引
    const compById = new Map(componentsData.map(c => [c.id, c]))

    // 执行初始绑定
    for (const binding of bindings) {
      const source = compById.get(binding.sourceId)
      const target = compById.get(binding.targetId${options.typescript ? '!' : ''})

      if (!source || !target) continue

      const sourceValue = get(source, binding.sourcePath)
      const lockKey = \`\${binding.targetId}:\${binding.targetPath}\`

      if (updateLocks.current.has(lockKey)) continue

      try {
        updateLocks.current.add(lockKey)

        let finalValue = sourceValue
        if (binding.transformer) {
          const fn = new Function('value', \`return \${binding.transformer}\`)
          finalValue = fn(sourceValue)
        }

        const currentValue = get(target, binding.targetPath)
        if (!isEqual(currentValue, finalValue)) {
          setComponentsData(prev => {
            const next = [...prev]
            const idx = next.findIndex(c => c.id === binding.targetId)
            if (idx !== -1) {
              set(next[idx], binding.targetPath, finalValue)
            }
            return next
          })
        }
      } finally {
        setTimeout(() => updateLocks.current.delete(lockKey), 0)
      }
    }
  }, [componentsData, setComponentsData])
}
`
}

function createEslintConfig(options: ReactExportOptions): string {
  if (options.typescript) {
    return `import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
)
`
  }

  return `import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
]
`
}

function createPrettierConfig(): string {
  return JSON.stringify({
    semi: false,
    singleQuote: true,
    trailingComma: 'all',
    printWidth: 100,
    tabWidth: 2,
  }, null, 2)
}

function createChartComponent(options: ReactExportOptions): string {
  const types = options.typescript ? `
import type { EChartsOption } from 'echarts'

interface ChartProps {
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'radar' | 'gauge' | 'funnel' | 'sankey'
  data?: unknown[]
  option?: EChartsOption
  style?: React.CSSProperties
  className?: string
  onChartReady?: (chart: unknown) => void
}
` : ''

  return `${types}
import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'

/**
 * 通用图表组件
 * 封装 echarts-for-react 以便于在生成的代码中使用
 */
export function Chart({
  type,
  data = [],
  option: customOption,
  style,
  className,
  onChartReady,
}${options.typescript ? ': ChartProps' : ''}) {
  // 根据图表类型生成默认配置
  const defaultOption = useMemo(() => {
    const baseOption${options.typescript ? ': EChartsOption' : ''} = {
      tooltip: { trigger: type === 'pie' ? 'item' : 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    }

    switch (type) {
      case 'line':
      case 'bar':
        return {
          ...baseOption,
          xAxis: { type: 'category', data: (data as { name: string }[]).map(d => d.name || d) },
          yAxis: { type: 'value' },
          series: [{ type, data: (data as { value: number }[]).map(d => d.value ?? d) }],
        }

      case 'pie':
        return {
          ...baseOption,
          series: [{ type: 'pie', radius: '50%', data }],
        }

      case 'scatter':
        return {
          ...baseOption,
          xAxis: { type: 'value' },
          yAxis: { type: 'value' },
          series: [{ type: 'scatter', data }],
        }

      case 'radar':
        return {
          ...baseOption,
          radar: { indicator: (data as { name: string }[]).map(d => ({ name: d.name || '' })) },
          series: [{ type: 'radar', data: [{ value: (data as { value: number }[]).map(d => d.value ?? 0) }] }],
        }

      case 'gauge':
        return {
          ...baseOption,
          series: [{ type: 'gauge', data: [{ value: Array.isArray(data) && data[0] ? (data[0] as { value: number }).value ?? data[0] : 0 }] }],
        }

      case 'funnel':
        return {
          ...baseOption,
          series: [{ type: 'funnel', data }],
        }

      case 'sankey':
        return {
          ...baseOption,
          series: [{ type: 'sankey', data: [], links: data }],
        }

      default:
        return baseOption
    }
  }, [type, data])

  // 合并自定义配置
  const finalOption = customOption ? { ...defaultOption, ...customOption } : defaultOption

  return (
    <ReactECharts
      option={finalOption}
      style={style || { width: '100%', height: '300px' }}
      className={className}
      onChartReady={onChartReady}
      notMerge={true}
      lazyUpdate={true}
    />
  )
}

export default Chart
`
}

function createGitignore(): string {
  return `# Dependencies
node_modules/

# Build output
dist/
build/

# IDE
.vscode/
.idea/
*.swp
*.swo

# Logs
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db

# Environment
.env
.env.local
.env.*.local

# TypeScript
*.tsbuildinfo
`
}

// ============================================================
// 工具函数
// ============================================================

function sanitizeName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'react-app'
}

function toPascalCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join('')
}

function toKebabCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/([A-Z])/g, '-$1')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}
