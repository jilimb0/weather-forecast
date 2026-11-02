# Weather Forecast

Production-ready weather forecast app with Hono backend, serverless Netlify Functions, and PWA support. Fetches from OpenWeather API.

## Tech Stack
- **Language:** JavaScript (CommonJS for Node, ESM for frontend & tests)
- **Backend:** Hono (@hono/node-server)
- **Serverless:** Netlify Functions
- **Tests:** Vitest (27 tests), Playwright (4 E2E tests)
- **Lint/Format:** Biome 2.5
- **PWA:** Service Worker + Web Manifest

## Commands
- `pnpm start` — `node src/index.js` (port 3000)
- `pnpm lint` / `pnpm format` — Biome
- `pnpm test` — Vitest
- `pnpm test:e2e` — Playwright
- `pnpm validate` — lint + test

## Structure
- `src/` — `index.js`, `server.js`, `weather-service.js`, `cache.js`, `circuit-breaker.js`, `logger.js`, `live-reload.js`
- `netlify/functions/` — serverless API (`weather.js`, `geocode.js`)
- `scripts/` — frontend app modules (`app.mjs`, `switcher.js`, `skycons.js`)
- `style/` — CSS stylesheets
- `assets/` — icons and Open Graph images
- `tests/` — unit & integration tests (7 test files)
- `e2e/` — Playwright smoke tests

## Conventions
- CommonJS for Node backend, native ESM for frontend and tests
- Minimal dependencies (Hono + dotenv + Sentry)
- Netlify deploy with `netlify.toml`
- Live-reload middleware in dev mode
