# Task Tracking

## Phase
VALIDATE MODE

## Completed
- Migrated package manager from npm to pnpm and removed npm/yarn lockfiles.
- Integrated Biome linting and formatting scripts.
- Added shared weather service logic (`src/weather-service.js`).
- Added Netlify Function endpoint (`netlify/functions/weather.js`).
- Added Netlify redirect config (`netlify.toml`).
- Updated frontend to call `/api/weather` for both local and Netlify deploys.
- Kept local Express server path for local dev.
- Added tests for Express handler and Netlify function.
- Updated README with exact Netlify settings.

## Open Blockers
- None.
