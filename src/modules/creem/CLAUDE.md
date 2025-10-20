[根目录](../../../../CLAUDE.md) > [src/modules](../../) > **creem**

# Creem 模块 - 计费与订阅系统

## 模块职责

集成 Creem Payment 服务，提供完整的 SaaS 计费功能，包括订阅管理、积分系统、支付处理和 Webhook 处理。

## 入口与启动

### 核心入口文件
- **Service**: `services/billing.service.ts` - 计费服务核心逻辑
- **Config**: `config/subscriptions.ts` - 订阅配置
- **Utils**: `utils/verify-signature.ts` - Webhook 签名验证

### API 路由入口
- `/api/v1/creem/create-checkout` - 创建支付会话
- `/api/v1/creem/customer-portal` - 客户门户
- `/api/v1/webhooks/creem` - Webhook 处理

## 对外接口

### 核心服务方法
```typescript
// billing.service.ts
export async function createOrUpdateCustomer(
  creemCustomer: CreemCustomer,
  userId: string
): Promise<number>

export async function createOrUpdateSubscription(
  creemSubscription: CreemSubscription,
  customerId: number
): Promise<number>

export async function addCreditsToCustomer(
  customerId: number,
  credits: number,
  creemOrderId?: string,
  description?: string
): Promise<number>

export async function getCustomerIdByUserId(
  userId: string
): Promise<number | null>
```

### Webhook 处理
```typescript
// utils/verify-signature.ts
export function verifyCreemSignature(
  payload: string,
  signature: string,
  secret: string
): boolean

// webhook 处理器
export async function handleCreemWebhook(
  event: CreemWebhookEvent
): Promise<void>
```

### 客户端组件
```typescript
// components/pricing-grid.tsx
export function PricingGrid({
  plans,
  onPlanSelect,
}: PricingGridProps): JSX.Element

// components/billing-actions.tsx
export function BillingActions({
  customerId,
  currentPlan,
}: BillingActionsProps): JSX.Element
```

## 关键依赖与配置

### 核心依赖
- **数据库**: Drizzle ORM + D1
- **验证**: Zod schema 验证
- **HTTP**: 标准 fetch API

### 环境变量配置
```bash
# Creem Payment 配置
CREEM_SECRET_KEY=sk_live_xxx
CREEM_WEBHOOK_SECRET=whsec_xxx
CREEM_PUBLISHABLE_KEY=pk_live_xxx

# 可选：测试环境
CREEM_SECRET_KEY_TEST=sk_test_xxx
CREEM_WEBHOOK_SECRET_TEST=whsec_test_xxx
```

### 数据库表结构
```sql
-- customers 表
CREATE TABLE customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  creem_customer_id TEXT,
  email TEXT,
  name TEXT,
  country TEXT,
  credits INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- subscriptions 表
CREATE TABLE subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  creem_subscription_id TEXT NOT NULL,
  creem_product_id TEXT,
  status TEXT,
  current_period_start TEXT,
  current_period_end TEXT,
  canceled_at TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- credits_history 表
CREATE TABLE credits_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  creem_order_id TEXT,
  created_at TEXT NOT NULL
);
```

## 订阅配置

### 计划类型
```typescript
// config/subscriptions.ts
export const subscriptionPlans = {
  free: {
    id: 'free',
    name: 'Free Plan',
    price: 0,
    credits: 100,
    features: [
      'Basic features',
      '100 credits per month',
      'Community support'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Pro Plan',
    price: 29,
    credits: 1000,
    features: [
      'Advanced features',
      '1000 credits per month',
      'Priority support',
      'API access'
    ]
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    credits: 5000,
    features: [
      'All features',
      '5000 credits per month',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee'
    ]
  }
};
```

### 积分系统
- **获取方式**: 订阅赠送、单独购买
- **消耗方式**: API 调用、高级功能使用
- **历史记录**: 完整的积分使用追踪
- **自动补充**: 订阅周期自动充值

## 数据模型

### Creem 客户端类型
```typescript
// models/creem.types.ts
export interface CreemCustomer {
  id: string;
  email: string;
  name?: string;
  country?: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface CreemSubscription {
  id: string;
  customer_id: string;
  product: string | CreemProduct;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  current_period_start_date: string;
  current_period_end_date: string;
  canceled_at?: string;
  metadata?: Record<string, any>;
}

export interface CreemProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  recurring?: {
    interval: 'month' | 'year';
    interval_count: number;
  };
}

export interface CreemWebhookEvent {
  id: string;
  type: string;
  data: {
    object: CreemCustomer | CreemSubscription | CreemOrder;
  };
  created: number;
}
```

### Schema 验证
```typescript
// schemas/billing.schema.ts
export const insertCustomerSchema = z.object({
  userId: z.string(),
  creemCustomerId: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  country: z.string().optional(),
  credits: z.number().default(0),
});

export const insertSubscriptionSchema = z.object({
  customerId: z.number(),
  creemSubscriptionId: z.string(),
  creemProductId: z.string().optional(),
  status: z.string(),
  currentPeriodStart: z.string(),
  currentPeriodEnd: z.string(),
  canceledAt: z.string().nullable(),
  metadata: z.string().nullable(),
});
```

## API 路由实现

### 创建支付会话
```typescript
// app/api/v1/creem/create-checkout/route.ts
export async function POST(request: Request) {
  try {
    const { planId, userId } = await request.json();

    // 创建或获取客户
    const customerId = await getOrCreateCustomer(userId);

    // 创建 Creem 支付会话
    const session = await creem.checkout.sessions.create({
      customer_id: customerId,
      success_url: `${process.env.APP_URL}/billing/success`,
      cancel_url: `${process.env.APP_URL}/billing/canceled`,
      line_items: [{
        price: planId,
        quantity: 1
      }]
    });

    return Response.json({ sessionId: session.id });
  } catch (error) {
    return Response.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
```

### 客户门户
```typescript
// app/api/v1/creem/customer-portal/route.ts
export async function POST(request: Request) {
  const { customerId } = await request.json();

  const portalSession = await creem.billing.portal_sessions.create({
    customer: customerId,
    return_url: `${process.env.APP_URL}/billing`,
  });

  return Response.json({ url: portalSession.url });
}
```

### Webhook 处理
```typescript
// app/api/v1/webhooks/creem/route.ts
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('creem-signature');

  // 验证签名
  if (!verifyCreemSignature(body, signature, process.env.CREEM_WEBHOOK_SECRET)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(body) as CreemWebhookEvent;

  // 处理不同类型的事件
  switch (event.type) {
    case 'customer.created':
      await handleCustomerCreated(event.data.object as CreemCustomer);
      break;
    case 'subscription.created':
      await handleSubscriptionCreated(event.data.object as CreemSubscription);
      break;
    case 'payment_intent.succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;
    // ... 其他事件类型
  }

  return Response.json({ received: true });
}
```

## 积分系统

### 积分操作
```typescript
// 添加积分
export async function addCredits(params: {
  userId: string;
  amount: number;
  type: 'purchase' | 'bonus' | 'refund';
  description?: string;
  paymentIntentId?: string;
}): Promise<void>

// 消耗积分
export async function consumeCredits(params: {
  userId: string;
  amount: number;
  description: string;
}): Promise<boolean>

// 获取积分余额
export async function getCreditsBalance(userId: string): Promise<number>

// 获取积分历史
export async function getCreditsHistory(userId: string, options?: {
  limit?: number;
  offset?: number;
  type?: string;
}): Promise<CreditsHistoryRecord[]>
```

### 积分历史记录
```typescript
interface CreditsHistoryRecord {
  id: number;
  customerId: number;
  amount: number;
  type: 'add' | 'consume';
  description: string;
  creemOrderId?: string;
  createdAt: string;
}
```

## 安全特性

### Webhook 安全
- 签名验证确保请求来源
- 幂等性处理防止重复执行
- 事件类型验证
- 错误处理和日志记录

### 数据安全
- 敏感信息加密存储
- API 密钥安全管理
- 用户数据隔离
- 审计日志记录

### 支付安全
- PCI DSS 合规
- 安全的支付处理
- 退款和争议处理
- 欺诈检测

## 测试策略

项目已移除自动化测试框架，质量保障依赖类型检查、文档一致性以及 PR 手工验收。

### 手工验收清单
- 支付流程端到端测试
- Webhook 事件处理验证
- 积分系统逻辑测试
- 订阅状态变更验证
- 安全签名验证测试
- 错误处理场景测试

### 质量保证
- TypeScript 严格类型检查
- Zod 数据验证
- 错误边界处理
- 安全签名验证

详细测试状态请参考：`docs/testing-status.md`

## 常见问题 (FAQ)

### Q: 如何处理支付失败？
A: 监听 Webhook 事件，更新订阅状态，通知用户，提供重试选项。

### Q: 如何实现积分过期？
A: 在积分历史表中添加过期时间字段，定期清理过期积分。

### Q: 如何处理退款？
A: 通过 Creem API 处理退款，Webhook 更新积分和订阅状态。

### Q: 如何支持多种货币？
A: 在 Creem 产品配置中设置多币种价格，根据用户地区显示相应价格。

### Q: 如何实现用量限制？
A: 在 API 调用前检查积分余额，记录使用量，实时更新积分。

## 相关文件清单

### 核心文件
- `services/billing.service.ts` - 计费服务
- `config/subscriptions.ts` - 订阅配置
- `utils/verify-signature.ts` - 签名验证
- `models/creem.types.ts` - 类型定义

### Schema 文件
- `schemas/billing.schema.ts` - 计费数据模式
- `schemas/usage.schema.ts` - 使用量统计模式

### 组件文件
- `components/pricing-grid.tsx` - 价格展示
- `components/billing-actions.tsx` - 计费操作

### 服务文件
- `services/usage.service.ts` - 使用量服务

### API 路由
- `../../app/api/v1/creem/create-checkout/route.ts`
- `../../app/api/v1/creem/customer-portal/route.ts`
- `../../app/api/v1/webhooks/creem/route.ts`

## 使用示例

### 创建客户和订阅
```typescript
import { createOrUpdateCustomer, createOrUpdateSubscription } from '@/modules/creem/services/billing.service';

// 处理 Webhook 中的客户创建事件
async function handleCustomerCreated(creemCustomer: CreemCustomer) {
  // 假设我们通过某种方式获取 userId
  const userId = getUserIdFromCreemCustomer(creemCustomer);

  const customerId = await createOrUpdateCustomer(creemCustomer, userId);
  console.log(`Customer created/updated with ID: ${customerId}`);
}

// 处理订阅创建事件
async function handleSubscriptionCreated(creemSubscription: CreemSubscription) {
  // 获取对应的客户 ID
  const customerId = await getCustomerIdByCreemId(creemSubscription.customer_id);

  if (customerId) {
    const subscriptionId = await createOrUpdateSubscription(creemSubscription, customerId);
    console.log(`Subscription created/updated with ID: ${subscriptionId}`);
  }
}
```

### 积分操作
```typescript
import { addCreditsToCustomer } from '@/modules/creem/services/billing.service';

// 处理成功支付
async function handlePaymentSucceeded(paymentIntent: any) {
  const customerId = paymentIntent.customer;
  const amount = paymentIntent.amount;

  // 将支付金额转换为积分 (1:1 比例)
  const credits = amount / 100; // 假设金额以分为单位

  const newBalance = await addCreditsToCustomer(
    customerId,
    credits,
    paymentIntent.id,
    `Credits purchase - $${amount / 100}`
  );

  console.log(`Added ${credits} credits. New balance: ${newBalance}`);
}
```

### 客户端集成
```typescript
// 在 React 组件中使用
"use client";

import { useState } from 'react';
import { PricingGrid } from '@/modules/creem/components/pricing-grid';

export function BillingPage() {
  const [loading, setLoading] = useState(false);

  const handlePlanSelect = async (planId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/creem/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, userId: 'user-123' })
      });

      const { sessionId } = await response.json();

      // 重定向到 Creem Checkout
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_CREEM_KEY);
      stripe?.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error('Failed to create checkout session:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>选择您的计划</h1>
      <PricingGrid
        plans={subscriptionPlans}
        onPlanSelect={handlePlanSelect}
        loading={loading}
      />
    </div>
  );
}
```

---

## 变更记录 (Changelog)

### 2025-10-21 - 文档一致性更新
- ✅ 移除虚假测试声明和测试文件路径
- ✅ 修正API路径为 `/api/v1/creem/` 和 `/api/v1/webhooks/creem` 格式
- ✅ 更新测试策略说明，引用 `docs/testing-status.md`
- ✅ 添加手工验收清单

### 2025-10-16 01:48:57 - 文档初始化
- ✅ 创建 Creem 计费模块文档
- ✅ 详细的 API 接口说明
- ✅ 积分系统机制描述
- ✅ Webhook 处理流程说明
- ✅ 安全特性说明

---

*此文档由AI自动生成，请根据实际代码变化及时更新。*