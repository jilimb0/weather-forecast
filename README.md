# Weather Forecast Pro (v2)

Production-ready weather application with a modern editorial-glass UI, Netlify Function backend, and PWA offline support.

## What this version includes

- Stable public API contract at `GET /api/weather?lat={number}&lon={number}`
- V2 normalized weather payload:
  - `location`
  - `current`
  - `hourly` (next 24h in 3h slots, first 8 entries)
  - `daily` (next 5 days)
  - `meta`
- Netlify Function runtime hardening:
  - coordinate validation (`400`)
  - upstream rate-limit mapping (`429`)
  - upstream unavailability mapping (`502`)
  - internal fallback (`500`)
  - request-id aware structured logging
  - short-lived in-memory hot cache
  - per-IP rate limiting
  - timeout + retry with jitter
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

- `pnpm start` - local server
- `pnpm lint` - Biome checks
- `pnpm format` - Biome fix/write
- `pnpm test` - unit + integration + frontend tests
- `pnpm test:e2e` - playwright smoke test

## Architecture decisions

See ADRs:

- `docs/adr/0001-netlify-functions.md`
- `docs/adr/0002-forecast-normalization.md`
- `docs/adr/0003-caching-rate-limiting.md`
