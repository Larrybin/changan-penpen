# GEMINI.md: Project Context

This document provides an overview of the `fullstack-next-cloudflare-main` project, its structure, and key commands to facilitate development and interaction with the Gemini AI assistant.

## Project Overview

This is a production-ready, full-stack web application built with **Next.js 15** and deployed on the **Cloudflare** edge network. It leverages a comprehensive set of modern web technologies to deliver a high-performance, scalable, and maintainable solution.

### Core Technologies
- **Framework:** [Next.js](https://nextjs.org/) 15 (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Deployment:** [Cloudflare Workers](https://workers.cloudflare.com/) via [OpenNext](https://opennext.js.org/)
- **Database:** [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite) with [Drizzle ORM](https://orm.drizzle.team/) for data access and migrations.
- **Storage:** [Cloudflare R2](https://developers.cloudflare.com/r2/) for object storage.
- **Authentication:** `better-auth`
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Testing:** [Vitest](https://vitest.dev/) for unit and integration tests.
- **Linting & Formatting:** [Biome](https://biomejs.dev/)
- **Internationalization (i18n):** `next-intl`

### Architecture
The project follows a modular architecture centered around the Next.js App Router.

- `src/app`: Contains the application's pages, layouts, and API routes.
- `src/modules`: Organizes code into domain-specific features (e.g., `auth`, `dashboard`, `admin`). Each module may contain its own components, services, and schemas.
- `src/db` & `src/drizzle`: Manages the database schema, migrations, and Drizzle ORM configuration.
- `src/lib`: Holds shared utilities and integrations (e.g., Cloudflare bindings, logging).
- `wrangler.toml`: Configures the Cloudflare environment, including D1/R2 bindings and environment variables.
- `next.config.ts`: Configures the Next.js application.

## Building and Running

The project uses `pnpm` as its package manager.

### Local Development

- **Standard Mode:** Runs the Next.js development server. Best for most UI work.
  ```bash
  pnpm dev
  ```

- **Cloudflare Simulator Mode:** Runs the application locally using `wrangler`, simulating the Cloudflare Workers environment. Use this for testing Cloudflare-specific features.
  ```bash
  pnpm dev:cf
  ```

### Key Scripts

- **Install Dependencies:**
  ```bash
  pnpm install
  ```

- **Run Tests:**
  ```bash
  pnpm test
  ```

- **Lint and Format:**
  ```bash
  pnpm lint
  ```

- **Type Checking:**
  ```bash
  pnpm typecheck
  ```

- **Run All Checks:** A convenience script to run linting, type checking, and tests.
  ```bash
  pnpm check:all
  ```

- **Database Migrations:**
  - **Generate:** `pnpm db:generate`
  - **Apply (Local):** `pnpm db:migrate:local`
  - **Apply (Production):** `pnpm db:migrate:prod`

### Deployment

- **Deploy to Cloudflare:** This command builds the application with OpenNext and deploys it to Cloudflare Workers.
  ```bash
  pnpm deploy:cf
  ```
- The project is also configured for CI/CD with GitHub Actions, which automates the deployment process on pushes to the `main` branch.

## Development Conventions

- **Code Style:** The project uses [Biome](https://biomejs.dev/) for code formatting and linting. Run `pnpm lint` to check and fix issues.
- **Commits:** Follow conventional commit standards.
- **Testing:** Write tests for new features and bug fixes. Tests are located alongside the code they cover (e.g., in `src/modules/**/__tests__/`).
- **Secrets:** Manage secrets using a `.dev.vars` file locally (copied from `.dev.vars.example`) and Cloudflare secrets in production.
- **Documentation:** Keep documentation in the `docs/` directory up-to-date with any changes to architecture, features, or processes.
