# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Current App

- **TikTok Inspector** (`artifacts/tiktok-inspector`) is the primary web app at `/`.
- The app searches TikTok usernames and displays normalized account metrics, privacy/contact availability flags, story analytics, missing fields, and source status.
- Live TikTok data is served through the shared API server at `/api/tiktok/profile` so API keys are never exposed to the browser.
- Required secret for live lookups: `TIKTOK_SCRAPER_API_KEY`. Optional env/config: `TIKTOK_SCRAPER_HOST` if the RapidAPI host differs from the default.
- Story fetching uses TikTok Scraper pagination (`cursor`/`hasMore`) to return all story/content items exposed by the API, not just the first page.
- Friend count falls back to mutual follower/following calculation when the API does not return a direct `friendCount`. Large accounts may omit this if the scan exceeds `TIKTOK_MAX_FRIEND_SCAN`.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 20 (Replit environment)
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (ESM bundle for API server)
- **Frontend**: React 19, Vite, Tailwind CSS 4

## Replit Setup

- **Frontend port**: 5000 (webview)
- **API server port**: 3001 (proxied via Vite's `/api` proxy in dev)
- **Environment variables**:
  - `PORT=5000` — frontend port
  - `API_PORT=3001` — backend port
  - `BASE_PATH=/` — Vite base path
  - `NODE_ENV=development`
  - `DATABASE_URL` — auto-provisioned PostgreSQL
- **Secrets needed**:
  - `TIKTOK_SCRAPER_API_KEY` — RapidAPI key for TikTok Scraper 7

## Start Scripts

- `start.sh` — dev mode: builds API server + runs both services
- `start-prod.sh` — production mode: runs pre-built API + vite preview

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
