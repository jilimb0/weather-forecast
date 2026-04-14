# ADR 0003: Add in-memory cache and per-IP rate limiting

## Status
Accepted

## Decision
Implement short TTL in-memory response cache and lightweight per-IP request limiting in weather service runtime.

## Rationale
- Reduces upstream API pressure and latency.
- Protects service from accidental spikes.
- Improves user-perceived reliability with stale-while-revalidate headers.

## Consequences
- Cache and limit counters are instance-local in serverless runtime.
- Controls are best-effort and complemented by platform-level protections.
