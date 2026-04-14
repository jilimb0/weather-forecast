# Planning

## Goal
Ship a production-grade weather app with modern UI, hardened serverless API, and PWA offline support.

## Architecture Decisions
- Netlify Functions remain runtime for production weather API.
- OpenWeather `/weather` + `/forecast` are normalized into stable v2 contract.
- In-memory cache and per-IP rate limiting reduce upstream pressure.
- Frontend uses global unit state and offline fallback from last payload.

## Task Breakdown
1. Harden backend with validation, retries, cache, rate-limits, and error mapping.
2. Extend payload contract to location/current/hourly/daily/meta.
3. Rebuild frontend into editorial hero, hourly, daily, metrics, and resilient states.
4. Add PWA manifest, icons, and service worker caching strategy.
5. Add frontend tests and update CI quality gates.
6. Add ADRs and release checklist for maintainability and deployment safety.

## Risks
- Serverless in-memory cache/rate limits are best-effort per warm instance.
- Upstream weather provider limits can still affect availability.
- PWA behavior may vary across browsers and install contexts.
