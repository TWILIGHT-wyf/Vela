# Repository Guidelines

## Project Structure & Module Organization

This repository is a `pnpm` monorepo. Primary code lives in `packages/*`, backend services in `server/`, shared tests in `tests/`, static assets in `public/`, and local/sample data in `data/`.

- `packages/editor`: Vue 3 editor app (`@vela/editor`)
- `packages/core`: shared types, contracts, runtime helpers
- `packages/materials`, `packages/renderer`, `packages/generator`, `packages/ui`, `packages/ui-react`
- `tests/`: unit, component, integration, and e2e coverage across packages

Prefer workspace aliases like `@vela/*` over deep relative imports.

## Build, Test, and Development Commands

- `pnpm install`: install all workspaces.
- `pnpm dev`: run server + editor together for local development.
- `pnpm -F @vela/editor dev`: run editor only.
- `pnpm -F @vela/server dev`: run backend only.
- `pnpm build`: build the main editor package.
- `pnpm lint` / `pnpm lint:fix`: check or auto-fix lint issues.
- `pnpm type-check`: run TypeScript/Vue type validation.
- `pnpm test:run`: run CI-style Vitest suite once.
- `pnpm exec playwright test`: run end-to-end tests.

## Coding Style & Naming Conventions

Use TypeScript-first Vue SFCs (`<script setup lang="ts">`). Formatting rules: 2-space indent, LF, UTF-8, max 100 columns. Prettier uses single quotes and no semicolons (`.prettierrc.json`). ESLint uses a flat config with Vue, TypeScript, Vitest, and Playwright rules.

Name tests as `*.spec.ts` or `*.test.ts`. Keep module names clear and consistent with package boundaries.

## Testing Guidelines

Vitest runs in `jsdom` and includes tests under:

- `tests/unit/**/*.spec.ts`
- `tests/components/**/*.spec.ts`
- `tests/integration/**/*.spec.ts`
- `packages/**/tests/**/*.{test,spec}.ts`

Coverage thresholds are enforced (60% statements/functions/lines, 50% branches). Update or add tests with each behavior change.

## Commit & Pull Request Guidelines

Follow Conventional Commits, e.g. `feat: ...`, `fix: ...`, `refactor: ...`, `test: ...`.

Keep commits focused. PRs should include:

- concise summary and motivation
- linked issue(s)
- screenshots/GIFs for UI changes
- verification notes (for example: `pnpm lint`, `pnpm type-check`, `pnpm test:run`)

## Security & Configuration Tips

Never commit secrets. Start from `.env.example`; keep local secrets in `.env` and `server/.env`. Treat `coverage/`, `playwright-report/`, `test-results/`, and similar generated artifacts as local unless explicitly requested.

<!-- gitnexus:start -->

# GitNexus MCP

This project is indexed by GitNexus as **webgis** (2446 symbols, 5254 relationships, 162 execution flows).

GitNexus provides a knowledge graph over this codebase — call chains, blast radius, execution flows, and semantic search.

## Always Start Here

For any task involving code understanding, debugging, impact analysis, or refactoring, you must:

1. **Read `gitnexus://repo/{name}/context`** — codebase overview + check index freshness
2. **Match your task to a skill below** and **read that skill file**
3. **Follow the skill's workflow and checklist**

> If step 1 warns the index is stale, run `npx gitnexus analyze` in the terminal first.

## Skills

| Task                                         | Read this skill file                               |
| -------------------------------------------- | -------------------------------------------------- |
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/exploring/SKILL.md`       |
| Blast radius / "What breaks if I change X?"  | `.claude/skills/gitnexus/impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?"             | `.claude/skills/gitnexus/debugging/SKILL.md`       |
| Rename / extract / split / refactor          | `.claude/skills/gitnexus/refactoring/SKILL.md`     |

## Tools Reference

| Tool             | What it gives you                                                        |
| ---------------- | ------------------------------------------------------------------------ |
| `query`          | Process-grouped code intelligence — execution flows related to a concept |
| `context`        | 360-degree symbol view — categorized refs, processes it participates in  |
| `impact`         | Symbol blast radius — what breaks at depth 1/2/3 with confidence         |
| `detect_changes` | Git-diff impact — what do your current changes affect                    |
| `rename`         | Multi-file coordinated rename with confidence-tagged edits               |
| `cypher`         | Raw graph queries (read `gitnexus://repo/{name}/schema` first)           |
| `list_repos`     | Discover indexed repos                                                   |

## Resources Reference

Lightweight reads (~100-500 tokens) for navigation:

| Resource                                       | Content                                   |
| ---------------------------------------------- | ----------------------------------------- |
| `gitnexus://repo/{name}/context`               | Stats, staleness check                    |
| `gitnexus://repo/{name}/clusters`              | All functional areas with cohesion scores |
| `gitnexus://repo/{name}/cluster/{clusterName}` | Area members                              |
| `gitnexus://repo/{name}/processes`             | All execution flows                       |
| `gitnexus://repo/{name}/process/{processName}` | Step-by-step trace                        |
| `gitnexus://repo/{name}/schema`                | Graph schema for Cypher                   |

## Graph Schema

**Nodes:** File, Function, Class, Interface, Method, Community, Process
**Edges (via CodeRelation.type):** CALLS, IMPORTS, EXTENDS, IMPLEMENTS, DEFINES, MEMBER_OF, STEP_IN_PROCESS

```cypher
MATCH (caller)-[:CodeRelation {type: 'CALLS'}]->(f:Function {name: "myFunc"})
RETURN caller.name, caller.filePath
```

<!-- gitnexus:end -->
