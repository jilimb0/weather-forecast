# ADR-0003: Unified Hono and Netlify Functions Runtime Architecture

**Status:** Accepted  
**Date:** 2026-10-30  
**Deciders:** Core Engineering Team  
**Applies-To:** `src/server.js`, `src/index.js`, `netlify/functions/**`, `tests/**`  
**Supersedes:** None  
**Overrides-Global:** None  

## Y-Summary
In the context of local server and serverless API routing (`src/server.js`, `src/index.js`, `netlify/functions/`), facing legacy footprint overhead and middleware divergence of Express 5, we decided to **migrate the local and Docker container server to Hono (`@hono/node-server`) while keeping serverless Netlify Functions backed by shared core handlers (`src/weather-service.js`)**, achieving a lightweight Web-Standards-aligned HTTP runtime with unified defensive security headers and request-id correlation.

## Context and Problem Statement
The application runs in two target environments: local/container development (Node.js runtime on port 3000) and production deployment (Netlify Functions with static asset CDN). Previously, Express 5 was used for local development, creating middleware and handler divergence between local Node and production serverless lambdas.

## Decision Drivers
- Lightweight memory footprint and near-zero overhead.
- Alignment with Fetch API / Web Standards.
- Shared business logic and handlers between serverless functions and standalone Node server.
- Uniform defensive HTTP headers (CSP, nosniff, DENY, Permissions-Policy) and correlation ID tracing across all environments.

## Imperative Constraints for AI Agents (MUST / MUST NOT)
- **MUST:** Keep core domain logic, normalization, rate limiting, circuit breaker, and caching in `src/weather-service.js` so both Hono (`src/server.js`) and Netlify (`netlify/functions/*.js`) invoke identical handlers (`createWeatherHandler`, `createGeocodeHandler`).
- **MUST:** Enforce defensive security headers (`Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: geolocation=(self)`) and `X-Correlation-ID` header injection.
- **MUST:** Provide dual health check endpoints (`GET /health` and `GET /healthz`) returning JSON status `{ ok: true, timestamp, checks }`.
- **MUST NOT:** Re-introduce Express or non-standard legacy middleware packages.
- **DO NOT RE-INTRODUCE:** Environment-specific divergence in weather error mapping or response contracts.

## Considered Options & Rejected Alternatives
1. **Option 1 (Chosen): Hono for Standalone Server + Netlify Functions with Shared Handlers**
   - *Why chosen:* Tiny footprint, zero deprecation friction, Fetch-API native, passes all server unit and integration tests.
2. **Option 2 (Rejected — DO NOT PROPOSE): Express 5 Standalone Server**
   - *Why rejected:* Slower cold starts, legacy Node HTTP abstractions incompatible with Fetch API standards, higher package footprint.

## Consequences & Trade-offs
- **Positive:** Single unified request/response abstraction across local and serverless execution; sub-millisecond route handling.
- **Negative / Cost:** Minimal adapter wrapper in `src/server.js` to handle both Hono Context (`c`) and legacy Express-style `(req, res)` if called in test harnesses.

## Verification Gate
- **Check Command:** `pnpm test && pnpm lint`
- **Code Anchors:** `src/server.js`, `src/index.js`, `netlify/functions/weather.js`, `netlify/functions/geocode.js`, `tests/server.test.mjs`
