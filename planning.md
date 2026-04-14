# Planning

## Goal
Ship a portfolio-ready weather app that deploys cleanly on Netlify without exposing API secrets in client code.

## Architecture Decisions
- Keep vanilla frontend for simplicity and readability.
- Use shared weather service logic for both local Express and Netlify Function runtimes.
- Route frontend requests through `/api/weather` and map to Netlify Function via redirects.
- Keep OpenWeather API key only in environment variables.

## Task Breakdown
1. Create reusable weather service module.
2. Add Netlify Function endpoint.
3. Keep local Express server for local development.
4. Add Netlify config and deployment docs.
5. Add automated tests for Netlify function behavior.

## Risks
- OpenWeather One Call endpoint availability depends on account tier.
- Package manager is standardized on pnpm with Biome linting in CI.
- Browser geolocation permissions can be denied by end users.
