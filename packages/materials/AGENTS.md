# MATERIALS PACKAGE KNOWLEDGE BASE

**Location:** `packages/materials`
**Role:** Smart component implementations for the LowCode Editor.

## OVERVIEW

Orchestrates "Smart" components that connect the `@vela/ui` "Dumb" library to the editor's global state and data fetching engine.

## STRUCTURE

- `src/basic/`: Core building blocks (Text, Image, Button, Container).
- `src/chart/`: ECharts wrappers (Line, Bar, Pie, Radar) mapping schema to `@vela/ui`.
- `src/data/`: Data-driven components (Table, List, CountUp, Pivot) with source binding.
- `src/form/`: Interactive controls (Select, DateRange, Pagination) with state sync.
- `src/layout/`: Structural containers (Flex, Grid, Tabs, Modal, Group).
- `src/advanced/`: Logic components (Scripting, State, Trigger, Html/Iframe).
- `src/registry.ts`: Auto-discovery of components and metadata via Vite glob.

## COMPONENT PATTERN (Smart vs. Dumb)

Materials are **"Smart"** because they bridge the Editor's JSON schema with visual output.

1. **The Contract**:
   - Accept `id: string` (for store lookup) and/or `props` (for runtime injection).
   - Use `v-bind="$attrs"` to pass raw properties to the underlying `@vela/ui` component.
2. **Data Fetching**:
   - Use `useDataSource(dataSourceRef)` to handle remote data fetching and reactivity.
   - Components must be "dumb" regarding where data comes from (API/Mock) but "smart" about how to map it to visual properties.
3. **State Sync**:
   - Use `storeToRefs(useComponent())` to retrieve `componentStore` for real-time state synchronization in the editor.
4. **The Rule**: Keep business logic (event dispatching, data transformation) in `materials`; keep visual logic (CSS, chart options, DOM) in `@vela/ui`.

## VISUAL LIBRARY INTEGRATION

- **ECharts**: Materials in `src/chart/` map store-driven data and configuration to `@vela/ui` chart components.
- **Leaflet**: Smart materials handle coordinate mapping and layer visibility before passing data to the `@vela/ui` map renderer.
- **Element Plus**: Form and data components wrap `@vela/ui` versions of Element Plus elements to ensure flattened property access.

## NEW COMPONENT CHECKLIST

1. **Directory**: Create `src/{category}/{ComponentName}/`.
2. **Implementation**: `{ComponentName}.vue` (Handle store sync & pass props to `@vela/ui`).
3. **Metadata**: `meta.ts` (Define setters, defaults, and category for the editor).
4. **Registry**: Ensure `index.ts` in the component directory exports the meta as default.
5. **UI Layer**: If a corresponding component doesn't exist in `@vela/ui`, it must be implemented there first.
