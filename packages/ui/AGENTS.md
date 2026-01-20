# UI PACKAGE KNOWLEDGE BASE

**Location:** `packages/ui`
**Complexity:** Moderate (122 files)
**Role:** Reusable UI library for the LowCode ecosystem.

## OVERVIEW

A specialized UI component library for data visualization, wrapping Element Plus and ECharts with a flattened interface for low-code property mapping.

## STRUCTURE

- `src/components/`: Atomic UI components categorized by function (chart, kpi, map, controls, layout, media).
- `src/hooks/`: Reusable logic such as `useDataSource` for handling component data fetching.
- `src/utils/`: Chart configuration helpers, data transformation, and GIS-related utilities.
- `docs/`: VitePress documentation site. Run with `pnpm -F @vela/ui run docs:dev` (or see `@twi1i9ht/visual-lib-docs`).
- `index.ts`: The main library entry point, exporting all components and types.

## COMPONENT GUIDELINES

- **Element Plus Wrapper Patterns**:
  - Components wrap Element Plus (e.g., `el-select`, `el-table`) to provide a consistent, flattened API.
  - Expose simplified props (e.g., `selectWidth`) instead of complex nested style objects.
  - Use CSS variables for dynamic customization (e.g., `--el-input-border-color: props.borderColor`).
- **ECharts Wrapper Patterns**:
  - Utilize `vue-echarts` for rendering with fine-grained component imports (tree-shaking).
  - Standardize option generators that map simplified props to full `EChartsOption`.
- **Props & Emits**:
  - Use `withDefaults` for all component props to ensure stable default states.
  - Standardize events: use `update:modelValue` for two-way binding and `change` for value updates.
  - Components must handle empty data states gracefully by providing sensible defaults.

## BUILD ARTIFACTS

- **Library Mode**: Configured in `vite.config.ts` using Vite's `build.lib` mode for external consumption.
- **Output Formats**: ESM and UMD bundles are generated in `dist/`.
- **Type Definitions**: `.d.ts` files are automatically generated via `vite-plugin-dts`.
- **Externalization**: `vue`, `echarts`, `element-plus`, and `leaflet` are externalized in Rollup to avoid duplicate bundling.
- **Tree Shaking**: Pure named exports are used throughout to support efficient tree shaking in the main application.
