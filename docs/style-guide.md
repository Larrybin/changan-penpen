# Style Guide

## Code
- TypeScript‑first, strict mode
- Components: PascalCase; variables/functions: camelCase; modules follow domain‑driven names
- Run `pnpm lint` before committing; Biome formatting with 4‑space indent and double quotes

## Commits
- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:` …
- Keep messages concise and scoped; reference issues and PRs

## Docs
- English only; keep concise, actionable sections
- Use headings and short bullet lists; avoid nested lists
- Keep `docs/00-index.md` in sync when adding new docs

## Testing
- Automated tests have been removed from this project; focus on keeping type safety and linting clean.

