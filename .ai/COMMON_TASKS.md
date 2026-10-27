# Common Development Tasks: weather-forecast

## 1. Standard Commands
- **Start dev:** `pnpm dev` — Starts local development server.
- **Run tests:** `pnpm test` — Executes client and API mock test suite.
- **Lint code:** `pnpm lint` — Runs Biome linter.
- **Build app:** `pnpm build` — Builds static assets bundle.

## 2. Recipe: Adding a New Feature
1. Review requirements against invariants in `.ai/ARCHITECTURE.md`.
2. Write a failing test in test directory verifying expected behavior.
3. Implement minimal clean code to satisfy the test.
4. Run `pnpm test` and `pnpm lint`.
5. Run `pnpm build` to ensure code style compliance.

## 3. Recipe: Fixing a Bug
1. Reproduce defect with an automated regression test.
2. Verify test failure matches reported symptoms.
3. Apply targeted fix without modifying unrelated code.
4. Verify all tests pass with `pnpm lint`.
