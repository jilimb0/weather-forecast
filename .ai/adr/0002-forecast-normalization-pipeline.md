# ADR-0002: Forecast Normalization Pipeline (/weather + /forecast)

**Status:** Accepted  
**Date:** 2026-10-30  
**Deciders:** Core Engineering Team  
**Applies-To:** `src/weather-service.js`, `netlify/functions/weather.js`, `tests/**`  
**Supersedes:** None  
**Overrides-Global:** None  

## Y-Summary
In the context of weather data aggregation (`src/weather-service.js`), facing inconsistent access and subscription restrictions on the OpenWeather OneCall API (`/onecall`), we decided to **aggregate and normalize standard `/weather` (current) and `/forecast` (5-day/3-hour) endpoints into a stable v2 contract (`location`, `current`, `hourly`, `daily`, `meta`)**, rejecting proprietary `/onecall` payloads to ensure zero-cost plan compatibility and resilient frontend consumption.

## Context and Problem Statement
OpenWeather's `/onecall` API endpoint requires a paid subscription tier or explicit payment method attachment, which led to production access failures when using standard API keys. The frontend client requires a consistent contract covering current conditions, hourly breakdowns (next 24 hours), and daily summaries (5 days) without exposing upstream schema shifts or provider lock-in.

## Decision Drivers
- Free/standard OpenWeather API key compatibility across environments.
- Predictable frontend contract independent of upstream payload mutations.
- Efficient client-side parsing without complex transformation logic in UI components.

## Imperative Constraints for AI Agents (MUST / MUST NOT)
- **MUST:** Aggregate daily forecasts by picking noon entries (`pickNoonEntry`) and deriving minimum/maximum temperatures across 3-hour intervals (`aggregateDay`).
- **MUST:** Adhere strictly to the v2 normalized schema: `location`, `current`, `hourly` (first 8 entries = 24h), `daily` (next 5 days), `meta`.
- **MUST:** Keep coordinates rounded to 2 decimals in responses and cache keys for privacy (`roundCoord`).
- **MUST NOT:** Depend on `/onecall` or introduce paid API endpoint requirements.
- **DO NOT RE-INTRODUCE:** Passing unnormalized upstream JSON structures directly to the client.

## Considered Options & Rejected Alternatives
1. **Option 1 (Chosen): Normalized Schema from `/weather` + `/forecast` Endpoints**
   - *Why chosen:* Fully accessible on free/standard API keys; provides all required metrics with robust client guarantees.
2. **Option 2 (Rejected — DO NOT PROPOSE): Direct dependency on `/onecall` 3.0 API**
   - *Why rejected:* Causes `401 Unauthorized` or `402 Payment Required` on accounts without paid billing attached.

## Consequences & Trade-offs
- **Positive:** Works out of the box with standard API keys; UI components consume a stable, unified model.
- **Negative / Cost:** Daily summaries must be synthesized from 3-hour forecast buckets, requiring dedicated aggregation unit tests.

## Verification Gate
- **Check Command:** `pnpm test`
- **Code Anchors:** `src/weather-service.js` (`normalizeWeatherPayload`, `aggregateDay`, `pickNoonEntry`), `tests/netlify-function.test.mjs`, `tests/server.test.mjs`
