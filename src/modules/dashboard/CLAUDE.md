[根目录](../../../../CLAUDE.md) > [src/modules](../../) > **dashboard**

# Dashboard 模块 - 用户仪表板

## 模块职责

为已认证用户提供个人化的仪表板界面，作为用户登录后的主要导航和功能入口。

## 入口与启动

### 核心入口文件
- **Layout**: `dashboard.layout.tsx` - 仪表板布局和认证检查
- **Route**: `dashboard.route.ts` - 路由配置
- **Metadata**: `metadata.ts` - 页面元数据配置

### 路由入口
```typescript
// dashboard.route.ts
const dashboardRoutes = {
  dashboard: "/dashboard",
} as const;
```

## 对外接口

### 布局组件
```typescript
// dashboard.layout.tsx
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<JSX.Element>
```

### 认证检查
- 自动验证用户会话
- 未认证用户重定向到登录页
- 提供全局的导航结构

## 关键依赖与配置

### 核心依赖
- **next/navigation**: Next.js 导航功能
- **@modules/auth**: 认证模块依赖

### 布局依赖
- `Navigation` - 主导航组件
- `getSession` - 会话获取函数
- `authRoutes` - 认证路由配置

### 响应式设计
- 移动端优先设计
- 最大宽度约束: `md:w-xl`
- 垂直居中布局

## 组件架构

### 布局结构
```typescript
<div className="flex flex-col min-h-screen">
  <Navigation />                    {/* 顶部导航栏 */}
  <div className="w-full md:w-xl mx-auto py-8 px-4">
    {children}                     {/* 页面内容区域 */}
  </div>
</div>
```

### 导航组件 (Navigation)
- **位置**: `src/components/navigation.tsx`
- **功能**:
  - 用户信息显示
  - 主要功能导航
  - 退出登录功能
  - 响应式菜单

### 页面内容区域
- 固定最大宽度确保阅读体验
- 适配不同屏幕尺寸
- 统一的内边距设计

## 认证流程

### 会话验证
```typescript
const session = await getSession();

if (!session) {
  redirect(authRoutes.login);
}
```

### 重定向逻辑
- 未认证用户 → 登录页面
- 已认证用户 → 仪表板内容
- 自动处理会话过期

## 样式与主题

### Tailwind CSS 类
- `flex flex-col min-h-screen` - 全屏垂直布局
- `w-full md:w-xl` - 响应式宽度控制
- `mx-auto py-8 px-4` - 居中和内边距

### 设计原则
- 简洁清晰的界面
- 良好的内容可读性
- 移动端友好体验
- 与整体设计系统一致

## 功能特性

### 当前功能
- ✅ 用户认证保护
- ✅ 全局导航栏
- ✅ 响应式布局
- ✅ 会话管理

### 潜在扩展
- 📋 用户个人信息卡片
- 📊 快速统计信息
- 🚀 快捷操作入口
- 📱 移动端侧边栏

## 集成模块

### 与 Auth 模块集成
```typescript
import { getSession } from "@/modules/auth/utils/auth-utils";
import authRoutes from "../auth/auth.route";
```

### 与 Navigation 组件集成
```typescript
import { Navigation } from "@/components/navigation";
```

### 与其他页面模块集成
- `todos/*` - 任务管理页面
- `settings/*` - 用户设置页面
- `profile/*` - 个人资料页面

## 测试与质量

### 测试覆盖
- ⚠️ **布局测试**: 需补充布局组件测试
- ⚠️ **认证流程测试**: 需补充认证重定向测试
- ⚠️ **响应式测试**: 需补充不同屏幕尺寸测试

### 质量保证
- TypeScript 类型安全
- 自动会话验证
- 错误边界处理
- 性能优化

## 性能优化

### 优化策略
- 服务端渲染 (SSR)
- 最小化客户端 JavaScript
- 组件懒加载
- 缓存静态资源

### 加载性能
- 快速首屏渲染
- 导航栏即时显示
- 内容区域按需加载

## 可访问性 (Accessibility)

### ARIA 支持
- 语义化 HTML 结构
- 键盘导航支持
- 屏幕阅读器兼容

### 用户体验
- 清晰的导航结构
- 一致的交互模式
- 良好的颜色对比度

## 常见问题 (FAQ)

### Q: 如何自定义仪表板布局？
A: 修改 `dashboard.layout.tsx` 中的 JSX 结构，添加或调整布局组件。

### Q: 如何添加仪表板特有的功能？
A: 在布局中添加新的组件，或创建专门的仪表板页面组件。

### Q: 如何处理不同用户角色的显示？
A: 在布局中添加角色检查逻辑，根据用户角色显示不同的导航选项。

### Q: 如何优化移动端体验？
A: 调整 Tailwind CSS 类，使用响应式断点优化移动端布局。

### Q: 如何集成用户快速统计？
A: 在布局中添加统计组件，从相应的服务 API 获取数据。

## 相关文件清单

### 核心文件
- `dashboard.layout.tsx` - 主布局组件
- `dashboard.route.ts` - 路由配置
- `metadata.ts` - 页面元数据

### 依赖组件
- `../../components/navigation.tsx` - 导航组件
- `../auth/auth.route.ts` - 认证路由
- `../auth/utils/auth-utils.ts` - 认证工具

### 页面文件 (使用此布局)
- `../todos/todo-list.page.tsx` - 任务列表页
- `../todos/new-todo.page.tsx` - 新建任务页
- `../todos/edit-todo.page.tsx` - 编辑任务页

## 使用示例

### 基本使用
```typescript
// 任何需要仪表板布局的页面
import DashboardLayout from "@/modules/dashboard/dashboard.layout";

export default function MyProtectedPage() {
  return (
    <div>
      <h1>受保护的内容</h1>
      {/* 页面内容 */}
    </div>
  );
}

// 在 app 目录中使用
// app/dashboard/my-page/page.tsx
import DashboardLayout from "@/modules/dashboard/dashboard.layout";

export default function Layout({ children }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
```

### 自定义仪表板内容
```typescript
// app/dashboard/page.tsx - 仪表板首页
export default function DashboardHomePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">欢迎回来</h1>

      {/* 快捷统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded-lg shadow">
          <h3>任务概览</h3>
          {/* 任务统计内容 */}
        </div>
        <div className="p-4 bg-white rounded-lg shadow">
          <h3>最近活动</h3>
          {/* 活动列表 */}
        </div>
      </div>

      {/* 快捷操作 */}
      <div className="flex gap-4">
        <Link href="/dashboard/todos/new">
          <Button>创建新任务</Button>
        </Link>
      </div>
    </div>
  );
}
```

### 扩展布局功能
```typescript
// 自定义仪表板布局
import { requireAuth } from "@/modules/auth/utils/auth-utils";
import { getUserStats } from "@/services/stats.service";

export default async function EnhancedDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const userStats = await getUserStats(user.id);

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation userStats={userStats} />
      <div className="w-full md:w-xl mx-auto py-8 px-4">
        {/* 用户信息卡片 */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h2>欢迎，{user.name}!</h2>
          <p>您有 {userStats.pendingTasks} 个待办任务</p>
        </div>

        {children}
      </div>
    </div>
  );
}
```

## 元数据配置

### SEO 优化
```typescript
// metadata.ts
export const metadata: Metadata = {
  title: "Dashboard - My App",
  description: "用户个人仪表板",
  robots: "noindex, nofollow", // 登录后页面通常不需要索引
};
```

## 下一步开发计划

### 短期目标
- [ ] 添加用户个人信息展示
- [ ] 集成快速统计信息
- [ ] 优化移动端导航
- [ ] 添加布局组件测试

### 长期目标
- [ ] 可定制的仪表板布局
- [ ] 实时通知集成
- [ ] 多主题支持
- [ ] 高级用户偏好设置

---

## 变更记录 (Changelog)

### 2025-10-16 01:48:57 - 文档初始化
- ✅ 创建仪表板模块文档
- ✅ 布局结构和认证流程说明
- ✅ 组件架构描述
- ✅ 集成方式说明
- 📋 待完成：补充测试用例和更多功能

---

*此文档由AI自动生成，请根据实际代码变化及时更新。*