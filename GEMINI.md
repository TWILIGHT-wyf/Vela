# Vela Low-Code Editor Project Context

## Project Overview

This is a **Vela Low-Code Editor** project, a platform for building data visualization dashboards with geospatial capabilities. It is structured as a **monorepo** using PNPM workspaces.

The project is currently undergoing a significant architectural refactor (V1.5) to move from a flat component list to a **recursive tree-based structure** with a dedicated rendering engine.

### Key Technologies

- **Framework:** Vue 3 (Composition API)
- **Language:** TypeScript
- **Build Tool:** Vite
- **Package Manager:** PNPM
- **State Management:** Pinia
- **UI Library:** Element Plus
- **Visualization:** ECharts, Leaflet
- **Backend:** Node.js, Express, MongoDB (in `server/`)

## Architecture & Packages

The project is organized into several packages under the `packages/` directory, scoped under `@vela`:

- **`packages/editor` (`@vela/editor`)**: The main editor application. Contains the UI, canvas, and logic for the low-code platform.
  - _Note:_ Currently transitioning to V1.5 architecture (see below).
- **`packages/core` (`@vela/core`)**: The protocol layer. Contains shared types, utilities, and core logic used across packages.
- **`packages/renderer` (`@vela/renderer`)**: The runtime rendering engine. Responsible for recursively rendering the component tree.
- **`packages/materials` (`@vela/materials`)**: The component/material library wrapper.
- **`packages/ui` (`@vela/ui`)**: Shared UI components.
- **`server` (`webgis-server`)**: The backend service providing AI agent integration and project persistence (MongoDB).

### V1.5 Architecture (Refactoring)

The editor is moving towards a V1.5 architecture characterized by:

- **Tree Structure:** Components are stored as a recursive tree (`NodeSchema`) instead of a flat array.
- **Store:** `componentV2.ts` in `packages/editor` manages the tree state.
- **Recursive Rendering:** Uses `RecursiveRenderer` (from `@vela/renderer`) instead of iterating over a list of shapes.
- **Component Requirement:** All material components **must** accept a `data-id` attribute and container components must include a `<slot />`.

## Development Workflow

### Prerequisites

- Node.js (v20+)
- PNPM (v8+)
- MongoDB (Optional, for backend persistence)

### Installation

```bash
pnpm install
```

### Key Commands

| Command           | Scope     | Description                                                 |
| :---------------- | :-------- | :---------------------------------------------------------- |
| `pnpm dev`        | Root      | Starts the frontend editor (`@vela/editor`).                |
| `pnpm build`      | Root      | Builds the frontend editor.                                 |
| `pnpm lint`       | Root      | Runs ESLint.                                                |
| `pnpm type-check` | Root      | Runs TypeScript type checking.                              |
| `pnpm dev`        | `server/` | Starts the backend server (run inside `server/` directory). |

> **Note:** The root `pnpm dev` currently only starts the frontend. To run the full stack, you need to run the server separately in the `server` directory.

### Running Tests

The project contains unit, integration, and E2E tests.

- **Configuration:** `vitest.config.ts`, `playwright.config.ts` are in the root.
- **Execution:** Use `npx vitest` or check for specific test scripts if added.

## Directory Structure Highlights

- `packages/editor/src/components/Canvas`: V1.5 Canvas implementation.
- `packages/editor/src/views/EditorV2.vue`: Entry point for the V1.5 editor.
- `packages/editor/src/stores/componentV2.ts`: New tree-based store.
- `server/routes/ai.ts`: AI Agent integration logic.
- `tests/`: Global test suite.

## Coding Conventions

- **Package Scoping:** Use `pnpm -F <package-name> <command>` to run commands for specific packages.
- **Imports:** Use workspace aliases (e.g., `@vela/core`) where applicable.
- **Vue Style:** script setup with Composition API.
