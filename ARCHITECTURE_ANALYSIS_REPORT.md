# Vela LowCode Editor - 项目架构深度分析报告

> 生成时间: 2026-01-31  
> 项目路径: C:\Users\TWILIGHT\Desktop\Typescript\webgis  
> 分析范围: 完整 Monorepo 架构

---

## 📊 项目概览

### 基本信息

| 属性         | 值                                           |
| ------------ | -------------------------------------------- |
| **项目名称** | Vela LowCode Editor (低代码数据可视化平台)   |
| **技术栈**   | Vue 3.5+ / TypeScript 5.x / Vite 6.x / Pinia |
| **UI 库**    | Element Plus / ECharts / Leaflet             |
| **后端**     | Express + MongoDB                            |
| **包管理**   | pnpm workspaces                              |
| **测试**     | Vitest + Playwright                          |
| **架构模式** | Monorepo (6个核心包 + 1个server)             |

### 在线地址

- **预览地址**: https://vela-lowcode-editor.vercel.app/
- **后端地址**: https://vela-lowcode-editor.onrender.com
- **组件库文档**: https://visual-lib-docs.vercel.app/
- **GitHub**: https://github.com/TWILIGHT-wyf/vela-lowcode-editor

---

## 🏗️ 包架构分析

### 包依赖关系图

```
┌─────────────────────────────────────────────────────────────┐
│                    @vela/editor                              │
│                    (编辑器主应用)                             │
└──────────────┬──────────────────────────────────────────────┘
               │
    ┌──────────┼──────────┬──────────┬──────────┐
    ▼          ▼          ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐
│@vela/ui│ │@vela/  │ │@vela/    │ │@vela/  │ │@vela/    │
│(UI组件)│ │materials│ │renderer  │ │core    │ │generator │
│        │ │(物料包) │ │(渲染引擎)│ │(核心类型)│ │(代码生成)│
└────────┘ └────┬───┘ └────┬─────┘ └────────┘ └──────────┘
                │          │
                ▼          ▼
           ┌────────┐ ┌────────┐
           │@vela/ui│ │@vela/ui│
           │@vela/core│ │@vela/core│
           └────────┘ └────────┘
```

### 各包详细分析

#### 1. @vela/core - 核心类型层 (独立度: ★★★★★)

| 属性         | 值                                     |
| ------------ | -------------------------------------- |
| **职责**     | 提供项目的基础类型定义、常量和工具函数 |
| **版本**     | 1.0.0                                  |
| **入口**     | `src/index.ts`                         |
| **依赖**     | 仅 zod (4.3.5)                         |
| **外部依赖** | ❌ 无其他@vela包依赖                   |

**导出内容**:

- `types/` - 20+ 类型定义文件 (schema, action, project, material等)
- `utils/` - 工具函数
- `constants/` - 常量定义
- `model/` - 模型定义
- `plugins/` - 插件接口

**核心类型**:

- `NodeSchema` - 组件节点核心协议
- `NodeStyle` - 统一样式定义
- `DataBinding` - 数据联动配置
- `ActionSchema` - 事件动作定义
- `MaterialMeta` - 物料元数据

**✅ 适合发布 npm**: 是，独立的类型层，依赖极少

---

#### 2. @vela/ui - UI组件库 (独立度: ★★★☆☆)

| 属性         | 值                                                        |
| ------------ | --------------------------------------------------------- |
| **职责**     | 纯UI组件库，包装 ECharts/Element Plus，提供扁平化属性接口 |
| **版本**     | 1.0.0                                                     |
| **入口**     | `index.ts`                                                |
| **组件数量** | 50+ 组件                                                  |

**依赖分析**:

```
dependencies:
  - @vela/core (workspace:*)
  - vue, element-plus, echarts, vue-echarts
  - dompurify, highlight.js, marked

peerDependencies:
  - vue: ^3.0.0
  - element-plus: ^2.0.0
```

**组件分类**:

1. **图表组件** (10个): lineChart, barChart, pieChart, radarChart等
2. **KPI组件** (5个): vText, vStat, vProgress, vCountUp等
3. **布局组件** (8个): vRow, vCol, vFlex, vGrid, vPanel, vTabs等
4. **数据组件** (5个): vTable, vList, vTimeline, vCardGrid, vPivot
5. **表单控件** (10个): vSelect, vDateRange, vSlider, vSwitch等
6. **内容媒体** (5个): vImage, vVideo, vHtml, vIframe, vMarkdown
7. **高级组件** (3个): vScripting, vState, vTrigger

**✅ 适合发布 npm**: 是，但需先发布 @vela/core

---

#### 3. @vela/materials - 物料层 (独立度: ★★☆☆☆)

| 属性     | 值                                                          |
| -------- | ----------------------------------------------------------- |
| **职责** | 智能组件，连接 UI 和 Editor 数据，实现 store 绑定和数据获取 |
| **版本** | 1.0.0                                                       |
| **入口** | `src/index.ts`                                              |

**依赖分析**:

```
dependencies:
  - @vela/core (workspace:*)
  - @vela/ui (workspace:*)
  - vue, pinia, nanoid, @vueuse/core
  - echarts
```

**架构模式**:

- **Smart vs Dumb**: materials 是 Smart，ui 是 Dumb
- materials 负责:
  - 数据获取 (useDataSource)
  - store 同步 (storeToRefs)
  - 事件分发
  - 数据转换

**组件实现**:

```typescript
// PieChart.vue 示例
import { pieChart } from '@vela/ui'
// Smart wrapper: 添加数据获取、store绑定
```

**✅ 适合发布 npm**: 是，但需先发布 core 和 ui

---

#### 4. @vela/renderer - 渲染引擎 (独立度: ★★☆☆☆)

| 属性     | 值                                                 |
| -------- | -------------------------------------------------- |
| **职责** | 运行时渲染引擎，递归渲染组件树，数据联动，事件执行 |
| **版本** | 1.0.0                                              |
| **入口** | `src/index.ts`                                     |

**核心导出**:

- `RuntimeRenderer.vue` - 运行时渲染器
- `RuntimeComponent.vue` - 组件包装器
- `useDataBindingEngine.ts` - 数据联动引擎
- `useEventExecutor.ts` - 事件执行器
- `useComponentDataSource.ts` - 数据源 Hook

**依赖分析**:

```
dependencies:
  - @vela/core (workspace:*)
  - @vela/materials (workspace:*)
  - @vela/ui (workspace:*)
  - vue, vue-router
```

**运行时引擎特性**:

**数据联动引擎**:

- O(1) 组件查找 (Map索引)
- 循环绑定保护 (updateLocks)
- 精确路径监听 (lodash get)
- 支持转换器 (expression/template)

**事件执行器**:

- 10+ 动作类型 (toggle-visibility, navigate, highlight等)
- Proxy沙箱执行自定义脚本
- 高亮动画效果

**✅ 适合发布 npm**: 是，但需先发布 core/ui/materials

---

#### 5. @vela/generator - 代码生成器 (独立度: ★★★★☆)

| 属性         | 值                                  |
| ------------ | ----------------------------------- |
| **职责**     | 将 NodeSchema 树生成 Vue/React 代码 |
| **版本**     | 1.0.0                               |
| **入口**     | `src/index.ts`                      |
| **特殊依赖** | Babel AST 操作库                    |

**核心功能**:

```typescript
export {
  generateCode, // 生成单页面代码
  generateProjectFiles, // 生成完整项目
  generateVue3Code, // Vue3 代码生成
  generateReactCode, // React 代码生成
  generateReactProject, // React 项目生成
}
```

**依赖分析**:

```
dependencies:
  - @vela/core (workspace:*)
  - @babel/* (AST操作)
  - prettier (代码格式化)
```

**✅ 适合发布 npm**: 是，仅需 core 即可工作

---

#### 6. @vela/editor - 编辑器主应用 (独立度: ★☆☆☆☆)

| 属性     | 值                                                     |
| -------- | ------------------------------------------------------ |
| **职责** | 完整的低代码编辑器应用，包含画布、属性面板、拖拽系统等 |
| **版本** | 1.0.0                                                  |
| **类型** | 应用包 (非库)                                          |

**依赖分析**:

```
dependencies:
  - @vela/core, @vela/ui, @vela/materials
  - @vela/renderer, @vela/generator
  - vue, pinia, vue-router, element-plus
  - echarts, vue-echarts, lodash-es, axios
  - jszip, file-saver (导出功能)
```

**核心模块**:

- `stores/` - 9个 Pinia store
  - `component.ts` - 组件树管理 (968行，核心)
  - `project.ts` - 项目状态
  - `history.ts` - 撤销/重做
  - `canvas.ts` - 画布状态
- `components/Canvas/` - 画布核心
- `components/SetterPanel/` - 属性面板
- `components/MaterialPanel/` - 组件库面板

**❌ 不适合发布 npm**: 这是应用入口，不应作为库发布

---

## 🔄 数据流架构分析

### 核心数据流图

```
┌──────────────────────────────────────────────────────────────────┐
│                        数据流总览                                 │
└──────────────────────────────────────────────────────────────────┘

【用户操作层】
    │
    ▼
┌──────────────┐    拖拽/点击    ┌──────────────┐
│ MaterialPanel│ ───────────────▶│     Canvas   │
│  (组件库)    │                 │    (画布)    │
└──────────────┘                 └──────┬───────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
            ┌─────────────┐    ┌─────────────┐     ┌─────────────┐
            │ Pinia Store │    │  SetterPanel│     │   Renderer  │
            │ (状态管理)  │◀───│  (属性面板) │     │  (运行时)   │
            └──────┬──────┘    └─────────────┘     └─────────────┘
                   │
    ┌──────────────┼──────────────┬──────────────┐
    ▼              ▼              ▼              ▼
┌────────┐  ┌──────────┐  ┌────────────┐  ┌──────────┐
│Project │  │Component │  │  History   │  │  Canvas  │
│ Store  │  │  Store   │  │   Store    │  │  Store   │
└───┬────┘  └────┬─────┘  └─────┬──────┘  └────┬─────┘
    │            │              │              │
    └────────────┴──────────────┴──────────────┘
                   │
                   ▼
          ┌────────────────┐
          │  数据同步层     │
          │ (syncToProject)│
          └───────┬────────┘
                  │
    ┌─────────────┼─────────────┐
    ▼             ▼             ▼
┌────────┐  ┌──────────┐  ┌──────────┐
│MongoDB │  │  JSON    │  │  Code    │
│(持久化)│  │ Export   │  │ Generator│
└────────┘  └──────────┘  └──────────┘
```

### ComponentStore 核心机制

**O(1) 索引系统**:

```typescript
// 节点索引: id -> NodeSchema
const nodeIndex = new Map<string, NodeSchema>()

// 父节点索引: childId -> parentId
const parentIndex = new Map<string, string>()

// 样式版本号: 触发精确响应式更新
const styleVersion = ref<Record<string, number>>({})
```

**命令模式**:

- `AddComponentCommand` - 添加组件
- `DeleteComponentCommand` - 删除组件
- `MoveComponentCommand` - 移动组件
- `UpdatePropsCommand` - 更新属性
- `UpdateStyleCommand` - 更新样式

### NodeSchema 数据结构

```typescript
interface NodeSchema<P = Record<string, PropValue>> {
  id: string
  componentName: string // 对应 MaterialMeta
  title?: I18nString
  props?: P
  style?: NodeStyle // 支持4种布局模式
  layoutMode?: 'free' | 'flex' | 'grid' | 'flow'
  dataSource?: DataSourceConfig
  children?: NodeSchema[] // 递归结构
  condition?: boolean | JSExpression // v-if
  loop?: { data; itemArg; indexArg } // v-for
  events?: Record<string, ActionSchema[]>
  dataBindings?: DataBinding[]
  animation?: AnimationConfig
}
```

---

## 🔧 运行时引擎分析

### 数据联动引擎

**核心特性**:

1. **Map索引** - O(1) 组件查找
2. **循环保护** - updateLocks 防止无限递归
3. **转换器支持**:
   - `expression`: `new Function('value', code)`
   - `template`: `'${value}'` 插值

**绑定流程**:

```
源组件值变化
    │
    ▼ (watch)
┌─────────────────┐
│  doUpdate()     │
│  - 获取源值     │
│  - 执行转换器   │
│  - 写入目标路径 │
└─────────────────┘
    │
    ▼
目标组件更新
```

### 事件执行器

**支持的动作类型** (10+种):

- `toggle-visibility` - 切换可见性
- `scroll-to` - 滚动到组件
- `show-tooltip` - 显示消息
- `navigate` / `navigate-page` - 页面跳转
- `fullscreen` - 全屏切换
- `custom-script` - 自定义脚本
- `play-animation` - 播放动画
- `highlight` - 高亮组件
- `refresh-data` - 刷新数据

**沙箱安全**:

```typescript
const SAFE_GLOBALS = [
  'console', 'Math', 'Date', 'JSON',
  'Array', 'Object', 'Promise', ...
]

// Proxy拦截所有变量访问
const proxy = new Proxy(context, {
  has() { /* 限制作用域 */ },
  get() { /* 白名单检查 */ },
})
```

---

## 📦 发布到 npm 的建议

### 发布优先级

| 优先级 | 包名            | 原因                         | 预估工作量 |
| ------ | --------------- | ---------------------------- | ---------- |
| ★★★★★  | @vela/core      | 基础类型，无依赖，必须先发布 | 低         |
| ★★★★★  | @vela/ui        | 独立UI库，依赖core           | 中         |
| ★★★★☆  | @vela/generator | 独立代码生成，依赖core       | 低         |
| ★★★☆☆  | @vela/materials | 依赖core+ui                  | 中         |
| ★★★☆☆  | @vela/renderer  | 依赖core+ui+materials        | 高         |
| ★☆☆☆☆  | @vela/editor    | 应用包，不发布               | -          |

### 发布前需要完善的内容

#### 1. @vela/core - 需要完善

**当前状态**: ✅ 基础完善

**待优化**:

- [ ] 添加完整的 README.md
- [ ] 添加 CHANGELOG.md
- [ ] 完善 package.json:
  ```json
  {
    "name": "@vela/core",
    "version": "1.0.0",
    "description": "Core types and utilities for Vela LowCode Platform",
    "keywords": ["lowcode", "types", "schema"],
    "author": "TWILIGHT",
    "license": "MIT",
    "repository": {
      "type": "git",
      "url": "https://github.com/TWILIGHT-wyf/vela-lowcode-editor.git",
      "directory": "packages/core"
    },
    "publishConfig": {
      "access": "public"
    },
    "files": ["src", "dist"],
    "main": "./dist/index.js",
    "module": "./dist/index.mjs",
    "types": "./dist/index.d.ts"
  }
  ```
- [ ] 添加构建脚本 (tsc 或 vite build)
- [ ] 确保所有类型都有 JSDoc 注释

#### 2. @vela/ui - 需要完善

**当前状态**: ⚠️ 部分完善

**待优化**:

- [ ] 确保构建输出 ESM + CJS 双格式
- [ ] 添加 CSS 样式文件单独导出
- [ ] 完善 peerDependencies 声明
- [ ] 添加组件文档
- [ ] 优化构建配置:
  ```typescript
  // vite.config.ts
  export default defineConfig({
    build: {
      lib: {
        entry: './index.ts',
        name: 'VelaUI',
        formats: ['es', 'cjs', 'umd'],
        fileName: (format) => `index.${format}.js`,
      },
      rollupOptions: {
        external: ['vue', 'element-plus', 'echarts'],
        output: {
          globals: {
            vue: 'Vue',
            'element-plus': 'ElementPlus',
            echarts: 'echarts',
          },
        },
      },
    },
  })
  ```

#### 3. @vela/generator - 需要完善

**当前状态**: ⚠️ 依赖 Babel，需要优化

**待优化**:

- [ ] 减小打包体积 (Babel 依赖较大)
- [ ] 提供轻量级版本 (不包含 AST 转换)
- [ ] 添加构建配置
- [ ] 完善 API 文档

#### 4. @vela/materials - 需要完善

**当前状态**: ❌ 需要较多工作

**待优化**:

- [ ] 解耦 pinia 依赖 (提供运行时独立版本)
- [ ] 分离 Smart 和 Dumb 组件
- [ ] 完善元数据导出
- [ ] 确保所有组件都有 meta.ts

#### 5. @vela/renderer - 需要完善

**当前状态**: ❌ 需要较多工作

**待优化**:

- [ ] 提供更灵活的配置选项
- [ ] 优化 bundle 体积
- [ ] 分离事件执行器和数据联动引擎作为独立包
- [ ] 完善运行时文档

---

## 🎯 待优化点清单

### 架构层面

| 优先级 | 问题                                      | 建议方案                                      | 影响范围     |
| ------ | ----------------------------------------- | --------------------------------------------- | ------------ |
| 高     | @vela/ui 使用 `import.meta.glob` 动态导入 | 改为静态导入，支持更好的 tree-shaking         | 构建产物体积 |
| 高     | 缺少统一的构建配置                        | 创建 shared vite config，统一所有包的构建流程 | 开发效率     |
| 高     | 类型定义分散                              | 将 @vela/core 的类型进一步完善和文档化        | 开发者体验   |
| 中     | @vela/materials 强依赖 pinia              | 提供无 pinia 的纯运行时版本                   | 使用灵活性   |
| 中     | 运行时引擎体积较大                        | 分离数据联动和事件执行作为独立包              | 按需加载     |
| 低     | server 未纳入 npm 发布                    | 发布 @vela/server 或 @vela/backend            | 完整生态     |

### 代码层面

| 优先级 | 文件                                                | 问题                       | 建议                         |
| ------ | --------------------------------------------------- | -------------------------- | ---------------------------- |
| 高     | `packages/ui/index.ts`                              | 使用动态 glob 导入         | 改为静态导入，避免运行时开销 |
| 中     | `packages/core/src/types/schema.ts`                 | NodeStyle 包含大量可选属性 | 拆分为基础样式和扩展样式     |
| 中     | `packages/renderer/src/runtime/useEventExecutor.ts` | 硬编码中文日志             | 使用国际化                   |
| 低     | 多个包                                              | 版本号管理                 | 使用 changesets 统一管理版本 |

### 文档层面

| 优先级 | 内容               | 状态                        |
| ------ | ------------------ | --------------------------- |
| 高     | 每个包的 README.md | ❌ 缺失                     |
| 高     | API 文档           | ⚠️ 部分存在                 |
| 中     | 架构设计文档       | ⚠️ AGENTS.md 存在但不够完整 |
| 中     | 迁移指南           | ❌ 缺失                     |
| 低     | 贡献指南           | ⚠️ 根目录有，但包级别缺失   |

---

## 🚀 发布执行计划

### Phase 1: 基础设施 (1-2天)

1. **创建发布配置模板**

   ```bash
   # 在每个包添加
   packages/*/vite.build.config.ts  # 构建配置
   packages/*/README.md             # 包说明
   packages/*/CHANGELOG.md          # 变更日志
   ```

2. **统一构建流程**
   - 创建 `scripts/build-packages.ts`
   - 统一输出格式: ESM + CJS + UMD
   - 统一类型生成: `vite-plugin-dts`

3. **版本管理**
   ```bash
   pnpm add -D @changesets/cli
   pnpm changeset init
   ```

### Phase 2: 发布 @vela/core (0.5天)

```bash
# 1. 完善 package.json
cd packages/core

# 2. 构建
pnpm build

# 3. 测试类型导出
pnpm test

# 4. 发布
pnpm publish --access public
```

### Phase 3: 发布 @vela/ui (1天)

```bash
cd packages/ui

# 1. 优化为静态导入
# 2. 完善构建配置
# 3. 构建
pnpm build

# 4. 验证
pnpm test

# 5. 发布
pnpm publish --access public
```

### Phase 4: 发布 @vela/generator (0.5天)

```bash
cd packages/generator

# 1. 优化构建配置
# 2. 构建
pnpm build

# 3. 发布
pnpm publish --access public
```

### Phase 5: 发布 materials 和 renderer (1-2天)

等待前面包稳定后，再发布这两个重依赖包。

---

## 📈 性能分析

### Bundle 体积估算

| 包              | 预估体积 (gzip) | 主要依赖                   |
| --------------- | --------------- | -------------------------- |
| @vela/core      | ~5KB            | zod                        |
| @vela/ui        | ~150KB          | vue, echarts, element-plus |
| @vela/generator | ~200KB          | @babel/\*                  |
| @vela/materials | ~50KB           | @vela/ui, pinia            |
| @vela/renderer  | ~30KB           | @vela/ui, @vela/materials  |

### 运行时性能

| 指标         | 当前状态        | 优化建议            |
| ------------ | --------------- | ------------------- |
| 组件查找     | O(1) Map索引    | ✅ 已优化           |
| 数据联动更新 | 精确路径监听    | ✅ 已优化           |
| 循环绑定保护 | updateLocks Set | ✅ 已优化           |
| 渲染性能     | 虚拟列表待添加  | ⚠️ 长列表需要优化   |
| 构建产物     | 动态导入较多    | ⚠️ 可优化为静态导入 |

---

## 📝 总结

### 优势 ✅

1. **架构清晰** - Monorepo 结构合理，包职责分明
2. **类型完善** - TypeScript 类型定义详细
3. **性能优化** - O(1) 索引，精确更新
4. **功能丰富** - 50+ 组件，完整的事件和数据联动系统
5. **测试覆盖** - Vitest + Playwright 完整测试体系

### 待改进 ⚠️

1. **文档缺失** - 各包缺少 README 和 API 文档
2. **构建配置** - 需要统一的构建流程
3. **npm 发布** - package.json 需要完善发布配置
4. **版本管理** - 需要引入 changesets 管理版本
5. **国际化** - 部分硬编码中文需要提取

### 发布建议

**建议立即发布的包**:

- ✅ @vela/core - 基础类型，依赖少
- ✅ @vela/ui - 独立UI库 (需先优化静态导入)
- ✅ @vela/generator - 独立代码生成

**建议延后发布的包**:

- ⚠️ @vela/materials - 需要解耦 pinia
- ⚠️ @vela/renderer - 需要分离引擎模块

---

## 📚 附录

### 关键文件索引

| 文件                                                    | 说明                |
| ------------------------------------------------------- | ------------------- |
| `packages/core/src/types/schema.ts`                     | NodeSchema 核心定义 |
| `packages/editor/src/stores/component.ts`               | 组件 Store 实现     |
| `packages/renderer/src/runtime/useDataBindingEngine.ts` | 数据联动引擎        |
| `packages/renderer/src/runtime/useEventExecutor.ts`     | 事件执行器          |
| `packages/ui/index.ts`                                  | UI 组件导出         |
| `packages/materials/src/registry.ts`                    | 物料注册表          |
| `packages/generator/src/index.ts`                       | 代码生成器 API      |

### 依赖关系矩阵

| 包        | core | ui  | materials | renderer | generator |
| --------- | ---- | --- | --------- | -------- | --------- |
| core      | -    | ✓   | ✓         | ✓        | ✓         |
| ui        | -    | -   | ✓         | ✓        | -         |
| materials | -    | -   | -         | ✓        | -         |
| renderer  | -    | -   | -         | -        | -         |
| generator | -    | -   | -         | -        | -         |

(✓ 表示被依赖)

---

**报告生成完毕** 🎉

如需开始发布流程，请告知我执行具体包的发布任务。
