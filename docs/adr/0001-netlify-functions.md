# ADR 0001: Use Netlify Functions for Weather API

## Status
Accepted

## Decision
Use Netlify Functions as the production backend runtime for weather proxy and normalization logic.

## Rationale
- Aligns with existing deployment target.
- Keeps API key server-side.
- Simplifies operations for a single public app.
- Supports edge-distributed execution and simple rollout/rollback.

## Consequences
- Runtime is serverless and may cold start.
- In-memory cache/rate-limit state is best-effort per warm instance.
