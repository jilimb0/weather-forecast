# Weather Forecast

Production-ready weather forecast app with Express backend, serverless Netlify Functions, and PWA support. Fetches from OpenWeather API.

## Tech Stack
- **Language:** JavaScript (CommonJS)
- **Backend:** Express 5
- **Serverless:** Netlify Functions
- **Tests:** Vitest, Playwright (E2E)
- **Lint/Format:** Biome 2
- **PWA:** Service Worker + Web Manifest

## Commands
- `pnpm start` — `node src/index.js` (port 3000)
- `pnpm lint` / `pnpm format` — Biome
- `pnpm test` — Vitest
- `pnpm test:e2e` — Playwright

## Structure
- `src/index.js`, `server.js`, `weather-service.js`, `live-reload.js`
- `netlify/functions/` — serverless API
- `public/` — static assets + PWA

## Conventions
- CommonJS throughout
- Minimal dependencies (Express + dotenv)
- Netlify deploy with `netlify.toml`
- Live-reload middleware in dev mode
