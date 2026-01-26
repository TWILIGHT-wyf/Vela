# Editor Setter Panel Adaptation

## Context

### Original Request

Implement missing Setter components (Slider, Radio, Image, Array) in the Editor's SetterPanel and verify two-way binding between the panel and canvas components.

### Interview Summary

**Key Discussions**:

- Identified 4 missing setters referenced in Materials Meta definitions
- Confirmed `PropsPane.vue` and `StylePaneEnhanced.vue` already support dynamic Setter loading via `setterMap`
- User chose to implement all 4 setters including ArraySetter

**Research Findings**:

- Existing setters follow strict pattern: `modelValue` prop + `@update:modelValue` emit + `v-bind="$attrs"`
- THREE locations need setterMap updates: `PropsPane.vue`, `StylePaneEnhanced.vue`, `ObjectSetter.vue`
- SliderSetter has 9 existing usages in meta files (Image, Video, Table, Charts)
- ImageSetter has 2 existing usages (Image meta, ContainerV2 meta)
- RadioSetter and ArraySetter have no current usage but are defined in types

### Metis Review

**Identified Gaps** (addressed):

- setterProps passthrough validation → Will test with Image opacity
- ArraySetter items schema complexity → Simplified to single-level only
- Three setterMap locations → All three will be updated
- Edge cases for empty states → Added graceful handling requirements

---

## Work Objectives

### Core Objective

Create 4 new Setter components and register them in the Editor's SetterPanel to complete the UI/Materials Meta integration.

### Concrete Deliverables

- `packages/editor/src/components/SetterPanel/setters/SliderSetter.vue`
- `packages/editor/src/components/SetterPanel/setters/RadioSetter.vue`
- `packages/editor/src/components/SetterPanel/setters/ImageSetter.vue`
- `packages/editor/src/components/SetterPanel/setters/ArraySetter.vue`
- Updated `PropsPane.vue` with new setterMap entries
- Updated `StylePaneEnhanced.vue` with new setterMap entries
- Updated `ObjectSetter.vue` with new setterMap entries

### Definition of Done

- [ ] `pnpm type-check` passes with no errors in SetterPanel
- [ ] `pnpm lint` passes
- [ ] Image component opacity slider works in Editor (SliderSetter)
- [ ] Image component url input shows preview (ImageSetter)

### Must Have

- All 4 setters follow existing pattern from `NumberSetter.vue`
- All 4 setters use Element Plus components
- All 4 setters support `v-bind="$attrs"` for setterProps passthrough
- Registration in all THREE setterMap locations

### Must NOT Have (Guardrails)

- NO file upload in ImageSetter (URL input only)
- NO drag-drop reordering in ArraySetter (Add/Remove only)
- NO modifications to any `meta.ts` files
- NO new types added to `@vela/core/types/material.ts`
- NO validation logic in setters (pure UI components)
- NO setter component exceeding 60 lines

---

## Verification Strategy (MANDATORY)

### Test Decision

- **Infrastructure exists**: YES (Vitest configured)
- **User wants tests**: Manual-only for this task
- **Framework**: Manual browser verification

### Manual QA Procedures

Each task includes browser-based verification:

1. Run `pnpm dev` to start Editor
2. Drag target component to canvas
3. Select component and check SetterPanel
4. Verify setter renders correctly
5. Change value and verify canvas updates
6. Change canvas value externally (if possible) and verify setter updates

---

## Task Flow

```
Task 1 (SliderSetter) → Task 5 (Register)
Task 2 (RadioSetter)  → Task 5 (Register)
Task 3 (ImageSetter)  → Task 5 (Register)
Task 4 (ArraySetter)  → Task 5 (Register)
                              ↓
                       Task 6 (Verify)
```

## Parallelization

| Group | Tasks      | Reason                             |
| ----- | ---------- | ---------------------------------- |
| A     | 1, 2, 3, 4 | Independent setter implementations |

| Task | Depends On | Reason                         |
| ---- | ---------- | ------------------------------ |
| 5    | 1, 2, 3, 4 | Must register after creation   |
| 6    | 5          | Must verify after registration |

---

## TODOs

- [ ] 1. Create SliderSetter.vue

  **What to do**:
  - Create `packages/editor/src/components/SetterPanel/setters/SliderSetter.vue`
  - Use `el-slider` with `show-input` for numeric feedback
  - Support `min`, `max`, `step` via `$attrs` passthrough
  - Default to min=0, max=100 if not provided
  - Emit number value on change

  **Must NOT do**:
  - No tick marks or custom styling
  - No debouncing (let Element Plus handle it)

  **Parallelizable**: YES (with 2, 3, 4)

  **References**:
  - `packages/editor/src/components/SetterPanel/setters/NumberSetter.vue:1-20` - Exact pattern to follow
  - `packages/materials/src/content/image/meta.ts` - Uses `SliderSetter` with `{ min: 0, max: 1, step: 0.1 }` for opacity
  - Element Plus docs: https://element-plus.org/en-US/component/slider.html

  **Acceptance Criteria**:
  - [ ] File created at correct path
  - [ ] Uses `el-slider` component
  - [ ] `show-input` prop enabled for numeric display
  - [ ] Supports `min`, `max`, `step` from setterProps
  - [ ] Emits `update:modelValue` with number type
  - [ ] Under 30 lines of code

  **Commit**: NO (groups with 5)

---

- [ ] 2. Create RadioSetter.vue

  **What to do**:
  - Create `packages/editor/src/components/SetterPanel/setters/RadioSetter.vue`
  - Use `el-radio-group` with `el-radio-button` for compact display
  - Accept `options: Array<{ label: string, value: string | number | boolean }>` via props
  - Handle empty options gracefully (show disabled state)

  **Must NOT do**:
  - No icon support in options
  - No custom styling

  **Parallelizable**: YES (with 1, 3, 4)

  **References**:
  - `packages/editor/src/components/SetterPanel/setters/SelectSetter.vue:1-33` - Options handling pattern
  - Element Plus docs: https://element-plus.org/en-US/component/radio.html

  **Acceptance Criteria**:
  - [ ] File created at correct path
  - [ ] Uses `el-radio-group` with `el-radio-button`
  - [ ] Accepts `options` prop with label/value structure
  - [ ] Handles empty options (shows disabled or placeholder)
  - [ ] Emits `update:modelValue` with selected value
  - [ ] Under 35 lines of code

  **Commit**: NO (groups with 5)

---

- [ ] 3. Create ImageSetter.vue

  **What to do**:
  - Create `packages/editor/src/components/SetterPanel/setters/ImageSetter.vue`
  - Use `el-input` for URL entry with Picture icon prefix
  - Show `el-image` preview below input when URL is provided
  - Handle broken images with error placeholder
  - Support `el-image` preview-on-click feature

  **Must NOT do**:
  - No file upload capability
  - No URL validation (allow any string)
  - No image size restrictions

  **Parallelizable**: YES (with 1, 2, 4)

  **References**:
  - `packages/editor/src/components/SetterPanel/setters/StringSetter.vue:1-20` - Input pattern
  - `packages/materials/src/content/image/meta.ts` - Uses `ImageSetter` for src prop
  - Element Plus docs: https://element-plus.org/en-US/component/image.html

  **Acceptance Criteria**:
  - [ ] File created at correct path
  - [ ] Uses `el-input` with Picture icon prefix
  - [ ] Shows `el-image` preview when URL is non-empty
  - [ ] `el-image` has `preview-src-list` for click-to-enlarge
  - [ ] Error state shows placeholder icon and "加载失败" text
  - [ ] Emits `update:modelValue` with URL string
  - [ ] Under 50 lines of code

  **Commit**: NO (groups with 5)

---

- [ ] 4. Create ArraySetter.vue

  **What to do**:
  - Create `packages/editor/src/components/SetterPanel/setters/ArraySetter.vue`
  - Render a list of items, each using the setter defined in `items` prop (PropSchema)
  - "Add" button creates new item with default values
  - "Remove" button (el-icon Delete) deletes item
  - Use `el-card` or `el-collapse` for each item container
  - Emit full array on any change

  **Must NOT do**:
  - No drag-drop reordering
  - No nested arrays (single level only)
  - No item collapse/expand animation

  **Parallelizable**: YES (with 1, 2, 3)

  **References**:
  - `packages/editor/src/components/SetterPanel/setters/ObjectSetter.vue:1-100` - Recursive setter pattern
  - `packages/core/src/types/material.ts:PropSchema.items` - Array item schema definition

  **Acceptance Criteria**:
  - [ ] File created at correct path
  - [ ] Renders list of items with appropriate setter for each
  - [ ] "Add" button adds new item with defaults
  - [ ] "Remove" button deletes specific item
  - [ ] Empty array shows "Add first item" prompt
  - [ ] Emits `update:modelValue` with full array on any change
  - [ ] Under 80 lines of code

  **Commit**: NO (groups with 5)

---

- [ ] 5. Register all setters in setterMap

  **What to do**:
  - Update `packages/editor/src/components/SetterPanel/panes/PropsPane.vue`:
    - Import all 4 new setters
    - Add to `setterMap` object (around line 96-104)
  - Update `packages/editor/src/components/SetterPanel/panes/StylePaneEnhanced.vue`:
    - Import all 4 new setters
    - Add to `setterMap` object (around line 359-367)
  - Update `packages/editor/src/components/SetterPanel/setters/ObjectSetter.vue`:
    - Import all 4 new setters
    - Add to `setterMap` object (around line 57-65)

  **Must NOT do**:
  - No changes to component logic
  - No reordering of existing imports

  **Parallelizable**: NO (depends on 1-4)

  **References**:
  - `packages/editor/src/components/SetterPanel/panes/PropsPane.vue:80-104` - Current setterMap location
  - `packages/editor/src/components/SetterPanel/panes/StylePaneEnhanced.vue:230-237, 359-367` - Import and setterMap
  - `packages/editor/src/components/SetterPanel/setters/ObjectSetter.vue:45-65` - Import and setterMap

  **Acceptance Criteria**:
  - [ ] All 4 setters imported in PropsPane.vue
  - [ ] All 4 setters added to PropsPane.vue setterMap
  - [ ] All 4 setters imported in StylePaneEnhanced.vue
  - [ ] All 4 setters added to StylePaneEnhanced.vue setterMap
  - [ ] All 4 setters imported in ObjectSetter.vue
  - [ ] All 4 setters added to ObjectSetter.vue setterMap
  - [ ] `pnpm type-check` passes
  - [ ] `pnpm lint` passes

  **Commit**: YES
  - Message: `feat(editor): add Slider, Radio, Image, Array setters to SetterPanel`
  - Files: `packages/editor/src/components/SetterPanel/setters/*.vue`, `packages/editor/src/components/SetterPanel/panes/*.vue`
  - Pre-commit: `pnpm type-check && pnpm lint`

---

- [ ] 6. Verify two-way binding with Image component

  **What to do**:
  - Run `pnpm dev` to start the Editor
  - Drag an Image component to canvas
  - Select the Image component
  - In PropsPane, verify `src` uses ImageSetter (shows preview)
  - In StylePane, verify `opacity` uses SliderSetter (shows slider)
  - Change opacity via slider → verify canvas Image opacity changes
  - Change src URL → verify canvas Image and preview update

  **Must NOT do**:
  - No code changes in this task
  - No automated test creation

  **Parallelizable**: NO (depends on 5)

  **References**:
  - `packages/materials/src/content/image/meta.ts` - Image meta with SliderSetter/ImageSetter
  - `packages/editor/src/stores/component.ts:updateProps, updateStyle` - Store actions

  **Acceptance Criteria**:
  - [ ] Editor starts without errors (`pnpm dev`)
  - [ ] Image component can be dragged to canvas
  - [ ] ImageSetter renders for `src` prop with preview
  - [ ] SliderSetter renders for `opacity` style
  - [ ] Changing slider updates canvas component opacity in real-time
  - [ ] Changing URL updates canvas component image and setter preview
  - [ ] Console shows `[PropsPane] Updated ...` logs on changes

  **Commit**: NO (verification only)

---

## Commit Strategy

| After Task | Message                                                                | Files                                        | Verification                   |
| ---------- | ---------------------------------------------------------------------- | -------------------------------------------- | ------------------------------ |
| 5          | `feat(editor): add Slider, Radio, Image, Array setters to SetterPanel` | setters/_.vue, panes/_.vue, ObjectSetter.vue | `pnpm type-check && pnpm lint` |

---

## Success Criteria

### Verification Commands

```bash
pnpm type-check  # Expected: No errors in SetterPanel files
pnpm lint        # Expected: No warnings in SetterPanel files
pnpm dev         # Expected: Editor starts, Image component works with new setters
```

### Final Checklist

- [ ] All 4 setters created and follow NumberSetter pattern
- [ ] All 3 setterMap locations updated
- [ ] No file upload in ImageSetter
- [ ] No drag-drop in ArraySetter
- [ ] Type check passes
- [ ] Lint passes
- [ ] Image opacity slider works
- [ ] Image URL preview works
