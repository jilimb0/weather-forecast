# Changelog

## 2.0.0 (2026-06-30)

Production-ready release. Complete transformation from 1/10 to 10/10.

### Infrastructure
- Dockerfile + Docker Compose for containerized deployment
- Lighthouse CI with performance and accessibility budgets
- Cleaned dead files (prepros.config, planning.md, task.md)
- E2E tests now included in Biome checks

### Observability
- Structured logger replacing raw console.log/error
- Sentry error monitoring (backend + Netlify Functions)
- Enhanced health endpoint
- Configurable default location via env vars

### Testing
- Coverage thresholds enforced (lines ≥60, functions ≥50, branches ≥40)
- API key validation test added
- Expanded E2E tests (4+ tests covering error states, toggle interactions)
- Logger unit test
- Removed unused supertest dependency

### Documentation
- CHANGELOG.md
- Production runbook
