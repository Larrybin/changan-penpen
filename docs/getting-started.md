# 5 分钟快速开始（Getting Started）

> 面向第一次接触仓库的开发者，帮助你在 5 分钟内完成本地运行，并了解如何触发预览部署。

## 1. 环境要求
- Node.js **20.x**
- pnpm **9.x**
- Cloudflare 账号（用于预览/生产部署）
- GitHub CLI（可选，用于触发工作流与追踪 CI）

检查版本：
```bash
node -v
pnpm -v
```

## 2. 克隆与安装
```bash
git clone https://github.com/ifindev/fullstack-next-cloudflare.git
cd fullstack-next-cloudflare
pnpm install
```

## 3. 配置环境变量
```bash
cp .dev.vars.example .dev.vars
```

编辑 `.dev.vars`，至少补齐以下字段：
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_D1_TOKEN`
- `BETTER_AUTH_SECRET`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`（如需 Google 登录）
- `CREEM_API_KEY` 与 `CREEM_WEBHOOK_SECRET`（如需支付回调）

> 若新增 Cloudflare 绑定（D1/R2/AI），更新 `wrangler.jsonc` 后运行 `pnpm cf-typegen`。

## 4. 本地运行
```bash
pnpm dev
```

访问 `http://localhost:3000`，验证主页、登录流程、Todos Demo 是否正常。

### 4.1 Cloudflare Workers 模拟
如需在 Workers Runtime 下测试边缘行为：
```bash
pnpm dev:cf         # OpenNext 构建 + wrangler dev (本地模式)
pnpm dev:remote     # 远程区域运行，需 Cloudflare 登录
```

## 5. 触发预览部署

### 5.1 GitHub Actions
1. 在仓库 Settings → Secrets and variables → Actions 中设置 Secrets：
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `BETTER_AUTH_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `CREEM_API_KEY`
   - `CREEM_WEBHOOK_SECRET`
2. 按需补充 Variables（非敏感）：
   - `CREEM_API_URL`、`CREEM_SUCCESS_URL`、`CREEM_CANCEL_URL`
   - `CLOUDFLARE_R2_URL`
3. 推送任意分支或手动在 Actions 选单中运行 `Deploy` 工作流，选择 `preview` 目标。

使用 gh CLI 触发并跟踪：
```bash
gh workflow run deploy.yml -f target=preview
gh run watch --exit-status
```

### 5.2 CLI 手动部署
```bash
pnpm preview:cf          # 预览（wrangler preview）
pnpm deploy:preview      # 带 --env preview 的正式预览部署
```

预览部署成功后，`Deploy` 工作流会在结尾输出访问 URL，请在 PR 内更新链接。

## 6. 生产部署概览
- 推送到 `main` 分支或手动触发 `Deploy` 工作流并选择 `production`。
- 部署前会运行 CI、健康检查（fast 模式 `/api/health?fast=1`），失败时自动回滚。
- 生产部署详情请见 `docs/deployment/cloudflare-workers.md`。

## 7. 下一步
- 阅读 [`docs/local-dev.md`](local-dev.md) 获取调试技巧。
- 了解环境/密钥矩阵：[`docs/env-and-secrets.md`](env-and-secrets.md)。
- 熟悉架构：[`docs/architecture-overview.md`](architecture-overview.md)。
- 提交前运行 `pnpm lint` 与 `pnpm test`（测试计划见 [`docs/testing.md`](testing.md)）。

---

遇到启动失败、环境缺失等问题，可先查阅 `docs/troubleshooting.md`，并在 PR 中附上 `gh run watch` 的日志片段，方便审核者复现。
