# Admin Dashboard 优化指南

## 📋 概述

本文档描述了管理员仪表盘的性能优化方案，包括智能缓存、数据预取、组件懒加载和用户体验优化等功能。

## 🎯 优化目标

- **首屏加载时间**：3-4秒 → 1.5-2秒 (**48%** ⬆️)
- **API响应时间**：800ms → 200ms (**75%** ⬆️)
- **缓存命中率**：30% → 85%+ (**183%** ⬆️)
- **初始包大小**：450KB → 315KB (**30%** ⬇️)

## 🏗️ 架构设计

### 分层缓存策略

```
L1: 静态缓存 (5分钟)
├── 目录概况 (产品、优惠券、内容页数量)
└── 站点设置

L2: 用户缓存 (1分钟)
├── 基本统计 (营收、订单数、订阅数)
└── 使用趋势数据

L3: 实时缓存 (10秒)
├── 最新订单列表
└── 最新积分变动
```

### 组件架构

```
Admin Dashboard
├── 智能缓存层 (Redis + Upstash)
├── 数据预取层 (TanStack Query)
├── 懒加载组件 (React.lazy)
├── 乐观更新层 (Optimistic Updates)
└── 性能监控层 (Performance Monitor)
```

## 🚀 核心功能

### 1. 智能缓存系统

#### 缓存服务 (`src/lib/cache/admin-cache.ts`)

```typescript
import { getAdminCacheManager, AdminCacheKeyBuilder } from '@/lib/cache/admin-cache';

// 获取缓存管理器
const manager = getAdminCacheManager();

// 缓存数据
await manager.set('dashboard:metrics', data, 60); // 60秒TTL

// 获取缓存
const cached = await manager.get('dashboard:metrics');

// 智能缓存装饰器
const { value, hit } = await withAdminCache(
    'USER',
    () => AdminCacheKeyBuilder.dashboardMetrics(tenantId),
    () => fetchDashboardData()
);
```

#### 缓存失效策略 (`src/lib/cache/cache-invalidation.ts`)

```typescript
import { triggerCacheInvalidation } from '@/lib/cache/cache-invalidation';

// 订单创建后失效相关缓存
await triggerCacheInvalidation('order_created', {
    tenantId: 'user123',
    resource: 'order'
});

// 批量失效
await batchInvalidateCache([
    { event: 'order_created', tenantId: 'user123' },
    { event: 'credit_added', tenantId: 'user123' }
]);
```

### 2. 优化的API路由

#### 仪表盘API (`src/app/api/v1/admin/dashboard/route.ts`)

```typescript
// GET /api/v1/admin/dashboard?tenantId=123&bypassCache=true
// 返回格式:
{
  "data": DashboardMetrics,
  "meta": {
    "cacheHit": boolean,
    "responseTime": number,
    "timestamp": string
  }
}
```

### 3. 客户端查询优化

#### TanStack Query配置 (`src/modules/admin/providers/query-client.tsx`)

```typescript
// 优化的查询配置
const query = useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: fetchDashboardData,
    staleTime: 1000 * 30, // 30秒内认为数据新鲜
    cacheTime: 1000 * 60 * 5, // 5分钟内存缓存
    refetchOnWindowFocus: false, // 减少网络请求
    retry: 2, // 智能重试策略
});
```

### 4. 智能数据预取（已归档）

> ⚠️ 原型 Hook `src/modules/admin/hooks/use-dashboard-prefetch.ts` 已在 2025/03 为精简未使用的代码而移除。若未来需要重新引入仪表盘的智能预取，请以本文档描述的策略为参考，实现面向实际页面场景的定制化 Hook，并确保有消费方再恢复代码。

### 5. 组件懒加载

#### 懒加载组件 (`src/modules/admin/components/lazy-components.tsx`)

```typescript
import {
    LazyUserDetailWrapper,
    LazyProductFormWrapper,
    LazyWrapper
} from '@/modules/admin/components/lazy-components';

// 使用懒加载组件
function AdminPage() {
    return (
        <div>
            <LazyUserDetailWrapper userId="123" />
            <LazyProductFormWrapper productId="456" />
        </div>
    );
}
```

### 6. 增强用户体验

#### 加载状态 (`src/modules/admin/components/enhanced-loading-states.tsx`)

```typescript
import { EnhancedLoadingState, ProgressLoading } from '@/modules/admin/components/enhanced-loading-states';

function DataComponent() {
    const { data, isLoading, error } = useQuery(['data'], fetchData);

    return (
        <EnhancedLoadingState
            isLoading={isLoading}
            error={error}
            onRetry={() => refetch()}
            fallback={<DefaultLoadingFallback />}
        >
            {data && <DataView data={data} />}
        </EnhancedLoadingState>
    );
}
```

#### 乐观更新（待按需实现）

> ⚠️ `src/modules/admin/utils/optimistic-updates.ts` 的通用实现已清理。若需要统一的乐观更新工具，可基于 TanStack Query 的 `useMutation` 在具体业务场景中重建，并结合缓存键约定补充测试。

### 7. 性能监控

#### 监控组件 (`src/modules/admin/components/performance-monitor.tsx`)

```typescript
import { PerformanceMonitor, PerformanceBadge } from '@/modules/admin/components/performance-monitor';

// 完整的监控面板
function AdminMonitoring() {
    return <PerformanceMonitor />;
}

// 简单的性能徽章
function AdminHeader() {
    return (
        <div className="flex items-center space-x-2">
            <h1>管理员仪表盘</h1>
            <PerformanceBadge />
        </div>
    );
}
```

## 📊 性能指标

### 缓存性能

- **命中率**: >85% 为优秀，60-85% 为良好，<60% 需要优化
- **响应时间**: <200ms 为优秀，200-500ms 为良好，>500ms 需要优化
- **失效频率**: 根据业务活动量监控，异常高峰需要调查

### 用户体验指标

- **首屏加载**: 目标 <2秒
- **交互响应**: 目标 <200ms
- **包大小**: 初始包 <350KB，懒加载按需加载

## 🔧 使用指南

### 1. 基本使用

```typescript
// 1. 在API路由中集成缓存
import { withAdminCache } from '@/lib/cache/admin-cache';

export async function GET() {
    const { value, hit } = await withAdminCache(
        'USER',
        () => 'dashboard:metrics',
        fetchDashboardData,
        { ttl: 60 }
    );

    return NextResponse.json({ data: value, meta: { cacheHit: hit } });
}

// 2. 在组件中使用优化查询
import { prefetchAdminQuery } from '@/modules/admin/providers/query-client';

function DashboardComponent() {
    const { data } = useQuery({
        queryKey: ['dashboard'],
        queryFn: fetchDashboard,
        staleTime: 30000
    });

    // 预取相关数据
    useEffect(() => {
        if (data) {
            prefetchAdminQuery(['orders'], fetchOrders);
        }
    }, [data]);

    return <DashboardUI data={data} />;
}
```

### 2. 缓存失效

```typescript
// 在数据变更时触发缓存失效
import { triggerCacheInvalidation } from '@/lib/cache/cache-invalidation';

// 创建订单后
await triggerCacheInvalidation('order_created', {
    tenantId: order.tenantId
});

// 批量操作后
await batchInvalidateCache([
    { event: 'product_created' },
    { event: 'product_updated' }
]);
```

### 3. 组件懒加载

```typescript
// 替换直接导入
// import UserDetail from './UserDetail';
import { LazyUserDetailWrapper } from '@/modules/admin/components/lazy-components';

// 使用懒加载包装器
function UserPage({ userId }) {
    return (
        <LazyUserDetailWrapper
            userId={userId}
            fallback={<UserDetailSkeleton />}
        />
    );
}
```

### 4. 乐观更新

> 可根据具体模块自行封装 Mutation Hook。推荐做法：在组件内部使用 TanStack Query 的 `useMutation`，在 `onMutate` 中手动更新缓存，并结合 `onError`/`onSuccess` 恢复或刷新数据。

## 🚨 故障排除

### 常见问题

1. **缓存命中率低**
   - 检查缓存键是否一致
   - 验证TTL设置是否合理
   - 查看是否有不必要的缓存失效

2. **响应时间慢**
   - 检查数据库查询优化
   - 验证Redis连接状态
   - 查看网络延迟

3. **包大小过大**
   - 确保懒加载组件正常工作
   - 检查是否有重复的依赖
   - 优化图片和静态资源

### 调试工具

```typescript
// 启用调试日志
const manager = getAdminCacheManager();
console.log('Cache stats:', await manager.getStats());

// 强制刷新缓存
fetch('/api/v1/admin/dashboard?bypassCache=true');

// 结合浏览器 Performance 工具排查请求时序
performance.getEntriesByType('resource').forEach((entry) => {
    console.log(entry.name, entry.duration);
});
```

## 📈 监控和报警

### 关键指标

- **缓存命中率** < 70% 时报警
- **平均响应时间** > 500ms 时报警
- **错误率** > 5% 时报警

### 监控配置

```typescript
// 自定义监控钩子
import { PerformanceMonitor } from '@/modules/admin/components/performance-monitor';

function AdminDashboard() {
    return (
        <div>
            <PerformanceMonitor />
            {/* 其他仪表盘内容 */}
        </div>
    );
}
```

## 🔮 未来优化方向

1. **实时数据推送**: 使用WebSocket实现真正的实时更新
2. **智能预测**: 基于机器学习预测用户行为，提前加载数据
3. **边缘计算**: 利用Cloudflare Workers进一步减少延迟
4. **数据压缩**: 对缓存数据进行压缩，减少存储和传输成本
5. **A/B测试**: 对不同的缓存策略进行A/B测试，找到最优配置

## 📚 相关资源

- [Next.js 15 文档](https://nextjs.org/docs)
- [TanStack Query 文档](https://tanstack.com/query/latest)
- [Upstash Redis 文档](https://upstash.com/docs/redis)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)

---

*本文档随代码更新而更新，最后更新时间：2025年1月*