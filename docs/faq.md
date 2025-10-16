# Frequently Asked Questions

## Why consolidate CRUD server action hooks?
Using a single `useCrudServerAction` helper keeps toast handling and retry defaults in one place. When feature teams need custom copy or callbacks they can still override the defaults via the hook options.

## How do I customize toast copy for a CRUD action?
Pass a `toastMessages` object into `useCrudServerAction(kind, action, { toastMessages })`. You can override `success`, `error`, or `loading` with either strings or callback functions.

## What if I need bespoke logic that does not fit CRUD semantics?
Call `useServerAction` directly. It exposes the same execution lifecycle that powers the CRUD helper without enforcing opinionated copy or query state reset behavior.

## Do I have to update the docs when changing server actions?
Yes. Update `docs/ServerAction-StateSync-Guide.md` and `docs/00-index.md` to reflect any new flows so that `pnpm check:all` and the link checker stay green.
## Project Basics

### What is Changan Penpen?
Changan Penpen is a Next.js application targeting Cloudflare Workers with OpenNext, providing a modular architecture for building production-ready experiences.

### Where can I find the primary documentation entry points?
Start with [docs/00-index.md](00-index.md) for the complete index and [README](../README.md) for repository level guidance.

## Development Workflow

### How do I run the project locally?
Use `pnpm dev` for the standard Next.js development server, or `pnpm dev:cf` to run the OpenNext Cloudflare build through Wrangler. Ensure dependencies are installed with `pnpm install` first.

### Which quality gates should I run before opening a PR?
Run `pnpm lint`, `pnpm test`, `pnpm typecheck`, and the documentation tooling such as `pnpm run check:links` to match the repository guidelines.

## Deployment & Operations

### How do I deploy to Cloudflare Workers?
Use `pnpm deploy:cf`, which builds the project with OpenNext and publishes using Wrangler. Confirm secrets are configured via `pnpm run cf:secret <NAME>` and update `wrangler.toml` as needed.

### How do I regenerate Cloudflare type bindings?
Execute `pnpm exec wrangler types --env-interface CloudflareEnv ./cloudflare-env.d.ts` or run the associated script in `scripts/check-all.mjs`. This keeps `cloudflare-env.d.ts` synchronized with the Worker bindings.

## Troubleshooting

### Where can I find debugging tips?
See [docs/local-dev.md](local-dev.md) for local debugging strategies and [docs/troubleshooting.md](troubleshooting.md) for common fixes and diagnostic commands.

### What should I do if documentation links fail validation?
Update or add the target documents so that `pnpm run check:links` passes. Reference `docs/docs-maintenance.md` for the docs workflow and validation tooling overview.
