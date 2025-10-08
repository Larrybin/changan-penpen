# 风格指南

> 统一代码、提交、文档风格，减少 Review 成本。若需例外，请在 PR 中说明并更新本指南。

## 1. 代码规范
- 语言：TypeScript-first，尽量使用类型推断
- 命名：
  - 组件：PascalCase（如 `DashboardHeader`）
  - 函数/变量：camelCase
  - 常量：SCREAMING_SNAKE_CASE（如 `const FOO = "bar" as const`）
- 目录与文件：
  - 页面：`*.page.tsx`
  - 布局：`*.layout.tsx`
  - API Route（Next.js App Router）：`route.ts`
  - 模块内路由定义（业务层）：`*.route.ts`
  - 服务：`*.service.ts`
  - 模块目录结构：`{actions,components,hooks,models,schemas,utils}`
- 导入顺序：先第三方，再内部模块；路径使用别名（如 `@/modules/...`）
- UI：优先复用 `src/components/ui`（shadcn）；Tailwind 类名使用 `cn()` 合并
- 错误处理：Edge 环境需防御性编程；外部请求设置超时

## 2. Lint 与格式化
- 使用 Biome：
  - `pnpm exec biome format --write .`
  - `pnpm exec biome check .`
- PR 前必须运行 `pnpm lint`（别名命令）
- `.md`、`.json` 也会进行格式校验，请留意自动排版

## 3. 提交信息
- 采用 Conventional Commits：
  - `feat: add admin audit trail`
  - `fix: handle health check timeout`
  - `docs: update deployment guide`
- 提交信息包含动机或影响范围；必要时在 PR 描述中补充上下文

## 4. 文档写作
- Markdown 使用一级标题开头；中英文混排注意空格
- 列表前说明目的，强调“怎么做 + 为什么”
- 更新文档时，在 `docs-maintenance.md` 中标记是否需要运行 link/spell check
- 引用命令使用 `bash` 代码块；输出示例使用 `text` 代码块

## 5. 国际化
- 用户可见文案通过 `src/i18n` 管理，避免硬编码
- 新增 key 请同步更新默认语言与目标语言
- 使用 `pnpm translate -- --target=xx` 半自动生成翻译，并人工校对

## 6. 测试约定
- 测试文件命名 `*.test.ts(x)`，与被测单元同目录
- 使用 Vitest + Testing Library；不允许快照大图
- 网络/外部资源需 mock，保证测试可重复

## 7. PR 审核清单
- [ ] 通过 `pnpm lint`、`pnpm test`（如适用）
- [ ] 更新了相关文档
- [ ] 附上 `gh run watch` 输出或链接
- [ ] 如有 breaking change，提供迁移说明

---

当风格约定发生变化（例如统一使用 Hooks/Server Actions），请更新本指南，并在团队内同步。

