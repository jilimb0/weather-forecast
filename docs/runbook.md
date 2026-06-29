# Weather Forecast — Production Runbook

## Architecture

- **Backend:** Express 5 (dev) / Netlify Functions (production)
- **Frontend:** Vanilla JS SPA with ARIA a11y
- **API Source:** OpenWeather (weather + forecast endpoints)
- **PWA:** Service Worker + Web Manifest
- **Testing:** Vitest (unit/integration), Playwright (E2E)
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

- Health endpoint: `GET /health` — returns `{ ok, timestamp, checks }`
- Sentry error tracking (when `SENTRY_DSN` is configured)
- Structured logging via logger (ISO timestamps, level prefixes)

## Troubleshooting

### Server won't start
1. Check `OPENWEATHER_API_KEY` is set in `.env`
2. Verify the key works: `curl http://localhost:3000/health`
3. Check logs for errors

### Weather API returns 500
1. Verify your OpenWeather API key is valid and not rate-limited
2. Check the server logs for error details
3. If using Netlify, check function logs in Netlify dashboard

### Rate limiting
- Local server: 60 requests/minute per IP (in-memory)
- Netlify: rate limit state is lost on cold starts
- Clear your in-memory cache by restarting the server
