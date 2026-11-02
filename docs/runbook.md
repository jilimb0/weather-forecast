# Weather Forecast — Production Runbook

## Architecture

- **Backend:** Hono (dev/container) / Netlify Functions (production)
- **Frontend:** Vanilla JS SPA with ARIA a11y & Service Worker PWA
- **API Source:** OpenWeather (weather + forecast endpoints normalized)
- **Fault Tolerance:** Circuit Breaker (`src/circuit-breaker.js`) + 2-tier Stale-While-Revalidate cache (`src/cache.js`)
- **PWA:** Service Worker + Web Manifest
- **Testing:** Vitest (unit/integration, 27 tests), Playwright (E2E)
- **CI:** GitHub Actions (lint + test + Lighthouse CI)
- **Deploy:** Netlify (Git-based)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENWEATHER_API_KEY` | Yes | OpenWeather API key |
| `PORT` | No | Server port (default: 3000) |
| `SENTRY_DSN` | No | Sentry error tracking DSN |
| `LOG_LEVEL` | No | Logger level (debug/info/warn/error) |
| `DEFAULT_LAT` | No | Default latitude (default: 41.7151) |
| `DEFAULT_LON` | No | Default longitude (default: 44.8271) |

## Deployment

### Local development
```bash
cp .env.example .env
# Edit .env with your OPENWEATHER_API_KEY
pnpm install
pnpm start
```

### Docker
```bash
docker compose up -d
```

### Netlify production
Set `OPENWEATHER_API_KEY` and `SENTRY_DSN` in Netlify dashboard environment variables. Deploy from `main` branch with build command `pnpm install --frozen-lockfile` and publish directory `.`.

## Monitoring

- Health endpoints: `GET /health`, `GET /healthz` — returns `{ ok, timestamp, checks }`
- Sentry error tracking with header sanitization (when `SENTRY_DSN` is configured)
- Structured logging via logger (ISO timestamps, level prefixes, `requestId`)
- Correlation ID tracking: `X-Correlation-ID` header injected on responses

## Troubleshooting

### Server won't start
1. Check `OPENWEATHER_API_KEY` is set in `.env`
2. Verify the key works: `curl http://localhost:3000/health`
3. Check logs for errors

### Weather API returns 500/502
1. Verify your OpenWeather API key is valid and not rate-limited
2. Check if circuit breaker is `OPEN` (resets to `HALF_OPEN` after 20 seconds)
3. Check server logs for error details (`UPSTREAM_UNAVAILABLE`, `RATE_LIMITED`)
4. If using Netlify, check function logs in Netlify dashboard

### Rate limiting & Cache
- Local server: 60 requests/minute per IP (in-memory)
- Resilient Cache: 5 min fresh TTL, 24-hour stale fallback
- Geocoding Cache: 24-hour TTL with 7-day stale fallback
- Clear in-memory cache by restarting the server
