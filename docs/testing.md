# Testing Strategy

>This repository uses Vitest for unit and component tests and runs them in CI. This guide describes the current setup, conventions, and practical tips to keep features regression‑safe.

## 1) Current Setup
- Test runner: Vitest 3 (`vitest`)
- Assertions: `@testing-library/jest-dom` (enabled in `vitest.setup.ts` via `@testing-library/jest-dom/vitest`)
- Component tests: `@testing-library/react`
- DOM environment: `jsdom`
- Config: `vitest.config.ts` sets `environment: "jsdom"`, `setupFiles: "./vitest.setup.ts"`, `globals: true`, and alias `@ -> src`
- Example tests: see `src/modules/**/__tests__/` and other module tests
- CI: `.github/workflows/ci.yml` includes a “Test (Vitest)” step (`pnpm test`)

## 2) Recommended Tools & Conventions
- Runner: Vitest (fast, Vite‑friendly)
- Assertions: `@testing-library/jest-dom`
- Components: `@testing-library/react` with `user-event`
- Mocks: prefer `vi.mock()` at the module boundary; for network use light `fetch` stubs or `msw` when needed
- File placement: co‑locate tests with sources and name them `*.test.ts` / `*.test.tsx`

## 3) Commands
```bash
pnpm test                  # one‑off run
pnpm test -- --watch       # watch mode
pnpm test -- -u            # update snapshots (if any)
pnpm test -- --coverage    # coverage (enabled in config where applicable)
```

## 4) Test Layers
| Type | Scope | Guidance |
| --- | --- | --- |
| Unit | pure functions / utils / hooks | Vitest + mocks; avoid real external deps |
| Component | UI components / forms | RTL (`render`/`screen`/`user-event`); keep snapshots minimal for structure only |
| Server Action | `src/modules/*/actions` | Mock boundaries (Auth, D1/R2, Workers AI) with `vi.mock()` |
| Integration (optional) | API routes | Call the handler directly; add adapters only if needed |

## 5) Mocking Guidelines
- D1: in‑memory SQLite (e.g., `better-sqlite3`) or a small factory (`createTestDb()`)
- R2: in‑memory map for `get`/`put`
- Workers AI: return fixed payloads; don’t hit real endpoints
- Auth: centralize fake sessions and contexts under `tests/fixtures/`
- Cloudflare env: mock `@opennextjs/cloudflare` helpers when needed
- Next APIs: mock `next/navigation` (`redirect`) and `next/headers` (`cookies`) where needed

## 6) Coverage
Coverage is configured in `vitest.config.ts`.

```ts
coverage: {
  enabled: true,
  provider: "v8",
  reporter: ["text", "html", "json-summary"],
  reportsDirectory: "coverage",
  all: true,
  include: [
    "src/modules/**/*.{ts,tsx}",
    "src/services/**/*.{ts,tsx}",
    "src/lib/**/*.{ts,tsx}",
    "src/app/**/route.ts",
  ],
  exclude: [
    "**/__tests__/**",
    "src/**/?(*.)test.ts?(x)",
    "src/modules/**/mocks/**",
    "src/modules/**/stories/**",
    "src/lib/stubs/**",
    "**/*.page.tsx",
    "**/*.layout.tsx",
    "**/*.d.ts",
  ],
  thresholds: {
    lines: 3,
    statements: 3,
    branches: 10,
    functions: 10,
  },
}
```

Notes:
- Coverage output: text summary in console, full HTML under `coverage/`.
- We commit `coverage/coverage-summary.json` only (see `.gitignore`), not the full HTML output.
- If using `better-sqlite3` fixtures locally, remember `pnpm rebuild better-sqlite3` to compile native bindings.

## 7) Roadmap
- Now: examples exist for auth UI and core service utilities.
- Near term: unit tests for critical Server Actions and core `utils`.
- Mid term: module‑level integration tests, error paths, and permissions.
- Long term: selective E2E (Playwright) for health checks and key user journeys.

## 8) Troubleshooting
- `ReferenceError: Request is not defined`: Node test env lacks Workers APIs; polyfill at use sites or mock in tests.
- Can’t find component selectors: use accessibility queries (`getByRole`, `getByLabelText`).
- Flaky/large snapshots: reduce; prefer explicit assertions on structure and text.

---

When adding features, include or update tests and paste `pnpm test` output in the PR description (CI runs it automatically).

