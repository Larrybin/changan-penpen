# Getting Started (5 Minutes)

> For first‑time contributors: run locally in minutes and understand how production deploys are triggered.

## 架构概览 (Architecture Overview)

在开始之前，了解项目的高层架构有助于您理解各个部分是如何协同工作的。本项目是一个部署在 Cloudflare 全球边缘网络上的全栈应用。

```mermaid
graph TD
    subgraph "User"
        A[Browser]
    end

    subgraph "Cloudflare Edge Network"
        B(Cloudflare Workers)
    end

    subgraph "Application Logic (Running in Worker)"
        C{Next.js App (via OpenNext)}
        D[API Routes]
        E[React Server Components]
        F[Drizzle ORM]
    end

    subgraph "Backend Services (Cloudflare)"
        G[(D1 Database)]
        H[(R2 Storage)]
        I[(Workers AI)]
    end

    A -- HTTPS Request --> B
    B -- Invokes --> C
    C -- Handles Request --> D
    C -- Renders UI --> E
    C -- Accesses Data --> F
    F -- Queries --> G
    C -- Accesses Files --> H
    C -- Uses AI --> I
```

-   **Next.js (via OpenNext):** 核心应用框架。OpenNext 工具包使其能够运行在 Cloudflare Workers 环境中。
-   **Cloudflare Workers:** 提供 Serverless 计算环境，让应用在全球边缘节点上运行，降低延迟。
-   **D1 Database:** Cloudflare 的原生 Serverless 数据库，用于存储应用核心数据。
-   **R2 Storage:** 用于存储用户上传的图片、文件等非结构化数据。
-   **Drizzle ORM:** 类型安全的 ORM，用于在代码中与 D1 数据库进行交互。

---

## 1. Requirements
- Node.js 20.x
- pnpm 10.x
- Cloudflare account (for production deploys)
- GitHub CLI (optional)

Verify:
```bash
node -v
pnpm -v
```

## 2. Clone & Install
```bash
git clone https://github.com/ifindev/fullstack-next-cloudflare.git
cd fullstack-next-cloudflare
pnpm install
```

## 3. Environment
```bash
cp .dev.vars.example .dev.vars
```

Fill at least:
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_D1_TOKEN`
- `BETTER_AUTH_SECRET`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (if using Google login)
- `CREEM_API_KEY` and `CREEM_WEBHOOK_SECRET` (if billing callbacks)

If you add D1/R2/AI bindings in `wrangler.toml`, run `pnpm cf-typegen`.

## 4. Run Locally
```bash
pnpm dev
```
Open `http://localhost:3000` and verify the homepage, auth, and Todos demo.

### 4.1 Workers Runtime (Edge)
```bash
pnpm dev:cf      # OpenNext build + wrangler dev (local)
pnpm dev:remote  # remote region (requires wrangler login)
```

## 5. Production Deploy Overview
- Push to `main` or manually dispatch the Deploy workflow with `production`
- CI + 自动健康检查（严格模式 `/api/v1/health`，workflow 会自动重试）必须通过；`/api/v1/health?fast=1` 可作为额外快速探活
- Details: `docs/deployment/cloudflare-workers.md`

## 6. What’s Next
- Read `docs/local-dev.md` for debugging tips
- Env & secrets matrix: `docs/env-and-secrets.md`
- Architecture: `docs/architecture-overview.md`
- Before committing: `pnpm lint` and `pnpm typecheck`

---

If you hit start‑up or env issues, see `docs/troubleshooting.md`. Include logs (e.g., `gh run watch`) in PRs for reviewers.
