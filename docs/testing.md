# 测试策略（Testing Strategy）

> 当前仓库尚未配置完整测试套件，本章定义推荐工具、约定与补齐路线，确保后续功能具备可回归性。

## 1. 现状评估
- 未包含任何 `*.test.ts(x)` 文件，默认脚本 `pnpm test` 会运行 Vitest（配置于 `vitest.config.ts`）。
- 依赖项已经引入 `@testing-library/react`、`@testing-library/jest-dom`、`jsdom`，可直接用于组件测试。
- CI 中的 `ci.yml` 尚未启用单测步骤，计划在文档完善后纳入。

## 2. 工具选型
- **测试运行器**：Vitest（轻量、与 Vite 生态兼容）。
- **断言库**：内置 expect + `@testing-library/jest-dom`。
- **组件测试**：`@testing-library/react`。
- **Mock 数据库**：使用 Drizzle 提供的 `sqlite` 内存模式或自定义 mock。
- **Mock Cloudflare Bindings**：通过 `stubs/` 下的类型或 `wrangler` 提供的本地实现。

## 3. 基础命令
```bash
pnpm test               # 单次运行
pnpm test -- --watch    # 监听模式
pnpm test -- --runInBand  # 在 CI 中串行运行
```

建议在 PR 模板中附上 `pnpm test` 结果，CI 集成后可由 Github Actions 自动执行。

## 4. 测试分层
| 类型 | 场景 | 约定 |
| --- | --- | --- |
| 单元测试 | 纯函数 / utils / hooks | 使用 Vitest + 内存 mock |
| 组件测试 | UI 组件 / 表单 | `render()` + `@testing-library/react`，避免 snapshot |
| Server Action 测试 | `src/modules/*/actions` | 使用 Vitest 模拟 `BetterAuth` session 与 D1 连接 |
| 集成测试（可选） | API Route | 通过 `next-test-api-route-handler` 或直接调用 handler |

测试文件放在源文件旁边，命名 `*.test.ts` 或 `*.test.tsx`。

## 5. Mock 策略
- **D1**：优先使用内存 SQLite（`better-sqlite3`）模拟；或封装 repo 特定的 `createTestDb()`。
- **R2**：通过简单的 in-memory Map 实现 `get`/`put` 接口，置于 `stubs/`。
- **Workers AI**：Mock 为返回固定响应，避免真实调用产生费用。
- **Auth**：在 `tests/fixtures/auth.ts`（后续创建）中生成伪 session。

## 6. 代码覆盖与质量门
- 初期以“关键流程必须有覆盖”为目标（认证、Todos CRUD、Creem 支付回调）。
- 未来可在 `ci.yml` 中开启 `pnpm test --coverage` 并上传覆盖率报告。
- 错误场景测试（异常、权限不足）优先级高于纯渲染快照。

## 7. 里程碑路线图
1. **短期（当前迭代）**：新增首个示例测试（例如 `src/modules/todos/services/todo.service.test.ts`），验证 Drizzle mock。
2. **中期（M3-M4）**：覆盖核心 Server Actions、Hooks。
3. **长期**：引入端到端测试（Playwright）用于健康检查与关键用户旅程。

## 8. 常见问题
- `ReferenceError: Request is not defined`：在 Vitest 中缺失 Workers API，需在测试文件中 polyfill 或使用 `@cloudflare/workers-types`。
- 数据依赖外部 API：使用 `msw` 或自定义 fetch mock，避免真实调用。
- 覆盖率低：在 PR 中标注未测原因，并在 `release.md` 或 backlog 中登记待补。

---

提交新功能时，请同步更新本文件（若测试策略有调整），并在 PR 描述中声明“测试：✅/❌（原因）”。
