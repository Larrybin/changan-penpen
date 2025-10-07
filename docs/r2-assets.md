# Cloudflare R2 与静态资源

> 描述对象存储的用途、绑定配置、上传流程与本地/预览/生产的差异。

## 1. 绑定概览
- `wrangler.jsonc` 顶层：
  ```json
  {
      "r2_buckets": [
          { "bucket_name": "next-cf-app-bucket", "binding": "next_cf_app_bucket" }
      ]
  }
  ```
- 预览环境：
  ```json
  {
      "env": {
          "preview": {
              "r2_buckets": [
                  { "bucket_name": "next-cf-app-preview-bucket", "binding": "next_cf_app_bucket" }
              ]
          }
      }
  }
  ```
- 业务代码通过 `env.next_cf_app_bucket` 访问（具体封装待补充于 `src/lib/r2.ts`）。

## 2. 使用场景
- 静态资产：用户上传的文件、生成的导出报告、AI 结果等。
- CDN：可配置自定义域或结合 Cloudflare Images。
- 与 Next.js SSG 互补：`public/` 放置构建时已知的静态文件，而 R2 用于运行期上传。

## 3. 本地开发
- 默认不连接真实 R2。若需使用，需在 `.dev.vars` 中设置 `CLOUDFLARE_R2_URL`（用于访问入口）。
- 可考虑在后续迭代中引入内存 mock（参考 `stubs/`），或使用 MinIO/S3 兼容实现模拟。
- 调试命令：
  ```bash
  wrangler r2 object list next-cf-app-bucket --prefix uploads/
  ```

## 4. 上传/下载示例
```ts
const bucket = env.next_cf_app_bucket;
await bucket.put(`uploads/${fileName}`, fileStream, {
  httpMetadata: { contentType: mimeType },
});

const object = await bucket.get(`uploads/${fileName}`);
const data = await object?.arrayBuffer();
```

> 所有交互应封装在服务层，例如 `src/services/assets/r2.service.ts`（如尚未存在，可在引入新功能时建立）。

## 5. 访问策略
- 默认开启公开读（需在 Cloudflare Dashboard 中配置 R2 Bucket 权限）。
- 若需要私有访问，可生成签名 URL 或通过 Workers 代理。
- `CLOUDFLARE_R2_URL` 用于在客户端展示资源（例如 `https://<account>.r2.dev`）。

## 6. 版本与备份
- R2 支持对象版本控制，建议在生产开启以防误删。
- 大体积数据可定期导出到外部存储或 Cloudflare D1 记录索引。

## 7. 维护清单
1. 新增/修改 Bucket 名称 → 更新 `wrangler.jsonc` 和 `pnpm cf-typegen`
2. 需要公共访问 → 在 R2 设置中开启 `Public Read` 或配置自定义域
3. 工作流部署 → 确认 GitHub Secrets 中的 API Token 含有 `R2:Edit` 权限
4. 大批量上传 → 在部署前确认 `deploy.yml` 的权限范围与限速

## 8. 常见问题
- **`403 Forbidden`**：检查 API Token 权限或 Bucket 是否设置为私有。
- **`TypeError: bucket.put is not a function`**：未运行 `pnpm cf-typegen`，导致类型不匹配。
- **资源访问出现 404**：确认路径大小写一致，并检查是否在预览环境写入生产 Bucket。

---

当新增静态资源流程（如图像处理、CDN 缓存）时，请同步更新本文与 `docs/health-and-observability.md` 中的监控项。
