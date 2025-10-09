# 本地与 CI 质量闸

## 本地推送自检（`pnpm push`）
执行顺序：
1. Cloudflare 类型生成（`pnpm cf-typegen`）
2. Biome 修复（`biome check . --write --unsafe`）
3. TypeScript 类型检查（`tsc --noEmit`）
4. 单元测试 + 覆盖率（Vitest，已启用 `v8` + `lcov`）
5. 文档一致性与链接检查（`check:docs`、`check:links`）
6. Semgrep 安全扫描（`--config auto`，输出 `logs/semgrep.json`）
7. 最终 Biome 检查（只读）
8. 自动生成提交信息 → rebase → push

环境变量开关：
- `SKIP_TESTS=1 pnpm push` 跳过单测（仅限应急；合并前务必恢复）。
- `SKIP_SEMGREP=1 pnpm push` 跳过 Semgrep（仅限应急）。
- `SKIP_DOCS_CHECK=1 pnpm push` 跳过文档检查（仅限应急）。
- `FORCE_NEXT_BUILD=1 pnpm push` Windows 下强制执行 Next 构建（默认跳过）。

备注：若本地无 Semgrep，可使用 `pnpm dlx semgrep` 临时执行；脚本已自动回退。

## CI 检查
- Semgrep（`.github/workflows/semgrep.yml`）：自动扫描漏洞与坏味道，并上传 SARIF。
- SonarCloud（`.github/workflows/sonarcloud.yml`）：基于 `coverage/lcov.info` 聚合覆盖率与质量门禁。

所需配置：
- GitHub Secrets：
  - `SEMGREP_APP_TOKEN`（可选，用于 PR 注释）
  - `SONAR_TOKEN`（SonarCloud 访问令牌）
- GitHub Actions Variables：
  - `SONAR_PROJECT_KEY`、`SONAR_ORG`
- `sonar-project.properties`：填好 `sonar.projectKey`、`sonar.organization`（如使用 vars 也可忽略此文件中的占位）。

## 常用命令
- `pnpm test` —— 运行单元测试并生成覆盖率（v8 + lcov）。
- `pnpm check:security` —— 本地 Semgrep 快速安检（等价于 `pnpm dlx semgrep --config auto`）。
- `pnpm push` —— 全量质量闸后自动推送（推荐）。

