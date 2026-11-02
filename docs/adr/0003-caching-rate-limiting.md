# ADR 0003: Add in-memory cache and per-IP rate limiting

## Status
Superseded by `.ai/adr/0001-openweather-circuit-breaker-and-stale-while-revalidate.md`

## Decision
Initial decision implemented a short 5-minute TTL in-memory response cache and lightweight per-IP request limiting. This has been superseded by a 2-tier Stale-While-Revalidate resilient cache (5m fresh / 24h stale fallback), stateful OpenWeather Circuit Breaker, and 24h geocoding cache defined in `.ai/adr/0001-openweather-circuit-breaker-and-stale-while-revalidate.md`.

## Rationale
- Reduces upstream API pressure and latency.
- Protects service from accidental spikes.
- Improves user-perceived reliability with stale-while-revalidate headers and fallback data during upstream outages.

## Consequences
- Cache and limit counters remain instance-local in serverless runtime.
- Controls are best-effort and complemented by circuit breaker fault tolerance.
