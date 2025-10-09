# Contributing Guide

Thank you for your interest in the project! Please follow these steps to keep collaboration smooth and high‑quality.

## 1) Workflow
1. Create a branch (e.g., `feature/<topic>` or `fix/<issue-id>`). Keep it focused and short‑lived.
2. Sync latest `main` before you branch and before opening a PR.
3. Develop and validate locally (see `docs/local-dev.md`).
4. Run local quality gates: `pnpm check:all && pnpm test && pnpm build`.
5. Open a PR with a clear description, screenshots for UI, and links to issues.

## 2) Coding Standards
- TypeScript‑first. Components use PascalCase; variables/functions use camelCase.
- Run `pnpm lint` (Biome) before committing. Use 4‑space indent and double quotes.
- Keep modules domain‑driven under `src/modules/<feature>`.

## 3) Commits & PRs
- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:` …
- Keep small, self‑contained commits. Reference issues (e.g., `Fixes #123`).
- PRs must pass CI and include docs updates for user‑visible or ops changes.

## 4) Local Checks
- `pnpm biome:check` and `pnpm typecheck` should pass before pushing.
- Run `pnpm test` for the affected modules; add tests for critical logic.
- If you changed Cloudflare bindings or env keys, run `pnpm cf-typegen` to refresh `cloudflare-env.d.ts` (or `pnpm typecheck`, which includes it).

## 5) Tests
- Prefer Vitest; co‑locate tests as `*.test.ts(x)`.
- Deterministic tests only; mock D1/R2 and network calls.
- Include `pnpm test` output in the PR description for complex changes.

## 6) Docs
- Update `docs/00-index.md` when adding new docs.
- Keep deployment/i18n/security docs accurate; they are the runbook.

## 7) Security & Secrets
- Never commit secrets. Use Wrangler secrets in production.
- After adding bindings or secrets, run `pnpm cf-typegen`.

## 8) Reviews
- Be kind, specific, and actionable. Suggest improvements with examples.
- Maintainers may request splitting large PRs into smaller ones.

