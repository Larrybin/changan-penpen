# Local & CI Quality Gates

## Local push self-check (`pnpm push`)
Execution order:
1. Cloudflare type generation (`pnpm cf-typegen`)
2. Biome auto-fix (`biome check . --write --unsafe`)
3. TypeScript type check (`tsc --noEmit`)
4. Unit tests with coverage (Vitest)
5. Docs consistency and link checks (`check:docs`, `check:links`)
6. Final Biome check (read-only)
7. Auto-generate commit message, rebase, push

Environment toggles:
- `SKIP_TESTS=1 pnpm push` — skip unit tests (emergency only; revert before merging)
- `SKIP_DOCS_CHECK=1 pnpm push` — skip docs checks (emergency only)
- `FORCE_NEXT_BUILD=1 pnpm push` — force Next.js build on Windows (default is skipped)

## CI checks
- SonarCloud (`.github/workflows/sonarcloud.yml`): consumes `coverage/lcov.info` to aggregate coverage and quality.

Required configuration:
- GitHub Secrets:
  - `SONAR_TOKEN` (SonarCloud access token)
- GitHub Actions Variables:
  - `SONAR_PROJECT_KEY`, `SONAR_ORG`
- `sonar-project.properties`: optionally set `sonar.projectKey` and `sonar.organization` (or rely on workflow vars)

## Common commands
- `pnpm test` — run unit tests and generate coverage
- `pnpm push` — run the full local quality gate, then push (recommended)

