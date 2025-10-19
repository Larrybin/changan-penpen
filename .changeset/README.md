# Changesets

此目录由 [Changesets](https://github.com/changesets/changesets) 管理，用于收集即将发布版本的变更说明。

- 使用 `pnpm changeset` 交互式添加条目，为每个用户可见的改动选择 semver 级别并编写摘要。
- 发布前执行 `pnpm run release:version`，这会根据累积的 changeset 更新 `package.json` 与 `CHANGELOG.md`。
- 合并发布 PR 后，部署流程会在 Step Summary 中附上最新的 `CHANGELOG` 发布说明，方便追踪。

提交时请勿删除本目录中的配置文件；changeset 文件会在发布时被自动消费并移除。
