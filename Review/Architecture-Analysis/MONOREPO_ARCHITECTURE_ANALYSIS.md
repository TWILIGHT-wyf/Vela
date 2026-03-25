# WebGIS 低代码平台 Monorepo 架构解析

## 1. 文档目标

本文基于当前仓库的真实结构，系统说明以下问题：

- 为什么该项目采用 monorepo 架构
- 相比传统单仓 `pages/utils/store` 结构，解决了哪些问题
- 该决策是基于项目哪些特点作出的
- 当前架构的实际拓扑是什么样
- 架构优势、代价、风险与后续演进建议

---

## 2. 当前仓库架构快照（事实层）

### 2.1 Workspace 范围

`pnpm-workspace.yaml`：

```yaml
packages:
  - 'packages/*'
  - 'server'
```

说明当前是前端多包 + 后端服务同仓协作模式。

### 2.2 根级编排能力

根 `package.json` 体现了 monorepo 的统一编排能力：

- `dev` 同时启动 `@vela/server` 与 `@vela/editor`
- `build` 使用 `pnpm -r --if-present build` 递归构建所有包
- lint / test / type-check 在根统一执行

这意味着：开发、构建与质量校验是统一入口，包内能力是分治实现。

### 2.3 包职责与依赖方向

当前核心包（`packages/*` + `server`）如下：

- `@vela/core`
  - 职责：共享类型、contracts、runtime helpers、validation
  - 角色：契约底座（单一事实源）

- `@vela/ui`
  - 职责：Vue UI 组件库
  - 特征：具备发布配置，支持独立消费

- `@vela/ui-react`
  - 职责：React 侧 UI 组件实现
  - 特征：与 Vue 主链路相对独立

- `@vela/materials`
  - 职责：低代码物料与注册能力
  - 依赖：`core + ui`

- `@vela/renderer`
  - 职责：运行时渲染执行
  - 依赖：`core + materials + ui`

- `@vela/generator`
  - 职责：代码导出/生成（Babel 工具链）
  - 依赖：`core`

- `@vela/editor`
  - 职责：编辑器应用壳层（交互编排）
  - 依赖：`core + generator + materials + renderer + ui`

- `@vela/server`
  - 职责：后端 API、存储、AI 代理等服务能力

可简化为依赖方向：

- `core -> ui -> materials -> renderer`
- `core -> generator`
- `editor -> core/generator/materials/renderer/ui`

这是一条“契约驱动 + 多执行端消费”的产品化依赖链路。

---

## 3. 为什么采用 monorepo（决策动机）

### 3.1 关键判断：这是平台，不是单应用

该项目不仅有一个前端页面，而是一个低代码平台：

- 编辑端（authoring）
- 运行端（runtime）
- 导出端（codegen/export）
- 物料体系（materials）

这些子系统围绕同一份低代码模型协作，具备“强协作 + 强边界”的特征。

### 3.2 monorepo 在此场景下的核心价值

> 模块化边界并非 monorepo 独有；
> monorepo 的关键价值是让跨包协同变更可原子落地，并统一验证。

也就是说：不仅是“能拆”，而是“拆了之后能稳定协同演进”。

---

## 4. 相比传统结构，具体解决了什么问题

> 前提澄清：传统结构也可以通过严格规范解决这些问题。
> 差异在于，monorepo 将规范升级为工程边界，降低后期退化概率。

### 4.1 Schema / Contract 漂移

- 传统结构风险：编辑器、渲染器、生成器各自维护解释，长期易偏差
- 当前架构方案：`core` 统一 contracts/types/validation，三端共享

### 4.2 编辑态逻辑污染运行态

- 传统结构风险：editor store/交互工具易泄漏到 runtime
- 当前架构方案：`renderer` 独立包，运行时语义独立维护

### 4.3 导出链路对 UI 重构敏感

- 传统结构风险：导出实现依赖 editor 内部细节，重构易破
- 当前架构方案：`generator` 依赖 `core`，不依赖 editor 内部

### 4.4 变更影响面不透明

- 传统结构风险：改单点工具函数可能影响全局，回归难界定
- 当前架构方案：按包构建与测试，影响面更可控、定位更快

### 4.5 物料体系难成为一等公民

- 传统结构风险：物料定义散在业务目录，复用与治理困难
- 当前架构方案：`materials` 独立，形成平台扩展边界

---

## 5. 为什么是“基于当前项目特点”而不是套模板

该决策与项目事实高度一致：

1. 已有独立导出能力（`generator`）
2. 已有运行时引擎（`renderer`）
3. 已有物料注册层（`materials`）
4. 已有契约中心（`core`）
5. 已有组件库发布诉求（`ui`）

因此该架构并非“为了分而分”，而是“围绕产品能力边界而分”。

---

## 6. 架构优势总结

### 6.1 技术优势

- 统一契约：降低跨端语义不一致
- 清晰依赖方向：减少反向耦合
- 包级构建测试：提升回归效率

### 6.2 产品与交付优势

- 编辑/运行/导出能力可并行演进
- 物料体系可扩展性更好
- 组件库可依赖化交付，导出项目更轻量

### 6.3 组织协作优势

- 同仓原子提交跨包改动
- 统一脚本与工具链降低协作摩擦

---

## 7. 代价与风险（必须承认的 trade-off）

### 7.1 代价

- 工程治理复杂度提高（workspace、构建、发布）
- 新成员上手成本高于单应用目录结构

### 7.2 风险

- `core` 过度膨胀，变成“万能包”
- 边界被侵蚀（下层包反向依赖 editor）
- `ui` 与 `ui-react` 责任不清时可能重复建设

---

## 8. 后续演进建议

1. 明确并文档化依赖方向规则（禁止逆向依赖）
2. 增强 contract tests：`core <-> materials <-> renderer <-> generator`
3. 导出策略采用双模式：
   - 默认：依赖 `@vela/ui`（轻量、易升级）
   - 可选：eject 仅导出实际使用组件源码（高级定制）
4. 明确 `ui` 与 `ui-react` 的长期边界与定位

---

## 9. 项目可复述版（1 分钟）

我们采用 monorepo 不是因为传统 `pages/utils/store` 做不到，而是因为这是低代码平台：同一份模型要同时服务编辑、运行和导出。我们把能力拆成 `core/materials/renderer/generator/editor`，其中 `core` 是契约中心，`materials` 是扩展面，`renderer` 负责运行时，`generator` 负责导出，`editor` 做交互编排。这样做的价值是把原本靠规范约束的边界，变成工程可验证的边界，减少 schema 漂移、编辑态污染运行态、导出链路脆弱等问题。我们也承认 monorepo 有治理成本，但在平台化特征明确时，这种结构的长期收益更高。

---

## 10. 结论

当前项目的 monorepo 架构总体合理，且与低代码平台的产品形态匹配。它的本质价值不在“目录形式”，而在“围绕共享契约进行多执行端协同演进”的工程治理能力。
