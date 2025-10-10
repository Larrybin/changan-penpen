# 代码规范与审查准则（Next.js + Cloudflare + TypeScript）

适用于本仓库的统一规范与结构化审查清单。目标：确保功能正确、类型安全、性能稳定、易于维护，并在推送与 CI 阶段以自动化质量闸实现“早失败、易定位”。

## 范围与目标
- 技术栈：Next.js App Router、Cloudflare Workers（OpenNext）、TypeScript + Biome、Drizzle ORM（D1）、R2、next-intl、Vitest + React Testing Library。
- 质量目标：
  - 功能满足需求，边界与失败场景清晰可测。
  - 类型与错误处理完整（不吞错、不暴露内部错误）。
  - 安全（输入校验、XSS/SQL 注入防护、Secrets 管控、日志合规）。
  - 性能与资源消耗可控（Edge 友好、请求超时、流式/缓存合理）。
  - 文档、迁移、配置与代码变更保持一致。

## 评审流程（实践建议）
- 小步提交：以功能/修复为单位，单次提交控制在数百行内；便于回溯与审查（经验阈：150–500 行/小时）。
- 分块提交：使用 `git add --patch` 与 `git diff --staged` 精修变更；确保提交内聚、信息清晰。
- 推送前自检：优先使用 `pnpm push`（脚本含：类型检查、单测+覆盖率、Semgrep、文档与链接检查、Biome 最终检查、可选 Next 构建、自动生成提交信息、rebase 再 push）。
- CI 质量闸：PR 上运行 Semgrep 与 SonarCloud，监控漏洞、坏味道与技术债；PR 必需附带截图/说明与迁移变更。

## 代码风格与命名
- TypeScript-first；组件：PascalCase；变量/函数：camelCase；模块按领域划分：`src/modules/<feature>`。
- Biome 统一格式（4 空格缩进，双引号）；提交前运行 `pnpm lint` 或 `pnpm exec biome check .`。
- 文件命名：页面 `*.page.tsx`，布局 `*.layout.tsx`，路由处理 `*.route.ts`，服务 `*.service.ts`。

## 架构与边界
- App Router：合理划分 SSR/CSR；避免在 Edge 环境中引入 Node-only 依赖；Server Actions 仅做必要 I/O 与协调。
- 数据流：schema（zod）→ actions/service → 组件；避免在组件中直接做重 I/O。
- 可观测性：Sentry 捕获错误（区分用户错误 vs 系统错误），避免日志敏感信息（脱敏/Hash）。

## 类型与错误处理
- 开启严格模式（tsconfig）；禁止 `any` 泄露到边界；公共函数/接口必须有精确类型。
- 输入校验：所有外部输入（API、表单、URLSearchParams、Headers）使用 zod 校验；拒绝非法值。
- 错误风格：
  - 不抛出原始库错误到调用方；转换为受控错误（带错误码与用户可读信息）。
  - API/Route 返回一致的错误结构，HTTP 状态码语义正确。
  - 超时与重试策略明确（fetch 加 `AbortController` 与超时上限）。

## 安全基线
- XSS：输出前转义；R2 对文档/文本类型默认 `Content-Disposition: attachment`；避免把不可信 HTML 直接注入。
- SQL 注入：尽量使用 ORM（Drizzle）绑定参数；禁止手写字符串拼接。
- CSRF/CORS：跨域白名单最小化；修改性请求需要 CSRF 保护或受 Auth 限制。
- Secrets：本地 `.dev.vars`，生产用 Wrangler `secret`；禁止在代码中硬编码。
- 依赖安全：Semgrep 扫描；定期审计与升级（`pnpm outdated` / Renovate/GitHub Dependabot）。

## API / 数据库 / 事务
- API 调用：失败与异常分支可测；明确超时、重试、幂等（如支付/Webhook 用 idempotency-key）。
- D1 事务：成组写入需事务；失败回滚；按需重试或补偿流程。
- 变更兼容：迁移脚本与应用代码版本匹配，灰度/前向兼容策略清晰。

## 性能与资源
- Edge 限制：避免 Node 内置模块；使用 Web 平台 API；禁用阻塞型调用。
- 缓存：合理设置 `Cache-Control`、ETag；SWR/React Query 配置命中率；避免频繁全量刷新。
- 构建：树摇/按需加载；组件拆分；图片使用 Next/Image 与合适的尺寸。

## i18n（next-intl）
- key 命名稳定且语义化；默认/缺失文案覆盖；服务端/客户端一致加载策略；RTL/LTR 与复数、日期格式正确。

## 测试（Vitest + RTL）
- 单元测试覆盖关键分支（成功/失败/边界）；对外 I/O（D1/R2/fetch）使用 mock。
- 覆盖率：阈值低起步（已在配置中设置），逐步抬高；至少对关键模块（lib、services、route handlers）有基本用例。

## 文档与变更可追溯
- 任何 DB/配置/部署相关改动，更新 `docs/` 与迁移脚本，并在 PR 中链接；`pnpm check:docs`/`pnpm check:links` 需通过。

---

## 结构化审查清单（逐项打勾）
- 功能需求
  - [ ] 需求与验收标准明确，边界条件覆盖
  - [ ] UI/UX 与产品一致，关键路径有回退/提醒
- 代码风格
  - [ ] 符合 Biome 格式与命名约定
  - [ ] 目录结构符合领域划分，文件粒度合理
- 类型与错误
  - [ ] TS 类型正确、精确；无 `any` 外泄
  - [ ] zod 输入校验完整；错误语义与状态码一致
  - [ ] 超时/重试/取消策略就绪（fetch + Abort）
- API/数据库
  - [ ] ORM 参数绑定避免注入；事务与回滚策略明确
  - [ ] API 失败分支与重试、幂等可测
- SSR/CSR 边界
  - [ ] Server Actions/I/O 不阻塞；Node-only 依赖不进 Edge
  - [ ] 缓存/流式渲染/数据请求并发合理
- i18n
  - [ ] 关键文案具多语言；日期/数字/复数正确
- 安全
  - [ ] XSS/SQL 注入/CSRF/CORS 检查通过
  - [ ] Sentry/日志无敏感信息泄漏
  - [ ] Secrets 使用 Wrangler/环境绑定；无硬编码
- 测试
  - [ ] 关键路径单测与失败场景覆盖；Vitest 通过
  - [ ] 覆盖率产物生成（lcov 用于 Sonar）
- Cloudflare 环境
  - [ ] wrangler 绑定/类型生成正确（`pnpm cf-typegen`）
  - [ ] D1/R2 等绑定在本地/远程一致
- 文档
  - [ ] `docs/`、迁移与 `.jsonc`/env 变更同步更新

---

## 推送与 CI 质量闸
- 本地：`pnpm push` 将阻塞以下失败情形：TypeScript、Vitest、Semgrep、Docs/Links、Biome 最终检查、（可选）Next 构建。
- CI：
  - Semgrep：自动扫描常见漏洞与坏味道；结果在 PR 中可视化。
  - SonarCloud：聚合技术债、异味、重复率、覆盖率（使用 vitest `lcov`）。

## 依赖与漏洞治理
- 每周查看 `pnpm outdated`；按影响面分级更新；必要时加 Canaries/灰度。
- 为安全升级配置 Renovate/Dependabot；合并前跑全量 CI。

### Actions 版本固定策略（GitHub Actions）
- 必须将第三方 Actions 固定到具体 commit SHA（而非 `vX` tag），降低供应链投毒风险。
- 固定范围：checkout、setup-node、pnpm/action-setup、cache、upload-artifact、Semgrep、SonarCloud、Cloudflare Wrangler、Dependabot 辅助等。
- 升级流程：
  - 定期（月度/安全事件后）拉取上游 tag 的最新对应 commit SHA；在分支中更新引用。
  - 提 PR，跑全量 CI（含 Semgrep 与 SonarCloud），确认无回归再合入。
  - 在 `docs/ci-cd.md`、`docs/workflows/*` 保持说明同步。
- 例：`uses: actions/checkout@08eba0b27e820071cde6df949e0beb9ba4906955`。

## 提交信息
- 使用 Conventional Commits（feat/fix/chore/docs/refactor 等）。
- 标题简洁，正文列要点（影响区域、行为变化、风险与回滚策略）。
