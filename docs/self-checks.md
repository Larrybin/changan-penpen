# Self-check Execution Report

This document记录在引入 Upstash 限流后执行的最新自检命令及结果，方便追踪基线状态。

## Commands

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm check:all` | Passed | 质量门（Biome 写入/校验、cf-typegen、tsc、构建、Docs/Links）通过；默认未执行单测。 |
| `pnpm test` | Passed with skips | 166 个测试中有 1 个跳过（依赖本地数据库原生模块，CI 环境缺失）。覆盖率报告由 Vitest v8 backend 提供。 |
| `pnpm build` | Passed | Next.js 生产构建完成。 |

## Follow-up

- 未来若更新依赖或调整限流实现，请重新运行以上命令并刷新本页记录。
