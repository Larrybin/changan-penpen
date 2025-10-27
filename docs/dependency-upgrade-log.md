# Dependency Upgrade Log

> Track manual verification for dependency bumps, especially UI primitives (Radix UI), Tailwind, and other shared client bundles.

## How to Use This Log
1. Create or update an entry whenever `dependencies`-labelled PRs change shared UI/runtime packages.
2. Summarize validation steps（`pnpm biome:check && pnpm typecheck && pnpm build`、manual a11y checks、screenshots）并附上证明链接。
3. Note any follow-up tasks (design token tweaks, additional manual QA, docs) so the next upgrade can fast-track verification.
4. Include a quick note on manual Radix smoke checks you ran (Select keyboard loop, Dialog focus trap, form submit, Toast stacking) and link supporting screenshots when available.

## Template
```
### YYYY-MM-DD – <Package or Group>
- PR: <link or ID>
- Upstream release notes / breaking changes: <link>
- Manual checks:
  - `pnpm biome:check && pnpm typecheck && pnpm build`
  - `pnpm run analyze:bundle`
  - Additional smoke (e.g., manual Dialog/Select keyboard loop, screenshots URL)
- Impact summary: <new props, removed APIs, styling diffs>
- Follow-up: <docs to refresh, components to revisit>
```

## 2025

### 2025-10-27 – pnpm lockfile compatibility
- PR: _pending_ (`fix: rewrite pnpm lockfile for dependabot compatibility`)
- Upstream release notes / breaking changes: [pnpm v9 lockfile format announcement](https://pnpm.io/installation#lockfile)
- Manual checks:
  - `pnpm lint`
  - `pnpm build`
  - `pnpm typecheck`
- Impact summary: Regenerated `pnpm-lock.yaml` with pnpm 8.15.9 and pinned the workspace `packageManager` to keep Dependabot parsing. Verified that lint/build/typecheck workflows succeed without requiring changes to other modules.
- Follow-up: Revisit once Dependabot supports pnpm lockfile v9 so we can upgrade the package manager again.

### 2025-10-28 – pnpm workflow alignment
- PR: _pending_ (`ci: align GitHub Actions with pnpm 8.15.9`)
- Upstream release notes / breaking changes: [pnpm releases](https://github.com/pnpm/pnpm/releases/tag/v8.15.9)
- Manual checks:
  - `pnpm lint`
  - `pnpm build`
  - `pnpm typecheck`
- Impact summary: Updated reusable `setup-node-pnpm` action and all workflows to install pnpm 8.15.9, matching the workspace `packageManager` constraint. Prevents `ERR_PNPM_BAD_PM_VERSION` during CI runs triggered by mismatched pnpm 10 installs.
- Follow-up: When Dependabot supports pnpm lockfile v9, bump the pinned pnpm version across `package.json` and workflow inputs together.
