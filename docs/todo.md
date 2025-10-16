# Architecture & Security Hardening TODO

> 当前评审建议的任务状态追踪。所有条目均已完成并合并到本次变更中。

- [x] 引入 `/api/v1` 命名空间并提供旧路径自动重写，同时更新文档索引与 OpenAPI 输出路径。
- [x] 建立标准化的 API 错误响应格式（包含错误码、时间戳、traceId），并在限流、Webhook、积分、用量等核心接口中落地；前端与测试同步适配。
- [x] 新增 Upstash Redis API 缓存工具，已在管理端用量统计接口应用，自动打上 `X-Cache` 命中标记。
- [x] 集成 Sentry Cloudflare SDK，在 Workers 入口注入版本/环境信息并支持可配置采样率。
- [x] 扩展中间件以下发统一安全响应头（CSP、HSTS、X-Frame-Options 等），并为 API 请求写入 `API-Version`/`Supported-Versions` 标识。

如需追加后续改进，可在此文件追加新的待办项并标记状态。
