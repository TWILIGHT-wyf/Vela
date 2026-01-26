# Core Type Definitions - Vela LowCode Editor

**Location:** `packages/core/src/types/`

This document provides the exact type definitions that UI and Materials packages must follow.

---

## 1. NodeSchema - Core Component Instance Protocol

**File:** `packages/core/src/types/schema.ts`

The **primary** type for describing a component instance on the canvas.

```typescript
interface NodeSchema<P = Record<string, PropValue>> {
  // === Identity ===
  id: string // Unique component ID
  componentName: string // Matches MaterialMeta.name
  title?: I18nString // User-defined display name

  // === Properties & Styling ===
  props?: P // Component-specific properties
  style?: NodeStyle // Position, size, visual styles

  // === Layout ===
  layoutMode?: LayoutMode // 'free' | 'flex' | 'grid'

  // === Code Generation ===
  slotName?: string // Parent slot this belongs to
  slotScope?: string // Scoped slot parameter name

  // === Data Source ===
  dataSource?: DataSourceConfig // Remote data fetching config

  // === Tree Structure ===
  children?: NodeSchema[] // Child components (recursive)

  // === Dynamic Directives ===
  condition?: boolean | JSExpression // v-if condition
  loop?: {
    // v-for configuration
    data: unknown[] | JSExpression
    itemArg?: string // Item variable name
    indexArg?: string // Index variable name
  }

  // === Interaction ===
  events?: Record<string, ActionSchema[]> // Event handlers
  dataBindings?: DataBinding[] // Property bindings

  // === Animation ===
  animation?: {
    name: string
    class: string
    duration: number
    delay: number
    iterationCount: number | string
    timingFunction: string
    trigger: 'load' | 'hover' | 'click'
  }
}
```

### NodeStyle - Unified Style Type

```typescript
interface NodeStyle {
  // === Position & Size (Layout) ===
  x?: number // Absolute X position
  y?: number // Absolute Y position
  width?: number | string // Width (px or %)
  height?: number | string // Height (px or %)

  // === Transform ===
  rotate?: number // Rotation in degrees
  transform?: string // CSS transform

  // === Z-Index ===
  zIndex?: number

  // === Flex Container Properties ===
  display?: string
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around'
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch'
  gap?: number | string

  // === Flex Item Properties ===
  flexGrow?: number
  flexShrink?: number
  flexBasis?: string | number
  alignSelf?: 'auto' | 'flex-start' | 'center' | 'flex-end' | 'stretch'
  margin?: string
  padding?: number | string

  // === Visual Styles ===
  locked?: boolean
  color?: string
  fontSize?: string | number
  fontWeight?: string | number
  fontFamily?: string
  textAlign?: string
  lineHeight?: string | number
  position?: string
  backgroundColor?: string
  borderRadius?: string | number
  opacity?: number
  overflow?: string
  boxShadow?: string
  border?: string

  // === Extensibility ===
  [key: string]: unknown // Allow arbitrary properties
}
```

---

## 2. MaterialMeta - Component Metadata Protocol

**File:** `packages/core/src/types/material.ts`

Describes a component's capabilities, properties, and editor configuration.

```typescript
interface MaterialMeta {
  // === Identity ===
  name: string // Unique component name (required)
  componentName?: string // Alias for backward compatibility
  title: I18nString // Display name in editor
  version: string // Semantic version (required)
  category: string // Category for grouping (e.g., '图表', '基础控件')

  // === Visual ===
  screenshot?: string // Component preview image URL

  // === Capabilities ===
  isContainer?: boolean // Can have children?

  // === Assets (for external libraries) ===
  assets?: {
    js: string // JavaScript library URL
    css?: string // CSS stylesheet URL
    library?: string // Library name (e.g., 'echarts')
  }

  // === Property Definitions ===
  props: PropSchema[] | Record<string, PropSchema> // Property schema
  styles?: Record<string, PropSchema> // Style properties (legacy)

  // === Events ===
  events?: string[] // Supported event names (e.g., ['onClick', 'onHover'])

  // === Editor Defaults ===
  defaultSize?: {
    width: number
    height: number
  }

  // === Code Generation ===
  importSpec?: ComponentImportSpec // How to import this component
}
```

### PropSchema - Property Definition

```typescript
interface PropSchema {
  // === Identity ===
  name: string // Property name
  label: I18nString // Display label in editor
  title?: I18nString // Backward compatibility

  // === Editor UI ===
  setter: SetterType // UI control type (see below)
  setterProps?: Record<string, unknown> // Configuration for the setter
  visible?: string | ((props: any) => boolean) // Conditional visibility
  description?: string // Help text
  group?: string // Property group in editor
  required?: boolean

  // === Defaults & Validation ===
  defaultValue?: unknown
  validationMessage?: string
  schemaKey?: string

  // === Nested Properties (V2) ===
  properties?: Record<string, PropSchema> // For ObjectSetter
  items?: PropSchema // For ArraySetter
  collapsed?: boolean // Collapse in editor
}
```

### SetterType - Available Property Editors

```typescript
type SetterType =
  | 'StringSetter' // Text input
  | 'NumberSetter' // Number input
  | 'BooleanSetter' // Toggle/checkbox
  | 'SelectSetter' // Dropdown (requires setterProps.options)
  | 'ColorSetter' // Color picker
  | 'JsonSetter' // JSON editor
  | 'ExpressionSetter' // JavaScript expression
  | 'ImageSetter' // Image upload
  | 'RadioSetter' // Radio buttons
  | 'SliderSetter' // Slider (requires setterProps.min/max)
  | 'ObjectSetter' // Nested object (requires properties)
  | 'ArraySetter' // Array/list (requires items)
```

### ComponentImportSpec - Code Generation

```typescript
interface ComponentImportSpec {
  package: string // Package name (e.g., '@vela/ui')
  exportName: string // Export name in package
  type?: ImportType // 'default' | 'named' | 'namespace' | 'side-effect'
  async?: boolean // Dynamic import?
}
```

---

## 3. ActionSchema - Event Action Protocol

**File:** `packages/core/src/types/action.ts`

Describes what happens when an event is triggered.

```typescript
interface ActionSchema {
  // === Identity ===
  id: string
  type: BuiltInActionType | string // Action type (extensible)
  name?: string // Display name

  // === Parameters ===
  payload?: Record<string, unknown> // Unified parameter object

  // === Flow Control ===
  next?: string // Next action ID (serial execution)
  handlers?: {
    success?: string // Success handler action ID
    fail?: string // Failure handler action ID
  }
  condition?: string | boolean | JSExpression // Execution condition

  // === Legacy Fields (deprecated, use payload) ===
  targetId?: string
  url?: string
  path?: string
  value?: unknown
  args?: unknown[]
  content?: string
  delay?: number
  message?: string
  blank?: boolean
}
```

### BuiltInActionType - Supported Actions

```typescript
type BuiltInActionType =
  | 'setState' // Modify state/variables
  | 'openUrl' // Open URL
  | 'ajax' // Send HTTP request
  | 'showToast' // Show notification
  | 'dialog' // Open dialog
  | 'component' // Call component method
  | 'script' // Execute custom JS
  | 'navigate' // Route navigation
  | 'visibility' // Toggle visibility (legacy)
  | 'alert' // Show alert (legacy)
```

---

## 4. DataBinding - Property Binding Protocol

**File:** `packages/core/src/types/schema.ts`

Describes how component properties are synchronized.

```typescript
interface DataBinding {
  sourceId: string // Source component ID
  sourcePath: string // Source property path (e.g., 'props.value')
  targetPath: string // Target property path (e.g., 'props.text')
  transformer?: string // Transformation expression
  transformerType?: 'expression' | 'template' // Transformer type
}
```

---

## 5. DataSourceConfig - Remote Data Fetching

**File:** `packages/core/src/types/schema.ts`

Configures how components fetch remote data.

```typescript
interface DataSourceConfig {
  enabled?: boolean
  url?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  body?: string
  interval?: number // Polling interval (seconds)

  // === Data Path Mapping ===
  dataPath?: string // Path to main data array
  xAxisPath?: string // For charts: X-axis data
  seriesNamePath?: string // For charts: Series name
  labelsPath?: string // For tables: Column labels
  valuePath?: string // For KPI: Value path
  namePath?: string // For lists: Item name
  minPath?: string // For gauges: Min value
  maxPath?: string // For gauges: Max value
  nodesPath?: string // For graphs: Nodes
  linksPath?: string // For graphs: Links
}
```

---

## 6. JSExpression - Dynamic Value Container

**File:** `packages/core/src/types/expression.ts`

Wraps JavaScript expressions to distinguish them from static values.

```typescript
interface JSExpression {
  type: 'JSExpression'
  value: string // JavaScript code as string
}

type PropValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | JSExpression
  | PropValue[]
  | { [key: string]: PropValue }
```

**Example:**

```typescript
// Static value
{ type: 'Button', props: { text: 'Click me' } }

// Dynamic value
{ type: 'Button', props: { text: { type: 'JSExpression', value: 'state.buttonLabel' } } }
```

---

## 7. I18nString - Internationalization

**File:** `packages/core/src/types/i18n.ts`

Supports multi-language strings.

```typescript
type I18nString = string | { [locale: string]: string }

// Examples:
'按钮'                                    // Simple string
{ en: 'Button', zh: '按钮' }             // Multi-language
```

---

## 8. LayoutMode - Layout Types

**File:** `packages/core/src/types/schema.ts`

```typescript
type LayoutMode = 'free' | 'flex' | 'grid'

// - 'free': Absolute positioning (default)
// - 'flex': Flexbox layout
// - 'grid': CSS Grid (reserved for future)
```

---

## 9. Component Registry Pattern

**File:** `packages/materials/src/registry.ts`

The registry auto-discovers components using Vite's `import.meta.glob`.

### Key Functions

```typescript
// Get component implementation
getComponent(name: string): Component | string

// Check if component exists
hasComponent(name: string): boolean

// Get all registered component names
getRegisteredComponents(): string[]

// Get materials grouped by category
getMaterialsByCategory(): Record<string, MaterialMeta[]>

// Extract default props from MaterialMeta
extractDefaultProps(props: MaterialMeta['props']): Record<string, unknown>
```

### Component Discovery

1. **Vue Components**: Auto-discovered from `src/**/*.vue` files
2. **Metadata**: Auto-discovered from `src/**/index.ts` files (exports `MaterialMeta`)
3. **Naming**: Component names are PascalCase (e.g., `LineChart`, `Button`)
4. **Fallback**: If not found in materials, tries `@vela/ui` with `v` prefix (e.g., `vButton`)

---

## 10. Material Implementation Pattern

**File:** `packages/materials/src/utils/defineMaterial.ts`

### Directory Structure

```
src/{category}/{ComponentName}/
├── {ComponentName}.vue              # Smart component implementation
├── meta.ts                          # MaterialMeta definition
└── index.ts                         # Exports meta as default
```

### Example: Button Component

**meta.ts:**

```typescript
import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'Button',
  componentName: 'Button',
  title: '按钮',
  version: '1.0.0',
  category: '基础控件',
  props: {
    text: {
      name: 'text',
      label: '按钮文本',
      setter: 'StringSetter',
      defaultValue: '按钮',
      group: '基础',
    },
    type: {
      name: 'type',
      label: '按钮类型',
      setter: 'SelectSetter',
      setterProps: {
        options: [
          { label: '主要按钮', value: 'primary' },
          { label: '成功按钮', value: 'success' },
          // ...
        ],
      },
      defaultValue: 'primary',
      group: '基础',
    },
    // ... more props
  },
  events: ['onClick'],
  defaultSize: { width: 100, height: 36 },
}

export default meta
```

**Button.vue:**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import vButton from '@vela/ui/Button'

interface Props {
  id?: string
  text?: string
  type?: string
  size?: string
  disabled?: boolean
  loading?: boolean
  // ... other props
}

const props = withDefaults(defineProps<Props>(), {
  text: '按钮',
  type: 'primary',
  size: 'default',
})

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <v-button
    :text="text"
    :type="type"
    :size="size"
    :disabled="disabled"
    :loading="loading"
    v-bind="$attrs"
    @click="emit('click')"
  />
</template>
```

**index.ts:**

```typescript
import meta from './meta'
export default meta
```

---

## 11. Key Principles

### Type Safety

- ✅ Use strict TypeScript (`strict: true`)
- ✅ No `any` types; use `unknown` or define interfaces
- ✅ Prefer string unions over enums

### Component Naming

- ✅ PascalCase for component names (e.g., `LineChart`, `Button`)
- ✅ No `I` prefix for interfaces
- ✅ Meaningful names (e.g., `NodeSchema` not `INode`)

### Props Definition

- ✅ Use `PropSchema[]` or `Record<string, PropSchema>`
- ✅ Always include `name`, `label`, `setter`, `defaultValue`
- ✅ Group related properties with `group` field
- ✅ Use `setterProps` for setter configuration

### Backward Compatibility

- ✅ `Component` type is deprecated; use `NodeSchema`
- ✅ `componentName` field in `MaterialMeta` is for compatibility
- ✅ Legacy action fields (`url`, `targetId`) still supported but use `payload`

### Extensibility

- ✅ `NodeStyle` allows arbitrary properties via `[key: string]: unknown`
- ✅ `ActionSchema.type` is extensible (not limited to `BuiltInActionType`)
- ✅ `PropValue` supports nested objects and arrays

---

## 12. Import Aliases

Always use these aliases instead of relative paths:

```typescript
import type { NodeSchema, MaterialMeta, PropSchema } from '@vela/core/types'
import { getComponent, materialList } from '@vela/materials'
import { vButton, vText } from '@vela/ui'
```

---

## 13. Quick Reference

| Type               | File            | Purpose                            |
| ------------------ | --------------- | ---------------------------------- |
| `NodeSchema`       | `schema.ts`     | Component instance on canvas       |
| `MaterialMeta`     | `material.ts`   | Component metadata & editor config |
| `PropSchema`       | `material.ts`   | Property definition                |
| `ActionSchema`     | `action.ts`     | Event action                       |
| `DataBinding`      | `schema.ts`     | Property binding                   |
| `DataSourceConfig` | `schema.ts`     | Remote data config                 |
| `JSExpression`     | `expression.ts` | Dynamic value                      |
| `NodeStyle`        | `schema.ts`     | Unified style type                 |
| `I18nString`       | `i18n.ts`       | Multi-language string              |

---

## 14. Example: Complete Material Definition

```typescript
// meta.ts
import type { MaterialMeta } from '@vela/core/types'

const meta: MaterialMeta = {
  name: 'LineChart',
  title: '折线图',
  version: '1.0.0',
  category: '图表',
  isContainer: false,
  props: {
    title: {
      name: 'title',
      label: '图表标题',
      setter: 'StringSetter',
      defaultValue: '',
      group: '基础',
    },
    data: {
      name: 'data',
      label: '数据',
      setter: 'JsonSetter',
      defaultValue: [150, 230, 224],
      group: '数据',
    },
    lineColor: {
      name: 'lineColor',
      label: '线条颜色',
      setter: 'ColorSetter',
      defaultValue: '#409eff',
      group: '样式',
    },
  },
  events: ['onClick'],
  defaultSize: { width: 400, height: 300 },
}

export default meta
```

```typescript
// LineChart.vue
<script setup lang="ts">
import vLineChart from '@vela/ui/LineChart'

interface Props {
  id?: string
  title?: string
  data?: number[]
  lineColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  data: () => [],
  lineColor: '#409eff',
})
</script>

<template>
  <v-line-chart
    :title="title"
    :data="data"
    :line-color="lineColor"
    v-bind="$attrs"
  />
</template>
```

---

This document is the **source of truth** for type definitions. Always refer here when implementing UI components or materials.
