# SERVER KNOWLEDGE BASE

**Generated:** 2026-01-20
**Package:** @vela/server

## OVERVIEW

Lightweight Node/Express orchestration layer for project persistence and multi-provider AI model proxying.

## STRUCTURE

### Express Middleware

- **Standard**: `cors`, `express.json({ limit: '10mb' })` for large schema payloads.
- **Custom**: Global request logger, 404 fallback, and centralized async error handling.

### Routes (`/api`)

- **Projects (`/projects`)**: CRUD for low-code project JSON schemas.
- **AI Agent (`/ai`)**: Unified gateway for LLM interactions (`/generate`, `/models`).
- **Mock Data (`/mock`)**: Dynamic JSON generators for dashboard testing.

### Models & Schema Linkage

- **Project Model**: Defined in `models/Project.ts` using Mongoose.
- **Storage**: Maps front-end `NodeSchema` objects to MongoDB `Mixed` fields.
- **Connection**: Managed via `db.ts` with graceful startup in `index.ts`.

## AI INTEGRATION

### Provider Abstraction

Abstracts multiple LLM APIs into a unified internal format via `routes/ai.ts`:

- **Supported**: Gemini (default), OpenAI, Claude, Qwen, DeepSeek.
- **Mechanism**: Per-provider `transform` logic maps vendor-specific formats to shared schema.

### Connectivity & Proxying

- **Client**: Uses `undici` for high-performance HTTP requests.
- **Proxy**: Supports `ProxyAgent` via `HTTPS_PROXY` for restricted environment access.

## DEPLOYMENT

### Environment Variables

```env
PORT=3001
MONGODB_URI=mongodb://127.0.0.1:27017/vela
AI_PROVIDER=gemini # choices: gemini, openai, claude, qwen, deepseek
AI_API_KEY=xxx
HTTPS_PROXY=http://127.0.0.1:7897 # required for global models in some regions
```

### Docker

- Integrated in root `docker-compose.yml` with MongoDB container.
- Persistent volumes mapped to `./data/db` for database data.
