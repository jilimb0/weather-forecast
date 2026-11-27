# Changelog

## 2.1.0 (2026-10-30)

Resilience hardening, server migration to Hono, and architecture governance.

### Resilience & Architecture
- Stateful OpenWeather Circuit Breaker (`src/circuit-breaker.js`) with half-open probe recovery
- 2-tier Stale-While-Revalidate caching (`src/cache.js`, 5m fresh / 24h stale fallback)
- 24-hour geocoding cache with client-side debounce
- Full Jitter exponential backoff on upstream weather fetch
- Formalized Agent-Optimized Architecture Decision Records (`.ai/adr/`)

### Server & Security
- Migrated standalone Node runtime from Express 5 to Hono (`@hono/node-server`)
- Added internal B2B weather anomaly feed (`GET /api/v2/b2b/anomaly`) computing deterministic integer basis-point telemetry (`precipitationMmPerHourBps`, `windSpeedMsBps`, `weatherAnomalyFactorBps` in `6500..10000`, `isWeatherCacheStale`, and 2-decimal coordinate rounding) for `BA` and `C&TLab`
- Uniform defensive security headers (CSP, X-Content-Type-Options, X-Frame-Options, Permissions-Policy, Referrer-Policy)
- Request-ID and X-Correlation-ID end-to-end tracing
- Sentry header and query parameter redaction
- Geolocation coordinate sanitization (2 decimal places) for user privacy

### Testing & SEO
- Vitest test suite expanded to 27 tests across 7 test files
- Rich structured data (Schema.org JSON-LD `@graph`) and `llms.txt`
- Canonical URL alignment for Netlify production

## 2.0.0 (2026-06-30)

Production-ready release. Complete transformation from 1/10 to 10/10.

### Infrastructure
- Dockerfile + Docker Compose for containerized deployment
- Lighthouse CI with performance and accessibility budgets
- Cleaned dead files (prepros.config, planning.md, task.md)
- E2E tests now included in Biome checks

### Observability
- Structured logger replacing raw console.log/error
- Sentry error monitoring (backend + Netlify Functions)
- Enhanced health endpoint
- Configurable default location via env vars

### Testing
- Coverage thresholds enforced (lines ≥60, functions ≥50, branches ≥40)
- API key validation test added
- Expanded E2E tests (4+ tests covering error states, toggle interactions)
- Logger unit test
- Removed unused supertest dependency

### Documentation
- CHANGELOG.md
- Production runbook
