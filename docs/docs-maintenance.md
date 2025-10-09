# Docs Maintenance Guide

> Keep docs accurate and discoverable. Treat docs as the runbook.

## Ownership & Entry Points
- Primary index: `docs/00-index.md`
- Each feature may reference module docs or READMEs
- Code owners: `.github/CODEOWNERS`

## When to Update
- New workflows, modules, or env changes
- CI/CD and deployment changes
- Security/secrets rotation

## Validation
- Lint links and headings during CI (if checker is configured)
- Ensure UTF‑8 and normalized line endings
- Preview Markdown rendering in IDE

## Monthly Review (suggested)
- [ ] Check outdated content or broken links
- [ ] Verify workflows and env matrices match reality
- [ ] Review security and incident playbooks

## Useful Search Tips
- Prefer PowerShell 7 + UTF‑8 in profile to avoid garbled output
- Grep examples (ripgrep):
  - `rg -n -F ".github/workflows/" README.md` — list workflow references in README
  - `rg -n "\\.route\\.ts$|/api/.*/route\\.ts$|/page\\.tsx$" src` — scan routes/pages
  - `rg -n -F "wrangler.jsonc" docs` — find env docs cross‑references
