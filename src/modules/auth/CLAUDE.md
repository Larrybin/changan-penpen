[根目录](../../../../CLAUDE.md) > [src/modules](../../) > **auth**

# Auth 模块 - 身份认证与授权

## 模块职责

负责处理用户身份认证、授权和会话管理的核心模块，集成了 Better Auth 和 Google OAuth。

## 入口与启动

### 核心入口文件
- **Actions**: `auth.action.ts` - 主要的 Server Actions
- **Utils**: `auth-utils.ts` - 认证工具函数和实例获取
- **Client**: `auth-client.ts` - 客户端认证配置
- **Models**: `auth.model.ts` - 认证相关类型定义

### 路由入口
```typescript
// auth.route.ts
const authRoutes = {
  login: "/login",
  signup: "/signup",
} as const;
```

## 对外接口

### Server Actions
```typescript
// 登录
export const signIn = async ({ email, password }: SignInSchema): Promise<AuthResponse>

// 注册
export const signUp = async ({ email, password, username }: SignUpSchema): Promise<AuthResponse>

// 退出
export const signOut = async (): Promise<AuthResponse>
```

### Auth Utils
```typescript
// 获取认证实例
export const getAuthInstance = async () => Promise<Auth>

// 获取当前会话
export const getSession = async () => Promise<Session | null>

// 要求用户认证
export const requireAuth = async () => Promise<User>
```

### Guards (权限守卫)
```typescript
// 用户认证守卫
export const requireUser = async () => Promise<User>

// 管理员权限守卫
export const requireAdmin = async () => Promise<User>
```

## 关键依赖与配置

### 核心依赖
- **better-auth**: `^1.3.28` - 认证框架
- **@auth/drizzle-adapter**: 数据库适配器
- **next/headers**: Next.js headers 操作

### 环境变量要求
```bash
BETTER_AUTH_SECRET=          # 认证密钥
BETTER_AUTH_URL=             # 认证服务URL
GOOGLE_CLIENT_ID=            # Google OAuth客户端ID
GOOGLE_CLIENT_SECRET=        # Google OAuth密钥
```

### 数据库表结构
- **user**: 用户基本信息
- **account**: 第三方账户关联
- **session**: 用户会话
- **verification**: 邮箱验证

## 组件架构

### 表单组件
- `LoginForm` - 登录表单
- `SignupForm` - 注册表单
- `LogoutButton` - 退出按钮

### 布局组件
- `AuthLayout` - 认证页面布局
  - 自动处理用户状态重定向
  - 提供公共的认证页面样式

## 数据模型

### 用户模型 (User)
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 认证响应 (AuthResponse)
```typescript
interface AuthResponse {
  success: boolean;
  code: string;
  messageKey: string;
  message?: string;
}
```

### 认证模式
```typescript
interface SignInSchema {
  email: string;
  password: string;
}

interface SignUpSchema {
  email: string;
  password: string;
  username: string;
}
```

## 测试与质量

### 测试策略
⚠️ **注意**: 此项目已移除自动化测试框架，质量保障依赖手工验收。

### 质量保证
- 使用 Zod 进行输入验证
- 统一的错误处理机制
- 类型安全的API响应
- TypeScript 严格模式检查
- Biome 代码格式化和静态检查

### 手工验收清单
- [ ] 登录功能正常（邮箱密码或OAuth）
- [ ] 注册功能正常
- [ ] 退出登录功能正常
- [ ] 会话管理正确
- [ ] 错误处理友好
- [ ] 重定向逻辑正确

详见 `docs/testing-status.md` 了解完整的测试策略。

## API 路由

### Auth API Route
```typescript
// src/app/api/auth/[...all]/route.ts
export const { GET, POST } = handleAuth();
```

### 会话管理
- 自动会话刷新
- 安全的会话存储
- 跨域会话支持

## 安全特性

### 密码安全
- 安全的密码哈希
- 密码强度验证
- 防暴力破解机制

### 会话安全
- 安全的会话令牌
- 会话过期管理
- CSRF 保护

### OAuth 安全
- 安全的重定向处理
- 状态参数验证
- 作用域最小化原则

## 常见问题 (FAQ)

### Q: 如何添加新的认证提供商？
A: 在 Better Auth 配置中添加新的 provider，并创建相应的环境变量。

### Q: 如何自定义认证页面？
A: 修改 `login.page.tsx` 和 `signup.page.tsx`，复用现有的表单组件。

### Q: 如何处理认证错误？
A: 所有认证操作都返回标准的 `AuthResponse`，包含错误码和消息键。

### Q: 如何扩展用户模型？
A: 修改 `user.model.ts` 和数据库 schema，确保迁移脚本正确执行。

## 相关文件清单

### 核心文件
- `auth.action.ts` - Server Actions
- `auth-utils.ts` - 工具函数
- `auth-client.ts` - 客户端配置
- `auth.model.ts` - 类型定义
- `auth.route.ts` - 路由配置

### 组件文件
- `login.page.tsx` - 登录页面
- `signup.page.tsx` - 注册页面
- `auth.layout.tsx` - 认证布局
- `components/login-form.tsx` - 登录表单
- `components/signup-form.tsx` - 注册表单
- `components/logout-button.tsx` - 退出按钮

### 其他
- `utils/guards.ts` - 权限守卫
- `models/user.model.ts` - 用户模型

## 集成指南

### 在其他模块中使用
```typescript
import { requireAuth } from "@/modules/auth/utils/auth-utils";
import authRoutes from "@/modules/auth/auth.route";

// 在 Server Component 中
export default async function ProtectedPage() {
  const user = await requireAuth();
  return <div>Hello, {user.name}!</div>;
}

// 在客户端重定向中
router.push(authRoutes.login);
```

### 管理员权限检查
```typescript
import { requireAdminForPage } from "@/modules/admin/utils/admin-access";
import { requireAuth } from "@/modules/auth/utils/auth-utils";

export default async function AdminLayout({ children }) {
  const user = await requireAuth();
  await requireAdminForPage(user);
  return <AdminLayout>{children}</AdminLayout>;
}
```

---

## 变更记录 (Changelog)

### 2025-10-16 01:48:57 - 文档初始化
- ✅ 创建认证模块文档
- ✅ 详细的API接口说明
- ✅ 组件架构描述
- ✅ 安全特性说明
- ✅ 常见问题解答

---

*此文档由AI自动生成，请根据实际代码变化及时更新。*