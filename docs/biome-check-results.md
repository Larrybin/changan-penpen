# Biome Check Summary

The command `pnpm exec biome check` currently reports a large number of diagnostics across the repository. The top-level invocation executed on the date of this report produced the following aggregate counts:

- 577 errors
- 119 warnings

The first diagnostics emitted reference utility components in `src/modules/marketing/components/public-footer.tsx`, `src/modules/marketing/components/public-header.tsx`, and `src/modules/todos/components/todo-card.tsx` that require Tailwind class lists to be sorted. Additional messages continue past the default diagnostics limit and affect many other files across the app, so the command exits with a non-zero status until those issues are resolved.

> **Tip:** Run `pnpm exec biome check --max-diagnostics=20` to focus on a smaller subset of issues while iteratively fixing them.
