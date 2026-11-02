# Engineering Conventions: weather-forecast

## 1. Code Standards & JavaScript
- Pure JavaScript (CommonJS for Node backend, native ESM with explicit file extensions for frontend and tests). JSDoc typing for editor guidance.
- Strict linting and formatting enforced via Biome.
- No unhandled promise rejections; explicit error propagation and status mapping on public APIs.

## 2. Error Handling & Resilience
- Errors must be typed and mapped to domain exceptions at boundary layers via `mapApiError`.
- Do not suppress unexpected errors with empty `catch` blocks.
- External API integrations require exponential backoff with full jitter and timeout budgets.

## 3. Logging & Privacy Baseline
- Zero PII (Personally Identifiable Information) in application logs.
- Redact authorization tokens, API keys, and sensitive payload parameters.
- Sanitize coordinates to 2 decimal places before caching or logging.
- Use structured JSON logging in production environments.

## 4. Testing & Anti-Patterns
- TDD-first: new features and bug fixes must be accompanied by unit or integration tests.
- Do not mock what you do not own without contract verification.
- Avoid speculative architectural abstractions; keep components single-purpose.
