# Dependency Upgrade Log

> Track manual verification for dependency bumps, especially UI primitives (Radix UI), Tailwind, and other shared client bundles.

## How to Use This Log
1. Create or update an entry whenever `dependencies`-labelled PRs change shared UI/runtime packages.
2. Summarize validation steps (lint/build, `pnpm run test:ui-regression`, manual a11y checks, screenshots) and attach evidence links.
3. Note any follow-up tasks (design token tweaks, additional tests, docs) so the next upgrade can fast-track verification.
4. Include a quick note on manual Radix smoke checks you ran (Select keyboard loop, Dialog focus trap, form submit, Toast stacking) and link supporting screenshots when available.

## Template
```
### YYYY-MM-DD – <Package or Group>
- PR: <link or ID>
- Upstream release notes / breaking changes: <link>
- Manual checks:
  - `pnpm lint && pnpm build`
  - `pnpm run test:ui-regression`
  - `pnpm run analyze:bundle`
  - Additional smoke (e.g., manual Dialog/Select keyboard loop, screenshots URL)
- Impact summary: <new props, removed APIs, styling diffs>
- Follow-up: <docs to refresh, components to revisit>
```

## 2025
- _No dependency upgrade entries logged yet. Add one when the next Radix/Tailwind/etc. bump lands._
