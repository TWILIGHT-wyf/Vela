// TODO: 代码生成器功能开发中 - 暂时注释以让编辑器正常运行
// import JSZip from 'jszip'
// import { saveAs } from 'file-saver'
// @babel/core 在浏览器中不可用，改为动态导入或使用简单的类型剥离
import { generateVueCode } from './toCode'

// Babel 实例缓存（仅在 Node.js 环境中使用）
let babelCore: typeof import('@babel/core') | null = null

/**
 * 检测是否在浏览器环境
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined'
}
import type { Component as ToCodeComponent } from './components'
import type { NodeSchema } from '@vela/core'
import useEventExecutorSource from '../../renderer/src/runtime/useEventExecutor.ts?raw'
import useDataBindingEngineSource from '../../renderer/src/runtime/useDataBindingEngine.ts?raw'

/**
 * Component type for code generation (flattened from NodeSchema)
 * This uses componentName which is different from toCode.ts Component which uses type
 */
export interface Component {
  id: string
  componentName: string
  props?: Record<string, unknown>
  style?: Record<string, unknown>
  children?: Component[]
  events?: Record<string, unknown[]>
}

/**
 * 转换本地 Component 格式为 toCode.ts 期望的格式
 */
function convertToCodeComponent(comp: Component): ToCodeComponent {
  // 从 style 中提取位置和尺寸信息
  const style = comp.style || {}
  const x = typeof style.x === 'number' ? style.x : (typeof style.left === 'number' ? style.left : 0)
  const y = typeof style.y === 'number' ? style.y : (typeof style.top === 'number' ? style.top : 0)
  const width = typeof style.width === 'number' ? style.width : 100
  const height = typeof style.height === 'number' ? style.height : 100

  return {
    id: comp.id,
    type: comp.componentName,
    position: { x, y },
    size: { width, height },
    props: comp.props,
    style: comp.style,
    events: comp.events as ToCodeComponent['events'],
  }
}

/**
 * 批量转换组件列表
 */
function convertComponents(components: Component[]): ToCodeComponent[] {
  return components.map(convertToCodeComponent)
}

/**
 * Page type for code generation
 */
export interface Page {
  id: string
  name: string
  route?: string
  components?: Component[]
}

/**
 * Project type for code generation
 */
export interface Project {
  id?: string
  name: string
  description?: string
  pages: Page[]
  cover?: string
  createdAt?: number
  updatedAt?: number
}

export interface ExportOptions {
  language: 'ts' | 'js' // 输出语言
  lint: boolean // 是否包含 ESLint/Prettier 配置
}

export interface GeneratedSourceFile {
  path: string
  content: string
}

/**
 * 生成的文件接口
 */
interface GeneratedFile {
  path: string // 文件路径
  content: string // 文件内容
  shouldProcess: boolean // 是否需要代码处理
}

/**
 * 页面产物接口
 */
interface PageArtifact {
  fileName: string // 文件名
  routePath: string // 路由路径
  routeName: string // 路由名称
  source: string // 源代码
}

/**
 * 将项目导出为 ZIP 压缩包
 * @param project 项目数据
 * @param options 导出选项
 */
export async function exportProjectToZip(project: Project, options: ExportOptions): Promise<void> {
  // TODO: 重新启用 ZIP 导出功能
  console.warn('ZIP 导出功能暂未启用')
  throw new Error('代码导出功能开发中，敬请期待...')

  /*
  if (!project) {
    throw new Error('需要有效的项目实例才能导出代码。')
  }

  const normalizedName = sanitizeProjectName(project.name || 'vela-project')
  const zip = new JSZip()
  const root = zip.folder(normalizedName)

  if (!root) {
    throw new Error('初始化 ZIP 结构失败。')
  }

  const files = buildProcessedFiles(project, options)

  for (const file of files) {
    root.file(file.path, file.content)
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  saveAs(blob, `${normalizedName}.zip`)
  */
}

export function generateProjectSourceFiles(
  project: Project,
  options: ExportOptions,
): GeneratedSourceFile[] {
  if (!project) {
    throw new Error('需要有效的项目实例才能生成代码。')
  }
  return buildProcessedFiles(project, options)
}

function buildProcessedFiles(project: Project, options: ExportOptions): GeneratedSourceFile[] {
  const pageArtifacts = buildPageArtifacts(project)
  const files = assembleProjectFiles(project, pageArtifacts, options)
  return files.map((file) => ({
    path: getTargetPath(file.path, options.language),
    content: file.shouldProcess ? processCode(file.content, options.language) : file.content,
  }))
}

/**
 * 处理代码（TypeScript 转 JavaScript）
 * @param code 源代码
 * @param lang 目标语言
 * @returns 处理后的代码
 */
export function processCode(code: string, lang: 'ts' | 'js'): string {
  if (lang === 'ts') {
    return code
  }

  if (isVueSfc(code)) {
    return transformVueSfc(code)
  }

  return transformTsSnippet(code)
}

/**
 * 构建页面产物
 * @param project 项目数据
 * @returns 页面产物数组
 */
function buildPageArtifacts(project: Project): PageArtifact[] {
  const pages = Array.isArray(project.pages) ? project.pages : []

  if (pages.length === 0) {
    return [createPlaceholderPageArtifact()]
  }

  const usedNames = new Set<string>()
  return pages.map((page, index) => createPageArtifact(page, index, usedNames))
}

/**
 * 创建页面产物
 * @param page 页面数据
 * @param index 页面索引
 * @param usedNames 已使用的名称集合
 * @returns 页面产物
 */
function createPageArtifact(page: Page, index: number, usedNames: Set<string>): PageArtifact {
  const componentName = ensureUniqueComponentName(page, index, usedNames)
  const fileName = `${componentName}.vue`
  const routePath = normalizeRoutePath(page.route, componentName, index)
  const routeName = componentName
  const components: Component[] = Array.isArray(page.components) ? page.components : []
  // 转换为 toCode.ts 期望的格式
  const toCodeComponents = convertComponents(components)
  const source = generateVueCode(toCodeComponents)

  return { fileName, routePath, routeName, source }
}

/**
 * 创建占位符页面产物
 * @returns 占位符页面产物
 */
function createPlaceholderPageArtifact(): PageArtifact {
  return {
    fileName: 'Home.vue',
    routePath: '/',
    routeName: 'Home',
    source: `<template>
  <section class="placeholder-page">
    <h1>欢迎</h1>
    <p>在编辑器中添加页面即可在此处查看。</p>
  </section>
</template>

<style scoped>
.placeholder-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  text-align: center;
  color: #2c3e50;
}
</style>
`,
  }
}

/**
 * 组装项目文件
 * @param project 项目数据
 * @param pages 页面产物
 * @param options 导出选项
 * @returns 生成的文件数组
 */
function assembleProjectFiles(
  project: Project,
  pages: PageArtifact[],
  options: ExportOptions,
): GeneratedFile[] {
  const files: GeneratedFile[] = [
    {
      path: 'index.html',
      content: createIndexHtml(project.name, options.language),
      shouldProcess: false,
    },
    {
      path: 'package.json',
      content: createPackageJson(project, pages, options),
      shouldProcess: false,
    },
    { path: 'vite.config.ts', content: createViteConfig(), shouldProcess: true },
    { path: 'src/main.ts', content: createMainEntry(), shouldProcess: true },
    { path: 'src/router/index.ts', content: createRouterFile(pages), shouldProcess: true },
    { path: 'src/App.vue', content: createAppVue(), shouldProcess: true },
    { path: 'src/styles/global.css', content: createGlobalStyles(), shouldProcess: false },
  ]

  if (options.language === 'ts') {
    files.push(
      { path: 'tsconfig.json', content: createTsconfig(), shouldProcess: false },
      { path: 'src/env.d.ts', content: createEnvDeclaration(), shouldProcess: true },
    )
  }

  // 添加运行时库文件
  files.push(
    {
      path: 'src/runtime/useEventExecutor.ts',
      content: useEventExecutorSource,
      shouldProcess: true,
    },
    {
      path: 'src/runtime/useDataBindingEngine.ts',
      content: useDataBindingEngineSource,
      shouldProcess: true,
    },
  )

  for (const page of pages) {
    files.push({ path: `src/pages/${page.fileName}`, content: page.source, shouldProcess: true })
  }

  if (options.lint) {
    files.push(
      {
        path: 'eslint.config.js',
        content: createEslintConfig(options.language),
        shouldProcess: false,
      },
      { path: '.prettierrc', content: createPrettierConfig(), shouldProcess: false },
    )
  }

  return files
}

/**
 * 创建 HTML 入口文件
 * @param projectName 项目名称
 * @param language 编程语言
 * @returns HTML 内容
 */
function createIndexHtml(projectName: string | undefined, language: 'ts' | 'js'): string {
  const title = projectName?.trim() || 'Vite 应用'
  const entryExt = language === 'ts' ? 'ts' : 'js'
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.${entryExt}"></script>
  </body>
</html>
`
}

/**
 * 创建 package.json 文件
 * @param project 项目数据
 * @param pages 页面产物
 * @param options 导出选项
 * @returns package.json 内容
 */
function createPackageJson(
  project: Project,
  pages: PageArtifact[],
  options: ExportOptions,
): string {
  const dependencies: Record<string, string> = {
    vue: '^3.5.22',
    'vue-router': '^4.5.1',
    pinia: '^3.0.3',
    axios: '^1.13.2',
    'element-plus': '^2.11.5',
    echarts: '^6.0.0',
    'vue-echarts': '^8.0.1',
    leaflet: '^1.9.4',
    'leaflet.heat': '^0.2.0',
    'leaflet.markercluster': '^1.5.3',
    'lodash-es': '^4.17.21',
    dompurify: '^3.3.0',
    marked: '^17.0.1',
    '@vela/ui': '^1.0.4',
  }

  const devDependencies: Record<string, string> = {
    vite: '^7.1.7',
    '@vitejs/plugin-vue': '^6.0.1',
  }

  if (options.language === 'ts') {
    devDependencies.typescript = '~5.9.0'
    devDependencies['vue-tsc'] = '^3.1.0'
  }

  if (options.lint) {
    devDependencies['@eslint/js'] = '^9.33.0'
    devDependencies.eslint = '^9.33.0'
    devDependencies['eslint-plugin-vue'] = '^10.4.0'
    devDependencies['@vue/eslint-config-prettier'] = '^10.2.0'
    devDependencies.prettier = '3.6.2'
    if (options.language === 'ts') {
      devDependencies['@vue/eslint-config-typescript'] = '^14.6.0'
    }
  }

  const scripts: Record<string, string> = {
    dev: 'vite',
    build: options.language === 'ts' ? 'vue-tsc --noEmit && vite build' : 'vite build',
    preview: 'vite preview',
  }

  if (options.language === 'ts') {
    scripts['type-check'] = 'vue-tsc --noEmit'
  }

  if (options.lint) {
    scripts.lint = 'eslint .'
    scripts.format = 'prettier --write .'
  }

  const packageJson = {
    name: sanitizeProjectName(project.name || 'vela-project'),
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts,
    dependencies,
    devDependencies,
    keywords: pages.map((page) => page.routeName).slice(0, 5),
  }

  return `${JSON.stringify(packageJson, null, 2)}\n`
}

/**
 * 创建 Vite 配置文件
 * @returns vite.config.ts 内容
 */
function createViteConfig(): string {
  return `import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
`
}

/**
 * 创建主入口文件
 * @returns main.ts 内容
 */
function createMainEntry(): string {
  return `import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import './styles/global.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(ElementPlus)
app.mount('#app')
`
}

/**
 * 创建路由配置文件
 * @param pages 页面产物
 * @returns router/index.ts 内容
 */
function createRouterFile(pages: PageArtifact[]): string {
  const defaultPath = pages[0]?.routePath || '/'
  const redirectLine = defaultPath !== '/' ? `  { path: '/', redirect: '${defaultPath}' },\n` : ''
  const routeLines = pages
    .map(
      (page) => `  {
    path: '${page.routePath}',
    name: '${page.routeName}',
    component: () => import('../pages/${page.fileName}'),
  },`,
    )
    .join('\n')

  return `import { createRouter, createWebHistory } from 'vue-router'

const routes = [
${redirectLine}${routeLines}
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
`
}

/**
 * 创建根组件
 * @returns App.vue 内容
 */
function createAppVue(): string {
  return `<template>
  <router-view />
</template>

<style scoped>
:global(body) {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  background-color: #0f111a;
}
</style>
`
}

/**
 * 创建全局样式文件
 * @returns global.css 内容
 */
function createGlobalStyles(): string {
  return `:root {
  font-family: 'Segoe UI', Roboto, Oxygen, sans-serif;
  color: #e5e9f0;
  background-color: #0f111a;
}

* {
  box-sizing: border-box;
}

html,
body,
#app {
  height: 100%;
}
`
}

/**
 * 创建 TypeScript 配置文件
 * @returns tsconfig.json 内容
 */
function createTsconfig(): string {
  return `${JSON.stringify(
    {
      compilerOptions: {
        target: 'ESNext',
        useDefineForClassFields: true,
        module: 'ESNext',
        moduleResolution: 'Bundler',
        strict: true,
        jsx: 'preserve',
        resolveJsonModule: true,
        isolatedModules: true,
        esModuleInterop: true,
        lib: ['ESNext', 'DOM'],
        skipLibCheck: true,
        types: ['vite/client'],
      },
      include: ['src/**/*.ts', 'src/**/*.d.ts', 'src/**/*.tsx', 'src/**/*.vue'],
    },
    null,
    2,
  )}\n`
}

/**
 * 创建环境声明文件
 * @returns env.d.ts 内容
 */
function createEnvDeclaration(): string {
  return `/// <reference types="vite/client" />\n`
}

/**
 * 创建 ESLint 配置文件 (flat config 格式，兼容 ESLint 9.x)
 * @param language 编程语言
 * @returns eslint.config.js 内容
 */
function createEslintConfig(language: 'ts' | 'js'): string {
  if (language === 'ts') {
    return `import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import vueTsEslintConfig from '@vue/eslint-config-typescript'

export default [
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },
  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**'],
  },
  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  ...vueTsEslintConfig(),
  skipFormatting,
]
`
  }

  return `import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default [
  {
    name: 'app/files-to-lint',
    files: ['**/*.{js,mjs,jsx,vue}'],
  },
  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**'],
  },
  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  skipFormatting,
]
`
}

/**
 * 创建 Prettier 配置文件
 * @returns .prettierrc 内容
 */
function createPrettierConfig(): string {
  return `${JSON.stringify(
    {
      semi: false,
      singleQuote: true,
      trailingComma: 'all',
      printWidth: 100,
    },
    null,
    2,
  )}\n`
}

/**
 * 清理项目名称
 * @param name 原始名称
 * @returns 清理后的名称
 */
function sanitizeProjectName(name: string): string {
  const normalized = name
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
  return normalized || 'vela-project'
}

/**
 * 确保组件名称有效
 * @param page 页面数据
 * @param index 页面索引
 * @returns 有效的组件名称
 */
function ensureComponentName(page: Page, index: number): string {
  const rawName = page.name?.trim() || `页面 ${index + 1}`
  const candidate = toPascalCase(rawName)
  const startsWithLetter = /^[A-Za-z]/.test(candidate)
  return startsWithLetter ? candidate : `Page${index + 1}`
}

/**
 * 确保组件名称唯一
 * @param page 页面数据
 * @param index 页面索引
 * @param usedNames 已使用的名称集合
 * @returns 唯一的组件名称
 */
function ensureUniqueComponentName(page: Page, index: number, usedNames: Set<string>): string {
  const baseName = ensureComponentName(page, index) || `Page${index + 1}`
  let candidate = baseName
  let suffix = 1
  while (usedNames.has(candidate)) {
    suffix += 1
    candidate = `${baseName}${suffix}`
  }
  usedNames.add(candidate)
  return candidate
}

/**
 * 标准化路由路径
 * @param route 原始路由
 * @param componentName 组件名称
 * @param index 页面索引
 * @returns 标准化的路由路径
 */
function normalizeRoutePath(
  route: string | undefined,
  componentName: string,
  index: number,
): string {
  if (route?.trim()) {
    const trimmed = route.trim()
    const prefixed = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
    return prefixed.replace(/\s+/g, '-').replace(/-+/g, '-').toLowerCase()
  }

  const slug = toRouteSlug(componentName) || `page-${index + 1}`
  return `/${slug}`
}

/**
 * 转换为 PascalCase
 * @param value 输入字符串
 * @returns PascalCase 字符串
 */
function toPascalCase(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join('')
}

/**
 * 转换为路由 slug
 * @param value 输入字符串
 * @returns 路由 slug
 */
function toRouteSlug(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

/**
 * 获取目标路径
 * @param path 原始路径
 * @param lang 编程语言
 * @returns 目标路径
 */
function getTargetPath(path: string, lang: 'ts' | 'js'): string {
  if (lang === 'js' && path.endsWith('.ts')) {
    return path.replace(/\.ts$/, '.js')
  }

  return path
}

/**
 * 判断是否为 Vue 单文件组件
 * @param code 代码内容
 * @returns 是否为 Vue SFC
 */
function isVueSfc(code: string): boolean {
  return /<template[\s>]/i.test(code) && /<script[\s>]/i.test(code)
}

/**
 * 转换 Vue 单文件组件
 * @param code Vue SFC 代码
 * @returns 转换后的代码
 */
function transformVueSfc(code: string): string {
  const scriptRegex = /<script([^>]*)>([\s\S]*?)<\/script>/gi

  return code.replace(scriptRegex, (full, attrs: string, scriptContent: string) => {
    if (!/lang=['"]ts['"]/i.test(attrs)) {
      return full
    }

    const cleanedAttrs = attrs
      .replace(/lang=['"]ts['"]/i, '')
      .replace(/\s+/g, ' ')
      .trim()

    const normalizedAttrs = cleanedAttrs ? ` ${cleanedAttrs}` : ''
    const transformed = transformTsSnippet(scriptContent)

    return `<script${normalizedAttrs}>
${transformed.trim()}\n</script>`
  })
}

/**
 * 简单的 TypeScript 类型剥离（浏览器兼容）
 * 只移除最常见的类型注解，不处理复杂情况
 * @param code TypeScript 代码
 * @returns 移除类型注解后的代码
 */
function simpleTypeStrip(code: string): string {
  // 移除类型导入 (import type { ... } from ...)
  let result = code.replace(/import\s+type\s+\{[^}]*\}\s+from\s+['"][^'"]+['"];?\n?/g, '')

  // 移除类型注解 (: Type)，但保留对象字面量中的冒号
  // 这是一个简化的处理，可能不完美但对大多数情况有效
  result = result.replace(/:\s*(?:string|number|boolean|any|void|null|undefined|never|unknown|object)\b/g, '')
  result = result.replace(/:\s*(?:Array|Promise|Record|Map|Set|Partial|Required|Readonly|Pick|Omit)<[^>]+>/g, '')

  // 移除泛型参数定义 (<T, U, ...>)
  result = result.replace(/<[A-Z][A-Za-z0-9_]*(?:\s*,\s*[A-Z][A-Za-z0-9_]*)*>/g, '')

  // 移除 as 类型断言
  result = result.replace(/\s+as\s+[A-Za-z][A-Za-z0-9_<>,\s|&\[\]]+(?=[,;)\]])/g, '')

  // 移除接口和类型定义
  result = result.replace(/^(?:export\s+)?interface\s+[A-Za-z][A-Za-z0-9_]*\s*(?:<[^>]+>)?\s*\{[^}]*\}\n?/gm, '')
  result = result.replace(/^(?:export\s+)?type\s+[A-Za-z][A-Za-z0-9_]*\s*(?:<[^>]+>)?\s*=\s*[^;\n]+;?\n?/gm, '')

  return result
}

/**
 * 转换 TypeScript 代码片段为 JavaScript
 * 在 Node.js 环境使用 Babel，在浏览器环境使用简单的类型剥离
 * @param snippet TypeScript 代码片段
 * @returns JavaScript 代码片段
 */
function transformTsSnippet(snippet: string): string {
  const trimmed = snippet.trim()
  if (!trimmed) {
    return snippet
  }

  // 浏览器环境：使用简单的类型剥离
  if (isBrowser()) {
    try {
      return simpleTypeStrip(snippet)
    } catch (error) {
      console.warn('[projectGenerator] 浏览器环境类型剥离失败，返回原代码', error)
      return snippet
    }
  }

  // Node.js 环境：使用 Babel 进行完整的 TypeScript 转换
  try {
    // 动态加载 Babel（仅在 Node.js 环境）
    if (!babelCore) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      babelCore = require('@babel/core')
    }

    const result = babelCore!.transformSync(snippet, {
      presets: [],
      plugins: [
        ['@babel/plugin-transform-typescript', { isTSX: false }],
      ],
      // 保留格式
      retainLines: true,
      // 不生成 sourcemap
      sourceMaps: false,
    })

    if (result && result.code) {
      return result.code
    }

    return snippet
  } catch (error) {
    console.warn('[projectGenerator] TypeScript 转换失败，返回原代码', error)
    return snippet
  }
}
