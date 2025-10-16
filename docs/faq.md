# Frequently Asked Questions

## Why consolidate CRUD server action hooks?
Using a single `useCrudServerAction` helper keeps toast handling and retry defaults in one place. When feature teams need custom copy or callbacks they can still override the defaults via the hook options.

## How do I customize toast copy for a CRUD action?
Pass a `toastMessages` object into `useCrudServerAction(kind, action, { toastMessages })`. You can override `success`, `error`, or `loading` with either strings or callback functions.

## What if I need bespoke logic that does not fit CRUD semantics?
Call `useServerAction` directly. It exposes the same execution lifecycle that powers the CRUD helper without enforcing opinionated copy or query state reset behavior.

## Do I have to update the docs when changing server actions?
Yes. Update `docs/ServerAction-StateSync-Guide.md` and `docs/00-index.md` to reflect any new flows so that `pnpm check:all` and the link checker stay green.
