# OpenNext on Cloudflare 指南

> 记录 OpenNext 与 Cloudflare Workers 结合时的注意事项、局限与最佳实践。

## 1. 概览
- 使用 `@opennextjs/cloudflare` 构建 Next.js App Router 项目
- 构建产物位于 `.open-next`：
  - `assets/`：静态资源，绑定为 `ASSETS`
  - `worker.js`：Workers 入口
  - `functions/`：API / Server Actions 打包结果
- 构建命令：
  ```bash
  pnpm build:cf        # 仅构建
  pnpm deploy:cf       # 构建 + 部署
  pnpm dev:cf          # 构建 + wrangler dev（本地）
  ```

## 2. 运行时限制
- 边缘运行时间受限（50ms CPU + I/O），避免高计算任务
- 不支持 Node.js 专属模块（`fs`, `net`, `tls` 等），已通过 `nodejs_compat` 适配常见 API
- 原生 `Image Optimization` 未完全兼容，需使用 Cloudflare Images 或外部服务
- `revalidatePath` / ISR 在 Workers 模式下依赖 KV；目前采用默认策略，后续可酌情引入 KV
- `next/image`：推荐启用 `dangerouslyAllowSVG` 并配合 Cloudflare CDN

## 3. 构建参数
- `wrangler.jsonc` 已开启：
  ```json
  "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"]
  ```
- 若需额外选项，可在 `open-next.config.ts` 中调整（当前沿用默认值）
- 支持 `--minify`, `--source-maps` 等参数，在 CI 中可根据需求切换

## 4. 文件布局
| 路径 | 说明 |
| --- | --- |
| `.open-next/assets` | 静态资源，部署时通过 `ASSETS` binding 提供 |
| `.open-next/functions/api` | API Route 打包产物 |
| `.open-next/functions/server` | Server Component/Action 入口 |
| `.open-next/workers/edge` | Worker 脚本，供 `wrangler deploy` 使用 |

> 构建产物默认不提交到仓库，由 CI/本地命令动态生成。

## 5. 常见操作
- **清理产物**：`rimraf .open-next`（或 `Remove-Item -Recurse`）
- **调试**：`pnpm dev:cf -- --inspect`，配合 Chrome DevTools
- **上传大文件**：启用 `streams` API，避免在内存中拼接

## 6. 常见问题
| 问题 | 解决方案 |
| --- | --- |
| 构建卡住或 OOM | 升级 Node 内存限制 `NODE_OPTIONS="--max-old-space-size=4096" pnpm build:cf` |
| `Cannot find module` | 确认依赖是否在 `dependencies`（非 `devDependencies`） |
| `ReferenceError: Response is not defined` | 未启用 Compatibility Flags（检查 `wrangler.jsonc`） |
| 环境变量缺失 | 构建时需通过 `wrangler` 注入，或在 `open-next.config.ts` 中声明 |

## 7. 最佳实践
- 在 `package.json` 的 `prebuild` 增加必要脚本（例如 `pnpm fix:i18n`），确保构建一致性
- 避免在运行时写磁盘，如需持久化使用 D1/R2
- 结合 `docs/deployment/cloudflare-workers.md` 中的健康检查，确保构建后的 Worker 正常运行
- 构建失败时保存 `.open-next/.config.json` 日志，便于排查

## 8. 版本升级流程
1. 检查 [OpenNext 发布说明](https://github.com/sst/open-next/releases)
2. 在分支中升级 `@opennextjs/cloudflare` 版本
3. 运行 `pnpm build:cf` 验证本地构建
4. 更新 `docs/opennext.md` 记录变更影响、已知限制
5. 在 `release.md` 里记录升级与回滚策略

---

遇到新的约束或优化项，请同步更新本文，并在 PR 模板中关联“OpenNext 升级/调整”选项。
