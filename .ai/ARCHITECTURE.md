# Architecture: weather-forecast

## 1. Identity & Domain
weather-forecast — Resilient offline-first weather forecasting progressive web application with geolocation radar.
- **Status:** active
- **Remote:** `https://github.com/jilimb0/weather-forecast.git`
- **Default Branch:** `main`

## 2. Stack & Runtime
- **Runtime:** Vanilla TypeScript, Hono, Biome, Playwright, Vitest, Service Workers.
- **Directories:** `src`, `scripts`, `tests`, `assets`

## 3. Structural Invariants
- Never fail UI render when external weather APIs are offline (fallback to cached forecasts).
- All geocoding lookups must be throttled with client-side debounce and cache.
- `src/` core rendering logic must remain zero-dependency and lightweight.

## 4. Data Flows & External Boundaries
- Inbound requests are validated at perimeter boundaries using strict schemas.
- Outbound third-party calls must employ timeouts, retries with backoff, and circuit breakers.
- Zero secrets or unredacted customer PII in logs or storage snapshots.
