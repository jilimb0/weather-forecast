# Weather Forecast Pro (v2)

Production-ready weather application with a modern editorial-glass UI, Netlify Function backend, and PWA offline support.

## Monetization & Ecosystem Role

- **Free Zero-Dep Showcase PWA:** Public, dependency-free editorial-glass weather forecast PWA (`index.html`, Vanilla JS + Service Worker) with offline fallback and zero paywall.
- **Internal B2B Weather Anomaly Microservice:** Serves deterministic integer basis-point weather telemetry (`GET /api/v2/b2b/anomaly`) consumed internally by **`BA`** and **`C&TLab`** for pricing, delivery, and demand-anomaly modeling.

## What this version includes

- Stable public API contract at `GET /api/weather?lat={number}&lon={number}`
- Internal B2B weather anomaly feed at `GET /api/v2/b2b/anomaly?lat={number}&lon={number}` (integer basis-point telemetry for `BA` and `C&TLab`)
- V2 normalized weather payload:
  - `location`
  - `current`
  - `hourly` (next 24h in 3h slots, first 8 entries)
  - `daily` (next 5 days)
  - `meta`
- Netlify Function and Hono runtime hardening:
  - coordinate validation (`400`)
  - upstream rate-limit mapping (`429`)
  - upstream unavailability mapping (`502`)
  - internal fallback (`500`)
  - request-id aware structured logging and correlation ID tracing
  - two-tier Stale-While-Revalidate resilient cache (5m fresh / 24h stale)
  - stateful OpenWeather Circuit Breaker with Half-Open probe recovery
  - 24-hour geocoding cache
  - per-IP rate limiting
  - timeout + retry with Full Jitter exponential backoff
- Modern production frontend:
  - hero summary panel
  - hourly strip
  - five-day cards
  - metrics grid
  - global unit toggle persistence
  - geolocation fallback location
  - retry + status banners
- PWA support:
  - install manifest
  - service worker with app-shell cache
  - network-first API caching
  - offline fallback to last successful forecast from local storage
- CI quality gates with pnpm + Biome + Vitest

## API contract

### Request

`GET /api/weather?lat=41.7&lon=44.8`

### Success response

```json
{
  "location": {
    "name": "Tbilisi",
    "country": "GE",
    "timezone": 14400,
    "lat": 41.7,
    "lon": 44.8
  },
  "current": {
    "dt": 1776156348,
    "temp": 11,
    "feelsLike": 9,
    "humidity": 37,
    "wind": { "speed": 5, "deg": 200 },
    "pressure": 1021,
    "visibility": 10000,
    "condition": "Clouds",
    "icon": "03d"
  },
  "hourly": [],
  "daily": [],
  "meta": {
    "fetchedAt": "2026-04-14T09:00:00.000Z",
    "source": "openweather",
    "units": "metric",
    "cacheTtlSec": 300,
    "requestId": "abc123",
    "cacheHit": false
  }
}
```

### Error response

```json
{
  "error": "message",
  "code": "ERROR_CODE",
  "requestId": "abc123"
}
```

### B2B Weather Anomaly Feed (`BA` & `C&TLab`)

`GET /api/v2/b2b/anomaly?lat=41.7151&lon=44.8271`

Returns deterministic integer basis-point (`bps`, `10000` scale) telemetry computed by `computeWeatherAnomalyBps` (`src/weather-service.js`) with 2-decimal coordinate rounding (`latRounded`, `lonRounded`):

```json
{
  "latRounded": 41.72,
  "lonRounded": 44.83,
  "precipitationMmPerHourBps": 125000,
  "precipitationBps": 125000,
  "windSpeedMsBps": 164000,
  "windSpeedBps": 164000,
  "weatherAnomalyFactorBps": 6500,
  "isWeatherCacheStale": false,
  "condition": "Rain",
  "fetchedAt": "2026-04-14T09:00:00.000Z",
  "source": "openweather",
  "requestId": "abc123"
}
```

- `weatherAnomalyFactorBps` is clamped to `6500..10000` (penalizing precipitation > 1.0 mm/h and wind > 8.0 m/s, each capped at 2,500 bps).
- Shares coordinate validation (`400 INVALID_COORDINATE`), rate-limiting (`429`), circuit breaker (`502`), and `Cache-Control` headers with `/api/weather`.

## Local development

1. Install dependencies:

```bash
pnpm install
```

2. Add env file:

```bash
cp .env.example .env
```

3. Set `OPENWEATHER_API_KEY` in `.env`.

4. Run app:

```bash
pnpm start
```

5. Open `http://localhost:3000`.

## Netlify production settings

- Branch: `main`
- Base directory: *(empty)*
- Build command: `pnpm install --frozen-lockfile`
- Publish directory: `.`
- Functions directory: `netlify/functions`
- Required env var: `OPENWEATHER_API_KEY`

`netlify.toml` keeps `/api/weather` as the public route and rewrites to the function.

## Security and ops notes

- API key is server-only (Netlify env variable).
- Security headers configured in `netlify.toml`.
- Release process and rollback documented in `docs/release-checklist.md`.

## Local live reload

When running `pnpm start` on `localhost` or `127.0.0.1`, the app auto-reloads when `index.html`, `scripts/`, `style/`, `src/`, `netlify/`, `manifest.webmanifest`, or `sw.js` change.

## Scripts

- `pnpm start` - local Hono server with live reload
- `pnpm lint` - Biome checks
- `pnpm format` - Biome fix/write
- `pnpm test` - Vitest unit + integration tests (27 tests across 7 suites)
- `pnpm test:e2e` - Playwright smoke tests
- `pnpm validate` - Full verification gate (`pnpm lint && pnpm test`)

## Architecture decisions

Architectural decisions follow the Agent-Optimized ADR protocol and are indexed in `.ai/ARCHITECTURE.md`:

- [ADR-0001: Zero-Dependency Vanilla JS Runtime, OpenWeather Circuit Breaker & Stale-While-Revalidate Cache](.ai/adr/0001-openweather-circuit-breaker-and-stale-while-revalidate.md)
- [ADR-0002: Forecast Normalization Pipeline (/weather + /forecast)](.ai/adr/0002-forecast-normalization-pipeline.md)
- [ADR-0003: Unified Hono and Netlify Functions Runtime Architecture](.ai/adr/0003-hono-and-netlify-functions-runtime.md)
