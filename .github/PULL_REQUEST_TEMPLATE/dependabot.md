## Summary

Dependabot bumped one or more dependencies. Please document the verification you performed before merging.

## Maintainer QA Checklist
- [ ] `pnpm lint && pnpm build`
- [ ] `pnpm run test:ui-regression`
- [ ] Manual smoke of Radix wrappers (Select/Dialog/Form/Toast) with screenshots or clips when behavior or styling shifts
- [ ] Notable API or styling changes captured in `docs/dependency-upgrade-log.md`

## Notes
- Link upstream release notes or changelog entries here.
- Capture follow-up issues if additional refactors are required.
