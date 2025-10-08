# Release & Rollback

> Versioning, release flow, changelog, and rollback strategy.

## Cadence
- Merge features to `main` in small batches; deploy automatically
- Manual releases: dispatch the Deploy workflow with `production`
- Major releases require prior validation and plan

## Versioning & Notes
- Tag releases if needed (e.g., `v1.2.3`)
- Keep a brief CHANGELOG in PRs or release notes

## Rollback
- `wrangler deploy --rollback`
- Restore D1 snapshots if schema/data changed

## Checklist
- [ ] CI green (lint/test/build)
- [ ] Migrations reviewed and applied
- [ ] Health checks green (fast + strict)
- [ ] Docs updated for user‑visible changes
