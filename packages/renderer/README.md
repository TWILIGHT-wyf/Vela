# @vela/renderer

Runtime renderer for Vela low-code projects.

## Structure

- `src/runtime`
  Runtime Vue components, runtime hooks, and runtime-facing types.
- `src/plugins`
  Built-in runtime plugins such as data binding and event execution.
- `src/devtools`
  Runtime inspection and debugging helpers.
- `src/types.ts`
  Public type exports for consumers.

## Public API

The package root exports:

- `RuntimeRenderer`
- `RuntimeComponent`
- runtime hooks such as `useComponentDataSource` and `useDataBindingEngine`
- built-in plugins such as `DataBindingPlugin` and `EventExecutorPlugin`
- runtime and devtools types

## Build Notes

- The library build externalizes Vue, Element Plus, lodash-es, and sibling `@vela/*` packages.
- `preserveSymlinks` is enabled so workspace package imports stay external in monorepo builds.
- `emptyOutDir` is enabled to prevent stale preserved-module artifacts from leaking into `dist`.
