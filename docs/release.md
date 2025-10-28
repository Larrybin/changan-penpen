# Release & Rollback

> Versioning, release flow, changelog, and rollback strategy.

## Cadence
- Merge features to `main` in small batches; deploy automatically.
- Manual releases: dispatch the Deploy workflow with `production`.
- Major releases require prior validation and plan.

## Versioning & Notes
- 使用 [Changesets](https://github.com/changesets/changesets)：
  - `pnpm changeset` — 为用户可见改动添加条目并选择 semver 级别。
  - `pnpm run release:version` — 消费累积的 changeset，更新 `package.json` 与 `CHANGELOG.md`（由 CI `release.yml` 自动运行）。
  - 合并发布 PR 后，Deploy 工作流会在 Step Summary 中附上最新的 `CHANGELOG` 发布说明，可直接用于发布公告。
- Tag releases if needed (e.g., `v1.2.3`).
- Keep a brief CHANGELOG in PRs or release notes（首选引用 Changesets 自动生成的条目）。

## Rollback
- `wrangler deploy --rollback`.
- Restore D1 snapshots if schema/data changed.

## Checklist
- [ ] CI green (lint/typecheck/build)
- [ ] Migrations reviewed and applied
- [ ] Health checks green（自动 fast；严格模式如执行需确认）
- [ ] Docs updated for user‑visible changes
- [ ] 核对 `services.external_apis` 超时与熔断配置，并同步 Cloudflare/CI 环境变量（详见最新的 `docs/env-and-secrets.md`）

