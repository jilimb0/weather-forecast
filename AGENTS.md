# Weather Forecast

Production-ready weather forecast app with Express backend, Netlify Functions, PWA support,
structured logging, and Sentry monitoring.

## Tech Stack
- **Language:** JavaScript (CommonJS + ESM)
- **Backend:** Express 5 + Netlify Functions
- **Tests:** Vitest (18 tests), Playwright (E2E)
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
- `src/` — server, weather service, logger
- `netlify/functions/` — serverless API
- `scripts/` — frontend app modules
- `tests/` — Vitest (5 files, 18 tests)
- `e2e/` — Playwright (4 tests)

## Conventions
- CommonJS for Node, ESM for frontend
- Minimal dependencies (Express + dotenv + Sentry)
- Structured logger with ISO timestamps
- Docker Compose for local dev
