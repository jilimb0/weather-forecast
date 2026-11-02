# Weather Forecast

Production-ready weather forecast app with Hono backend, Netlify Functions, PWA support,
structured logging, and Sentry monitoring.

## Tech Stack
- **Language:** JavaScript (CommonJS + ESM)
- **Backend:** Hono + Netlify Functions
- **Tests:** Vitest (27 tests across 7 files), Playwright (4 E2E tests)
- **Lint/Format:** Biome 2.5
- **Monitoring:** Sentry + structured logger
- **PWA:** Service Worker + Web Manifest
- **Deploy:** Docker Compose + Netlify

## Commands
- `pnpm start` — node src/index.js (port 3000)
- `pnpm lint` / `pnpm format` — Biome
- `pnpm test` — Vitest
- `pnpm test:e2e` — Playwright
- `pnpm validate` — lint + test

## Structure
- `src/` — server, weather service, cache, circuit breaker, logger
- `netlify/functions/` — serverless API (weather, geocode)
- `scripts/` — frontend app modules
- `tests/` — Vitest (7 files, 27 tests)
- `e2e/` — Playwright (4 tests)

## Conventions
- CommonJS for Node backend, ESM for frontend and tests
- Minimal dependencies (Hono + dotenv + Sentry)
- Structured logger with ISO timestamps
- Docker Compose for local dev
