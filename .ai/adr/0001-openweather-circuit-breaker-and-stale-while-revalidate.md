# ADR-0001: Zero-Dependency Vanilla JS Runtime, OpenWeather Circuit Breaker & Stale-While-Revalidate Cache

**Status:** Accepted  
**Date:** 2026-10-30  
**Deciders:** Core Engineering Team  
**Applies-To:** `src/**`, `tests/**`  
**Supersedes:** None  
**Overrides-Global:** `GLOBAL-TS-01` (Uses zero-build Vanilla JS ES modules in `src/*.js` instead of compiled TypeScript for instant static PWA execution)  

## Y-Summary
In the context of the `weather-forecast` PWA (`src/**`), facing upstream OpenWeather API outages (`429/502/503`) and strict zero-build bundle constraints, we decided for **native ES module JavaScript (`Overrides-Global: GLOBAL-TS-01`), a stateful OpenWeather Circuit Breaker (`src/circuit-breaker.js`), two-tier Stale-While-Revalidate forecast caching (`src/cache.js`, 5m fresh / 24h stale), and 24h geocoding cache**, to guarantee offline/degraded UI availability without build-step bloat, accepting JSDoc/runtime validation instead of `tsc` compilation.

## Context and Problem Statement
`weather-forecast` is deployed as an ultra-lightweight offline-first weather PWA. Upstream OpenWeather API rate limits (`429`) or gateway failures (`502/503`) previously caused cascading request timeouts and blank error screens even when recent forecast data was already in memory.

## Decision Drivers
- Graceful degradation during upstream OpenWeather outages (`GLOBAL-RES-01`, `GLOBAL-RES-02`)
- Zero build-step overhead and zero external UI framework dependencies in `src/`
- Conservation of OpenWeather API quota via 24h geocoding cache and Full-Jitter backoff

## Imperative Constraints for AI Agents (MUST / MUST NOT)
- **MUST:** Route all OpenWeather requests through `src/circuit-breaker.js` (`failureThreshold = 4` within 20s $\rightarrow$ `OPEN`, `recoveryTimeoutMs = 20000` $\rightarrow$ `HALF_OPEN`) and Full-Jitter exponential backoff (`src/weather-service.js`).
- **MUST:** Serve two-tier cached forecasts via `src/cache.js` (`fresh` TTL 5m; `stale` TTL 24h with `meta.stale = true` fallback whenever the Circuit Breaker is `OPEN` or upstream fails).
- **MUST:** Cache city geocoding lookups for 24 hours (`geocodeCache`) and debounce client-side search inputs.
- **MUST NOT:** Do not introduce React, heavy npm bundler dependencies, or break native ES module imports in `src/*.js`.

## Considered Options & Rejected Alternatives
1. **Option 1 (Chosen): Stateful Circuit Breaker + 5m/24h Stale-While-Revalidate Cache + Zero-Dependency ES Modules**
   - *Why chosen:* Delivers instant static loading and 100% UI availability during upstream weather API outages (26/26 Vitest tests passing).
2. **Option 2 (Rejected — DO NOT PROPOSE): Simple 5-minute TTL eviction without stale fallback**
   - *Why rejected:* Returns 502 errors to users if OpenWeather is down when the 5-minute TTL expires.

## Consequences & Trade-offs
- **Positive:** Zero upstream cascading failures and instant fallback to cached weather data.
- **Negative / Cost:** Intentionally overrides `GLOBAL-TS-01` by keeping `src/*.js` in pure ES modules verified by Vitest and Biome.

## Verification Gate
- **Check Command:** `pnpm test && pnpm lint`
- **Code Anchors:** `src/circuit-breaker.js`, `src/cache.js`, `src/weather-service.js`
