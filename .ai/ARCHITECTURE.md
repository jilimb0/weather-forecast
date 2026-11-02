# Architecture: weather-forecast

## 1. Identity & Domain
weather-forecast — Resilient offline-first weather forecasting progressive web application with geolocation radar.
- **Status:** active
- **Remote:** `https://github.com/jilimb0/weather-forecast.git`
- **Default Branch:** `main`

## 2. Stack & Runtime
- **Runtime:** Vanilla JavaScript (CommonJS for Node backend, native ESM for frontend & tests), Hono, Netlify Functions, Biome, Playwright, Vitest, Service Workers.
- **Directories:** `src`, `netlify/functions`, `scripts`, `style`, `tests`, `e2e`, `assets`

## 3. Structural Invariants
- Never fail UI render when external weather APIs are offline (fallback to cached forecasts).
- All geocoding lookups must be throttled with client-side debounce and cache.
- `src/` core rendering logic must remain zero-dependency and lightweight.

## 4. Data Flows & External Boundaries
- Inbound requests are validated at perimeter boundaries using strict schemas.
- Outbound third-party calls must employ timeouts, retries with backoff, and circuit breakers.
- Zero secrets or unredacted customer PII in logs or storage snapshots.

## 5. Active ADRs
- **[ADR-0001](.ai/adr/0001-openweather-circuit-breaker-and-stale-while-revalidate.md)** (`src/**`, `tests/**`, overrides `GLOBAL-TS-01`): Zero-dependency ES modules (`src/*.js`), OpenWeather Circuit Breaker (`src/circuit-breaker.js`), 5m/24h Stale-While-Revalidate cache (`src/cache.js`), and 24h geocoding cache.
- **[ADR-0002](.ai/adr/0002-forecast-normalization-pipeline.md)** (`src/weather-service.js`, `netlify/functions/**`, `tests/**`): Normalized v2 weather payload from standard OpenWeather `/weather` + `/forecast` endpoints, rejecting `/onecall`.
- **[ADR-0003](.ai/adr/0003-hono-and-netlify-functions-runtime.md)** (`src/server.js`, `src/index.js`, `netlify/functions/**`, `tests/**`): Hono standalone/container server and serverless Netlify Functions with shared core handlers and uniform defensive security headers.
