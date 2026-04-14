# ADR 0002: Normalize from /weather + /forecast (not /onecall)

## Status
Accepted

## Decision
Build v2 payload by combining OpenWeather `/weather` and `/forecast` endpoints.

## Rationale
- `/onecall` availability varies by plan and caused production failures.
- `/forecast` is broadly available and sufficient for hourly + 5-day views.
- Normalization creates a stable frontend contract independent of upstream differences.

## Consequences
- Daily view is aggregated from 3-hour buckets.
- Noon selection and min/max derivation logic must be tested.
