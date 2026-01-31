# Codebase Status & Gap Analysis

## 1. Core & Schema (Verified: ✅)

- `NodeSchema` defines recursive structure, events, data binding.
- `CodeGen` types (IR) exist in `packages/core/src/types/codegen.ts`.

## 2. UI & Materials (Verified: ✅)

- Extensive library of wrappers (ECharts, Leaflet, Element Plus).
- Categorized well (charts, controls, kpi, etc.).
- Material registry connects UI to Editor.

## 3. Editor (Verified: ✅)

- Functional panels (Setter, Material, Canvas).
- Drag-and-drop implemented.
- State managed via Pinia (`useComponentStore`).

## 4. Renderer (Partial: 🚧)

- **Implemented**: O(1) Data Binding, Event Sandbox, Basic Recursion.
- **Missing**:
  - `v-for`/`v-if` logic in runtime.
  - Named slots support.
  - Unified rendering path (currently has `RuntimeRenderer` vs `UnifiedRenderer` split).

## 5. CodeGen (Critical Gap: ❌)

- Logic exists but is mostly commented out or stubbed.
- `projectGenerator.ts` needs `JSZip` and template injection implementation.
- Missing robust import mapping (Material -> Import Statement).
