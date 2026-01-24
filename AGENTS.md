# AGENTS.md - Vela LowCode Editor Knowledge Base

> **System Prompt**: You are an expert TypeScript/Vue 3 developer working on the Vela LowCode Monorepo. Use this guide for all development tasks.

## 1. Project Overview

- **Name**: Vela LowCode Editor
- **Stack**: Vue 3.5+, TypeScript 5.x, Vite 6.x, Pinia, Element Plus, MongoDB.
- **Type**: Monorepo (pnpm workspaces).
- **Key Packages**:
  - `@vela/editor`: Main application logic and state.
  - `@vela/core`: Shared types (`NodeSchema`), constants, and utilities.
  - `@vela/ui`: Dumb UI components (wrappers for ECharts/Element Plus).
  - `@vela/materials`: Smart components connecting UI to Editor data.
  - `@vela/renderer`: Runtime engine for recursive rendering.
  - `@vela/server`: Express + MongoDB backend.

## 2. Environment & Commands

### Prerequisites

- Node.js >= 20.19.0 (or >= 22.12.0)
- pnpm >= 8

### Core Commands

| Action            | Command                                      | Description                            |
| ----------------- | -------------------------------------------- | -------------------------------------- |
| **Dev**           | `pnpm dev`                                   | Starts Editor (5173) + Server (3001)   |
| **Build**         | `pnpm build`                                 | Builds the editor package              |
| **Lint**          | `pnpm lint`                                  | Runs ESLint on all files (Flat Config) |
| **Type Check**    | `pnpm type-check`                            | Runs vue-tsc on editor                 |
| **Test (All)**    | `pnpm test`                                  | Runs Vitest in watch mode              |
| **Test (Single)** | `pnpm test -- --run tests/unit/file.spec.ts` | Run specific test file once (CI mode)  |
| **E2E**           | `pnpm test:e2e`                              | Runs Playwright tests                  |

### Package-Specific Operations

To run commands for a specific package, use the `-F` filter:

- **Editor**: `pnpm -F @vela/editor dev`
- **Server**: `pnpm -F @vela/server dev`
- **Add Dependency**: `pnpm add lodash -F @vela/core` (Adds lodash to core package)

## 3. Project Structure & Imports

### Import Aliases (tsconfig.json)

Always use these aliases instead of relative paths `../../`:

- `@vela/core` -> `packages/core/src`
- `@vela/ui` -> `packages/ui`
- `@vela/materials` -> `packages/materials/src`
- `@vela/renderer` -> `packages/renderer/src`
- `@vela/editor` -> `packages/editor/src`

### Directory Guide

- **`packages/editor`**: Contains `stores` (Pinia), `views`, and `components` specific to the editor interface.
- **`packages/core`**: The "leaf" node. Contains `types` and `utils` used by everyone.
- **`server`**: Standalone Express app.

## 4. Code Style & Guidelines

### TypeScript

- **Strict Mode**: Enabled. No `any`. Use `unknown` or define interface.
- **Interfaces**: Prefix with `I` is NOT used. Use meaningful names like `NodeSchema`, `ProjectData`.
- **Enums vs Unions**: Prefer String Unions (`'left' | 'right'`) over Enums unless necessary.

### Vue 3 (Composition API)

- **Syntax**: `<script setup lang="ts">` is mandatory.
- **Props**: Use `defineProps<{ title: string }>()`. Avoid runtime prop definitions.
- **Emits**: Use `defineEmits<{ (e: 'change', val: number): void }>()`.
- **Multi-word Names**: `vue/multi-word-component-names` is **OFF**. Simple names like `Editor.vue` are allowed.

### State Management (Pinia)

- **Setup Stores**: `defineStore('id', () => { ... })`.
- **State**: `ref()` inside store.
- **Getters**: `computed()` inside store.
- **Actions**: `function` inside store.
- **Persistence**: Do not rely on `localStorage` directly; use the backend API via `projectService`.

### Error Handling

- **Async/Await**: Wrap async calls in `try/catch`.
- **UI Feedback**: Use `ElMessage.error(err.message)` for user visibility.
- **Logging**: `console.error('[Context]', error)`.

## 5. Architecture & Patterns

### 1. Material System

- **UI Package**: Pure components. NO editor logic. `props` drive everything.
- **Materials Package**: Wraps UI components. Connects them to `useComponentStore` or data bindings.
- **Registry**: All materials must be registered in `packages/materials/src/registry.ts`.

### 2. Event & Data Engine

- **Event Executor**: `useEventExecutor.ts`. Handles `click`, `hover`. Dispatches actions (`toggle-visibility`).
- **Data Binding**: `useDataBindingEngine.ts`. Uses `watch` to sync `sourcePath` to `targetPath`.
- **Indexing**: Editor uses `Map<string, Node>` for fast lookups. Do not iterate the tree for simple ID lookups.

### 3. Anti-Patterns (Forbidden)

- ❌ **Circular Dependencies**: `core` imports `editor`. (Core must be independent).
- ❌ **Direct DOM Access**: Use template refs (`const el = ref<HTMLElement>()`).
- ❌ **Hardcoded Styles**: Use CSS variables or Tailwind/Unocss (if configured) or standard CSS in `<style scoped>`.
- ❌ **Any Type**: Do not use `as any` to silence errors. Fix the type.

## 6. Testing Strategy

### Unit Testing (Vitest)

- **Globals**: `describe`, `it`, `expect` are available globally but **explicit import is preferred**.
- **Location**: `tests/unit`, `tests/components`.
- **Mocking**: Use `vi.mock()` for external modules or stores.
  ```ts
  import { describe, it, expect, vi } from 'vitest'
  vi.mock('@/stores/project') // Mock store
  ```

### E2E Testing (Playwright)

- **Location**: `tests/e2e`.
- **Philosophy**: Test critical user flows (Drag component -> Change prop -> Save).
- **Selectors**: Use `data-testid` or accessible roles where possible.

## 7. AI & Cursor Rules

- **Context**: When editing a file, check its package's local `AGENTS.md` (if exists) for specific context.
- **Code Generation**:
  - Prefer small, atomic changes.
  - Always verify with `pnpm type-check` after significant TS changes.
  - Run related unit tests after logic changes.

## 8. Development Workflow

1. **Understand**: Read the `AGENTS.md` and related code.
2. **Plan**: If complex, create a TODO list.
3. **Implement**:
   - Add/Modify code.
   - **Update Types** in `@vela/core` first if data structure changes.
4. **Verify**:
   - Run `pnpm test -- --run tests/unit/relevant.spec.ts`.
   - Run `pnpm type-check`.
