# Admin dashboard metrics cache

The admin dashboard now relies on a precomputed cache backed by the `admin_dashboard_cache` table. Each cache row stores the serialized `DashboardMetricsResponse` payload keyed by tenant scope and optional `from` filter alongside timestamps and an expiration horizon.

## Precomputation workflow

- The scheduled job entry point is [`scripts/refresh-dashboard-metrics.ts`](../scripts/refresh-dashboard-metrics.ts). Run it locally via `pnpm analytics:cache` or wire it to a Worker cron to precompute metrics.
- By default the job refreshes the global dashboard snapshot and every tenant discovered in the `customers` table. Use `--tenant <id>` to scope to a single tenant and `--from <date>` to pre-fill historical usage windows.
- Cache entries inherit the service default TTL (5 minutes) but can be overridden when invoking the job with `--ttl` (seconds) or `--ttl-ms` (milliseconds).

## Runtime behaviour

`getDashboardMetrics` now checks `admin_dashboard_cache` before issuing live aggregation queries. On a cache hit the stored payload is returned immediately; on a miss or expired entry the service recomputes metrics, writes the refreshed row, and serves the fresh data. The helper `refreshDashboardMetricsCache` is exported for callers that want to warm the cache explicitly.

## Invalidation triggers

- `createOrUpdateSubscription` and `addCreditsToCustomer` invoke `invalidateDashboardMetricsCache` whenever subscription status or credits balances change. Both the global cache (tenant = `null`) and the affected tenant cache are cleared so the next dashboard read recomputes accurate totals.
- Additional mutation paths that touch orders, subscriptions, or credits should likewise call `invalidateDashboardMetricsCache`, optionally followed by `refreshDashboardMetricsCache` if an immediate refresh is desirable.

## Operational tips

- Expired cache rows are automatically pruned when `getDashboardMetrics` encounters them, but you can force a full reset by invoking `invalidateDashboardMetricsCache()` with no scope.
- The refresh script exits non-zero if any context fails, enabling straightforward integration with cron monitors.
