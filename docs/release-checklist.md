# Release Checklist

## Staging/Preview Validation

- Build succeeds in preview deployment.
- `pnpm lint` passes.
- `pnpm test` passes.
- Weather API returns valid v2 payload.
- UI renders hero, hourly, daily, and metrics sections.
- Geolocation denied flow falls back to default location.
- Offline fallback shows cached data banner.

## Production Deploy

- `OPENWEATHER_API_KEY` is set in Netlify production environment.
- Deploy from `main` completed successfully.
- Smoke test passed on production URL.

## Post-Deploy Health Checks

- `GET /api/weather` success for valid coordinates.
- Error contract verified for invalid coordinates.
- Request logs include `requestId`.

## Rollback Procedure

- In Netlify dashboard, open Deploys.
- Select the previous successful deploy.
- Click "Publish deploy".
- Re-run smoke checks.
