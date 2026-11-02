# Common Development Tasks: weather-forecast

## 1. Standard Commands
- **Start dev server:** `pnpm start` — Starts local Hono server (port 3000) with live reload.
- **Run tests:** `pnpm test` — Executes Vitest test suite (`vitest run`).
- **Run watch tests:** `pnpm test:watch` — Vitest interactive watch mode.
- **Run E2E tests:** `pnpm test:e2e` — Executes Playwright end-to-end smoke tests.
- **Lint code:** `pnpm lint` — Runs Biome linter.
- **Format code:** `pnpm format` — Applies Biome format and safe fixes.
- **Validate:** `pnpm validate` — Runs full pre-commit check (`pnpm lint && pnpm test`).

## 2. Recipe: Adding a New Feature
1. Review requirements against invariants in `.ai/ARCHITECTURE.md` and active ADRs.
2. Write a failing unit or integration test in `tests/` verifying expected behavior.
3. Implement minimal clean code to satisfy the test.
4. Run `pnpm validate` (`pnpm lint && pnpm test`).
5. Verify E2E smoke tests pass if UI contracts were modified (`pnpm test:e2e`).

## 3. Recipe: Fixing a Bug
1. Reproduce defect with an automated regression test in `tests/`.
2. Verify test failure matches reported symptoms.
3. Apply targeted fix in `src/`, `netlify/`, or `scripts/` without modifying unrelated code.
4. Verify all tests pass with `pnpm validate`.
