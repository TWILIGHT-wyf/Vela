# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vela LowCode Editor is a Vue 3 + TypeScript data visualization dashboard low-code platform. It uses a pnpm workspace monorepo with the following package hierarchy:

```
Editor → Renderer → Materials → UI/Core
```

Dependencies flow downward. `@vela/core` is the leaf node with no internal dependencies.

### Package Aliases (use instead of relative paths)

- `@vela/core` → `packages/core/src` (types, utilities)
- `@vela/editor` → `packages/editor/src` (main application)
- `@vela/materials` → `packages/materials/src` (drag-and-drop components)
- `@vela/renderer` → `packages/renderer/src` (runtime rendering engine)
- `@vela/generator` → `packages/generator/src` (Vue/React code generation)
- `@vela/ui` → `packages/ui` (pure UI components)

## Commands

```bash
# Development
pnpm dev                    # Start Docker, Editor (5173), Server (3001) concurrently
pnpm -F @vela/editor dev    # Editor only
pnpm -F @vela/server dev    # Server only

# Building
pnpm build                  # Build editor package

# Testing
pnpm test                   # Vitest watch mode
pnpm test:run               # Single test run
pnpm test -- --run tests/unit/file.spec.ts  # Run specific test file
pnpm test:coverage          # Coverage report
pnpm test:e2e               # Playwright E2E tests

# Code Quality
pnpm lint                   # ESLint (flat config)
pnpm lint:fix               # Auto-fix lint issues
pnpm format                 # Prettier format all files
pnpm type-check             # vue-tsc type checking

# Package Operations
pnpm -F <package> <command> # Run command for specific package
pnpm add lodash -F @vela/core  # Add dependency to specific package
```

## Architecture

### Core Data Structure: NodeSchema

The central data structure representing components in the editor:

```typescript
interface NodeSchema {
  id: string
  componentName: string
  props?: object
  style?: NodeStyle
  children?: NodeSchema[]
  events?: Record<string, ActionSchema[]>
  dataBindings?: DataBinding[]
  dataSource?: DataSourceConfig
  condition?: expression  // Conditional rendering
  loop?: LoopConfig       // Loop rendering
}
```

### State Management (Pinia)

Modular store architecture in `packages/editor/src/stores/`:
- `component/` - Component tree with O(1) Map-based indexing
- `project.ts` - Project metadata
- `history.ts` - Command pattern undo/redo
- `ui.ts` - UI state

### Command Pattern

All component tree mutations go through Commands (AddComponent, DeleteComponent, MoveComponent, UpdateProps, UpdateStyle) enabling full undo/redo support.

### Code Generation Flow

```
NodeSchema → IR Conversion → IRNode → Vue/React Generator → Source Code
```

Uses an intermediate representation (IR) for framework-agnostic transformation.

### Runtime Rendering Flow

```
NodeSchema → Renderer → useComponentDataSource → useDataBindingEngine → Component
```

## Code Style

- **TypeScript**: Strict mode enabled, no `any` types
- **Vue**: `<script setup lang="ts">` is mandatory
- **Props**: `defineProps<{ title: string }>()`
- **Emits**: `defineEmits<{ (e: 'change', val: number): void }>()`
- **Pinia Stores**: Setup syntax with `ref()`, `computed()`, and functions
- **Multi-word component names**: Disabled (`vue/multi-word-component-names` OFF)

## Material System

- **UI Package** (`@vela/ui`): Pure components, props-driven, no editor logic
- **Materials Package** (`@vela/materials`): Wraps UI, connects to stores and data bindings
- Materials must be registered in `packages/materials/src/registry.ts`

Each material has:
- `.vue` component implementation
- `meta.ts` with property schema/setter configuration
- Registry entry (name, category, defaultSize, props, events)

## Key Patterns

- Use Map-based indexing for O(1) component lookups (don't iterate the tree)
- Event system uses ActionSchema with 10+ action types (toggle-visibility, navigate-page, custom-script, etc.)
- Data binding engine uses Vue watch for source→target property synchronization
- Expression validation in generator for safe code generation

## Forbidden Patterns

- Circular dependencies (core must remain independent)
- Direct DOM access (use template refs)
- `as any` type assertions
- Hardcoded styles (use CSS variables or scoped styles)
