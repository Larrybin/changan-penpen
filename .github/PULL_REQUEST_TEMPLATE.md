## Summary

> ℹ️ 请在提交前通读我们的 [贡献指南](../docs/contributing.md) 与 [代码风格规范](../docs/style-guide.md)，确保 PR 与团队约定保持一致。

- What changed and why?
- Screenshots/GIFs (for UI), logs for CI/deploy if relevant.

## Checklist

- [ ] Lint/typecheck/build checks pass locally（`pnpm check:all`，或 `pnpm biome:check && pnpm typecheck && pnpm build` 并设置必要的环境变量）
- [ ] Related docs updated (list files):
  - [ ] README.md (if scripts/workflows/quickstart changed)
  - [ ] docs/00-index.md (if docs added/renamed)
  - [ ] docs/local-dev.md (if scripts/tools changed)
  - [ ] docs/env-and-secrets.md (if `.dev.vars.example`/`wrangler.jsonc` changed)
  - [ ] docs/ci-cd.md (if `.github/workflows/*.yml` changed)
  - [ ] docs/api-index.md (if routes/pages/API/middleware changed)
  - [ ] docs/db-d1.md (if migrations workflow changed)

## Notes for Reviewers

- Breaking changes / rollout plan
- Health/monitoring updates
