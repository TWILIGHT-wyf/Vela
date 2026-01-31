# Action Plan: Architecture Upgrade

## Phase 1: Renderer Hardening

1. **Unify Renderer**: Merge `RuntimeRenderer` and `UnifiedRenderer`.
2. **Dynamic Logic**: Implement `v-for` and `v-if` handling in `UnifiedRenderer`.
3. **Slot System**: Support named slots for complex materials.

## Phase 2: Code Generation (The "Pro" Feature)

1. **Template Engine**: Implement proper Vue SFC generation (Template + Script + Style).
2. **Project Scaffolding**: Generate full Vite project structure (package.json, index.html).
3. **Zip Export**: Use JSZip to bundle the generated strings into a downloadable file.

## Phase 3: Global Architecture

1. **Global Store**: Add `useGlobalStore` for app-level variables.
2. **Router Config**: Add visual router configuration for multi-page apps.
3. **API Manager**: Centralized Axios instance configuration.
