# Repository Guidelines

## Project Structure & Module Organization
- Source in `src/`; Next.js App Router under `src/app` with `*.page.tsx`, `*.layout.tsx`, `*.route.ts`。
- Domain features: `src/modules/<feature>/{actions,components,hooks,models,schemas,utils}`。
- Reusable UI: `src/components`, `src/components/ui`。Data access: `src/db`；migrations: `src/drizzle`；shared helpers: `src/lib`；assets: `public/`；docs: `docs/`。

## Build, Test, and Development Commands
- `pnpm dev` 本地 Next.js 开发 (http://localhost:3000)。
- `pnpm dev:cf` 使用 OpenNext Cloudflare 构建并通过 Wrangler 本地运行。
- `pnpm build` / `pnpm start` 生产构建与运行。
- `pnpm deploy:cf` 部署到 Cloudflare Workers。
- `pnpm db:migrate:local` 应用 D1 本地迁移；`pnpm db:migrate:prod` 远程迁移。
- `pnpm lint` 使用 Biome 自动格式化；`pnpm typecheck` 生成绑定并做 TS 检查。
- 文档/链接检查：`pnpm run check:docs`，`pnpm run check:links`。

## Coding Style & Naming Conventions
- TypeScript 优先；4 空格缩进与双引号（Biome）。
- 组件 PascalCase；变量/函数 camelCase；模块按领域划分。
- 文件命名：页面 `*.page.tsx`，布局 `*.layout.tsx`，路由 `*.route.ts`，服务 `*.service.ts`。
- 提交前运行 `pnpm lint`；仓库启用 `husky` + `lint-staged` 自动修复。

## Testing Guidelines
- 本仓库已移除所有自动化测试与相关脚本，不需要也无法运行测试。

## Commit & Pull Request Guidelines
- 使用 Conventional Commits（如 `feat:`, `fix:`, `docs:`）。
- PR 需：变更说明、关联 Issue、UI 变更附截图/GIF、注明 DB/环境变量改动。
- 确保 `pnpm lint` 与 `pnpm build` 通过，数据库变更附 `src/drizzle` 迁移。

## Security & Configuration Tips
- 本地环境：复制 `.dev.vars.example` 为 `.dev.vars`；切勿提交机密。
- 使用 Wrangler 管理 Secrets：`pnpm run cf:secret <NAME>`；添加绑定后运行 `pnpm cf-typegen`，同步 `wrangler.toml`。
