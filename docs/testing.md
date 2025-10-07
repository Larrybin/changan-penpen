# 测试策略（Testing Strategy）

本仓库已集成 Vitest 测试栈，并在 CI 中运行。以下给出现状、约定与实践建议，确保功能具备可回归性。

## 1. 现状概览
- 运行器：Vitest 3（`vitest`）
- 断言与匹配器：`@testing-library/jest-dom`（在 `vitest.setup.ts` 通过 `@testing-library/jest-dom/vitest` 启用）
- 组件测试：`@testing-library/react`
- DOM 环境：`jsdom`（v27）
- 配置：`vitest.config.ts` 使用 `environment: "jsdom"`、`setupFiles: "./vitest.setup.ts"`、`globals: true`，并配置别名 `@ -> src`
- 示例用例：`src/modules/auth/components/__tests__/` 下 3 个组件测试文件
- CI：`.github/workflows/ci.yml` 中包含 “Test (Vitest)” 步骤（`pnpm test`）

## 2. 推荐工具与约定
- 测试运行器：Vitest（轻量、与 Vite 生态兼容）
- 断言扩展：`@testing-library/jest-dom`
- 组件测试：`@testing-library/react`
- Mock：优先使用模块级别的 `vi.mock()`；对外部网络调用使用自定义 `fetch` mock 或 `msw`
- 命名与位置：测试文件与被测单元同目录，命名 `*.test.ts` / `*.test.tsx`

## 3. 基础命令
```bash
pnpm test                  # 单次运行
pnpm test -- --watch       # 监听模式
pnpm test -- -u            # 更新快照（如有）
```

## 4. 测试分层
| 类型 | 场景 | 约定 |
| --- | --- | --- |
| 单元测试 | 纯函数 / utils / hooks | Vitest + 纯 mock，避免访问真实外部依赖 |
| 组件测试 | UI 组件 / 表单 | 使用 RTL（`render`/`screen`/`user-event`），少量快照，仅用于关键结构 |
| Server Action | `src/modules/*/actions` | 通过 `vi.mock()` 模拟 Auth、D1/R2 等边界依赖 |
| 集成测试（可选） | API Route | 直接调用 handler 或使用适配工具（按需引入） |

## 5. Mock 策略
- D1：可用内存 SQLite（如 `better-sqlite3`）或封装测试工厂（例如 `createTestDb()`）
- R2：用简单的 in-memory Map 实现 `get`/`put` 接口
- Workers AI：返回固定响应，避免真实调用
- Auth：在 `tests/fixtures/` 下集中构造伪 session 与上下文（后续补充）

## 6. 代码覆盖率
- Provider：`v8`（`@vitest/coverage-v8`）
- Reporter：`text`、`html`
- 统计范围：`src/modules/**`、`src/services/**`、`src/lib/**`
- 排除：测试文件、`__tests__` 目录、`mocks/`、`stories/`、声明文件
- `vitest.config.ts` 中的关键片段：
```ts
coverage: {
    provider: "v8",
    reporter: ["text", "html", "json-summary"],
    reportsDirectory: "coverage",
    all: true,
    include: [
        "src/modules/**/*.{ts,tsx}",
        "src/services/**/*.{ts,tsx}",
        "src/lib/**/*.{ts,tsx}",
        "src/app/**/route.ts",
    ],
    exclude: [
        "**/__tests__/**",
        "src/**/?(*.)test.ts?(x)",
        "src/modules/**/mocks/**",
        "src/modules/**/stories/**",
        "src/lib/stubs/**",
        "**/*.page.tsx",
        "**/*.layout.tsx",
        "**/*.d.ts",
    ],
    thresholds: {
        lines: 3,
        statements: 3,
        branches: 10,
        functions: 10,
    },
},
```
- 运行命令：`pnpm test -- --coverage`
- 如需启用基于 D1 的内存数据库夹具（`tests/fixtures/db.ts`），请确保本地已执行 `pnpm rebuild better-sqlite3` 以编译原生绑定。

## 7. 路线图
- 现状：已提供 3 个组件测试样例（Auth 表单/按钮）
- 近期：为关键 Server Actions 与核心 `utils` 增加单测
- 中期：补齐模块级集成测试、错误场景与权限校验
- 远期：按需引入 E2E（Playwright）用于健康检查与关键用户旅程

## 8. 常见问题
- `ReferenceError: Request is not defined`：在 Node 测试环境中缺少 Workers API；为使用处添加 polyfill 或在测试中 mock
- 组件测试找不到选择器：优先使用可访问性查询（`getByRole`/`getByLabelText`）
- 快照频繁变化：减少 UI 细节快照，保留最小结构断言

---

提交新功能时，请同步补充或更新相应测试，并在 PR 描述中附上 `pnpm test` 结果（CI 会自动执行）。
