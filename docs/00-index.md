# Documentation Index
> Single entry point for all docs. When you add or change flows, update this page as well.

## Quick Links
- [Repository README](../README.md)
- [Docs Maintenance Guide](docs-maintenance.md)

## Getting Started & Fundamentals
1. [architecture-overview.md](architecture-overview.md) — App Router structure, module responsibilities, data flow
2. [getting-started.md](getting-started.md) — 5‑minute quick start (local & production)
3. [local-dev.md](local-dev.md) — Local development and debugging tips
4. [extending.md](extending.md) — 模块扩展与多平台部署操作指引

## UI & Experience
1. [design-system.md](design-system.md) — Theme tokens, shared layout components, refactor roadmap

## Environment, Config, and Resources
1. [env-and-secrets.md](env-and-secrets.md) — Env matrix and rotation policy
2. [db-d1.md](db-d1.md) — D1 migrations, bootstrap, backup/restore
3. [r2-assets.md](r2-assets.md) — R2 usage and static asset mapping
4. [opennext.md](opennext.md) — Best practices for OpenNext on Cloudflare

## Deployment & Operations
1. [deployment/cloudflare-workers.md](deployment/cloudflare-workers.md) — Build, deploy, rollback, health checks
2. [ci-cd.md](ci-cd.md) — Pipeline overview (including permissions and quality gates)
3. [workflows/ci.md](workflows/ci.md), [workflows/deploy.md](workflows/deploy.md)
4. [health-and-observability.md](health-and-observability.md) — Health checks, logs, Workers Analytics
5. [api-index.md](api-index.md) — Key pages and API route index

## Risk Control & Troubleshooting
1. [troubleshooting.md](troubleshooting.md) — Common issues, diagnostic commands, fix scripts
2. [security.md](security.md) — Principle of least privilege, dependency security, pinned Actions
3. [style-guide.md](style-guide.md) — Code, commit, and docs style
4. [upstash-ratelimit.md](upstash-ratelimit.md) — Upstash integration for Workers edge throttling

## Collaboration & Release
1. [contributing.md](contributing.md) — Contribution flow, PR template, review checklist
2. [release.md](release.md) — Release steps, freeze policy, rollback and audit trail
3. [faq.md](faq.md), [glossary.md](glossary.md) — FAQs and glossary

## Maintenance
1. [docs-maintenance.md](docs-maintenance.md) — Entry points, badges, validation tooling
2. [dependency-upgrade-log.md](dependency-upgrade-log.md) — Record manual validation for dependency bumps
3. Code Owners: see `.github/CODEOWNERS`
4. Ops checklist: tracked in `docs-maintenance.md`

---

Docs are the runbook: when a process changes, update the relevant docs first, then submit code or workflow changes.
