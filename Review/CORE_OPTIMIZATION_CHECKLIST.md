# Core 后续优化清单（Checklist）

> 适用范围：`packages/core`
>  
> 更新时间：2026-02-07
>  
> 目标：在不阻塞后续模块开发的前提下，系统化完成 `core` 的语义澄清、稳定性强化与性能优化。

## 1. 当前阶段结论

- [x] `core` 类型检查通过（`pnpm exec tsc -p packages/core/tsconfig.json --noEmit`）
- [x] `core` 单测通过（`pnpm exec vitest run packages/core/tests`，54 tests）
- [ ] 覆盖率基线可产出（当前缺少 `@vitest/coverage-v8`）

---

## 2. P0（高优先级，建议先做）

### 2.1 沙箱执行安全强化

- [ ] 明确表达式执行信任边界（仅内部配置 / 外部可输入）
- [ ] 评估并替换当前 `new Function + blacklist` 方案（至少增加隔离层）
- [ ] 补齐超时/资源限制的真实实现（当前仅注释声明，无硬限制）
- [ ] 增加绕过用例测试（Unicode 转义、constructor 链、原型链）

验收标准：
- [ ] 不可信输入无法访问宿主敏感对象
- [ ] 沙箱执行失败能稳定降级，不影响编辑器主流程

关联文件：
- `packages/core/src/utils/sandbox.ts`
- `packages/core/tests/sandbox.spec.ts`

### 2.2 `project/page` 语义统一（你当前关注重点）

- [ ] 明确 `themeId` 与主题实体关系，避免“string 语义不清”
- [ ] 明确 `ProjectConfig.target` 与 `ProjectConfig.layout` 的职责边界（`mobile/pc/responsive`）
- [ ] 明确 `PageConfig` 中 `width/height` 的适用场景（如 dialog/preview）与默认策略
- [ ] 明确 `RoutePage.layoutId` 的约束和解析流程，补充注释与文档
- [ ] 对 `LayoutSchema` 增加“存在意义 + 使用时机”说明（路由页布局、片段页不适用等）

验收标准：
- [ ] `project.ts`/`page.ts` 字段注释可独立解释语义
- [ ] 不再出现“字段存在但意图不清晰”的核心模型歧义

关联文件：
- `packages/core/src/types/project.ts:176`
- `packages/core/src/types/project.ts:178`
- `packages/core/src/types/project.ts:180`
- `packages/core/src/types/project.ts:188`
- `packages/core/src/types/project.ts:190`
- `packages/core/src/types/page.ts:328`
- `packages/core/src/types/page.ts:330`
- `packages/core/src/types/page.ts:412`
- `packages/core/src/types/page.ts:456`
- `packages/core/src/types/page.ts:458`
- `packages/core/src/types/page.ts:537`
- `packages/core/src/types/page.ts:559`

---

## 3. P1（中优先级，建议本迭代完成）

### 3.1 类型安全收口（移除 `any` 泄漏）

- [ ] 替换 `diff.ts` 中 `any` 为 `unknown` + 类型收窄
- [ ] 替换 `selection.ts` 中 `opHandler: (op: any)` 为 `Operation`
- [ ] 增加对应类型测试，避免回退到 `any`

验收标准：
- [ ] `packages/core/src` 不再出现业务核心路径 `any`

关联文件：
- `packages/core/src/utils/diff.ts:7`
- `packages/core/src/utils/diff.ts:49`
- `packages/core/src/utils/diff.ts:50`
- `packages/core/src/plugins/selection.ts:13`

### 3.2 属性级校验能力补齐（Validator 与 PropSchema 联动）

- [ ] 在 `Validator` 中接入 `validation/propSchemas.ts` 的注册表校验
- [ ] 对 `insert/update` 同步做 prop 类型校验（可配置 strict 模式）
- [ ] 为 Material V2 的嵌套属性增加校验路径支持

验收标准：
- [ ] 非法属性值可被拦截（例如 width 传 string 给 NumberSetter）
- [ ] 现有“当前限制”测试转为“应抛错”测试

关联文件：
- `packages/core/src/model/validator.ts`
- `packages/core/src/validation/propSchemas.ts`
- `packages/core/tests/material-v2.spec.ts:43`
- `packages/core/tests/material-v2.spec.ts:51`
- `packages/core/tests/material-v2.spec.ts:61`

### 3.3 索引更新性能优化（减少全量重建）

- [ ] 为 `insert/delete/move` 实现增量索引更新策略
- [ ] 将全量 `rebuild` 降为兜底路径，不作为默认路径
- [ ] 保留 benchmark，增加“深树 + 高频操作”场景

验收标准：
- [ ] 大树编辑场景下延迟下降
- [ ] `integration/tree-index` 一致性测试持续通过

关联文件：
- `packages/core/src/model/processor.ts:73`
- `packages/core/src/model/processor.ts:105`
- `packages/core/src/model/processor.ts:152`
- `packages/core/tests/benchmark.spec.ts:46`

---

## 4. P2（中长期优化）

### 4.1 校验层覆盖率扩展

- [ ] 为 `validation/zod.ts` 增加单测覆盖（当前核心测试未直接覆盖）
- [ ] 为 `contracts/api.ts` 增加契约回归测试
- [ ] 为 `compat/legacy.ts` 增加迁移兼容测试

关联文件：
- `packages/core/src/validation/zod.ts`
- `packages/core/src/contracts/api.ts`
- `packages/core/src/compat/legacy.ts`

### 4.2 日志治理

- [ ] 将 `console.log`/`console.warn` 统一到可控日志层（按环境开关）
- [ ] 保留错误路径日志，收敛常态噪音

关联文件：
- `packages/core/src/model/tree.ts:167`
- `packages/core/src/model/history.ts:79`

### 4.3 兼容字段退场计划

- [ ] 维护 deprecated 字段清单与退场版本（如 `theme`, `layoutMode`, `componentName` 等）
- [ ] 提供 migration helper + 文档，避免下游一次性断裂

关联文件：
- `packages/core/src/types/project.ts`
- `packages/core/src/types/schema.ts`
- `packages/core/src/types/action.ts`
- `packages/core/src/compat/legacy.ts`

---

## 5. 测试与质量门禁（建议）

- [ ] 安装覆盖率依赖并固定版本：`@vitest/coverage-v8`
- [ ] 建立 `core` 单独质量门禁（type-check + tests + coverage）
- [ ] 覆盖率目标（建议）：
  - [ ] statements >= 70%
  - [ ] branches >= 60%
  - [ ] functions >= 70%
  - [ ] lines >= 70%

---

## 6. 推荐执行顺序（可直接排期）

1. P0-2.2（`project/page` 语义统一）
2. P1-3.1（类型安全收口）
3. P1-3.2（属性级校验）
4. P1-3.3（增量索引性能）
5. P0-2.1（沙箱安全强化，视业务信任边界可前置）
6. P2（覆盖率、日志治理、兼容退场）

---

## 7. 任务跟踪模板（复制使用）

| Task | Priority | Owner | ETA | Status | Notes |
|---|---|---|---|---|---|
| 语义统一：theme/layout/layoutId | P0 |  |  | TODO |  |
| 移除 core `any` | P1 |  |  | TODO |  |
| Validator 接入 PropSchema | P1 |  |  | TODO |  |
| processor 增量索引 | P1 |  |  | TODO |  |
| 沙箱隔离升级 | P0 |  |  | TODO |  |
| 覆盖率基线接入 | P2 |  |  | TODO |  |

