# ADR 0001: Use Netlify Functions for Weather API

## Status
Accepted (See `.ai/adr/0003-hono-and-netlify-functions-runtime.md` for current unified runtime architecture)

## Decision
Use Netlify Functions as the production backend runtime for weather proxy and normalization logic, alongside Hono for local and container development.

## Rationale
- Aligns with existing deployment target.
- Keeps API key server-side.
- Simplifies operations for a single public app.
- Supports edge-distributed execution and simple rollout/rollback.

## Consequences
- Runtime is serverless and may cold start.
- In-memory cache/rate-limit state is best-effort per warm instance.
