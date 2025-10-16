# Toast 系统集成指南

## 概述

项目已成功从 `react-hot-toast` 迁移到 `sonner` Toast 系统，提供更现代化和功能丰富的通知体验。

## 已完成的集成

### 1. 依赖安装

```bash
pnpm add sonner
```

### 2. 核心组件

- **Toast 组件**: `src/components/ui/toast.tsx`
- **Toast 封装器**: `src/lib/toast.ts`
- **根布局集成**: `src/app/layout.tsx`

### 3. 迁移的组件

已迁移以下组件使用新的 Toast 系统：
- ✅ `src/modules/auth/components/login-form.tsx`
- ✅ `src/modules/auth/components/signup-form.tsx`
- ✅ `src/modules/auth/components/logout-button.tsx`

## 使用方法

### 基本用法

```tsx
import { toast } from "@/lib/toast";

// 成功通知
toast.success("操作成功");

// 错误通知
toast.error("操作失败");

// 信息通知
toast.info("提示信息");

// 警告通知
toast.warning("警告信息");

// 加载通知
const loadingId = toast.loading("正在处理...");
// 后续可以更新或关闭
toast.success("处理完成", { id: loadingId });
```

### 高级用法

```tsx
import { toast } from "@/lib/toast";

// 带描述的通知
toast.success("保存成功", {
  description: "数据已成功保存到服务器"
});

// 带操作按钮的通知
toast.success("删除成功", {
  action: {
    label: "撤销",
    onClick: () => console.log("撤销删除操作")
  }
});

// Promise 处理
toast.promise(
  fetchData(),
  {
    loading: "正在加载数据...",
    success: "数据加载成功",
    error: "数据加载失败"
  }
);

// 自定义通知
toast.custom(
  <div>
    <h4>自定义通知</h4>
    <p>这是自定义内容</p>
  </div>,
  {
    duration: 5000
  }
);
```

### 直接使用 Sonner

如果需要更多 sonner 特有功能，可以直接导入：

```tsx
import { toast } from "sonner";

// sonner 的所有方法都可用
toast.message("自定义消息");
toast.sonner("特殊通知");
```

## 配置选项

### 全局配置

Toast 组件已在根布局中配置，包含以下设置：

- **位置**: 右上角 (`top-right`)
- **主题**: 系统主题 (`system`)
- **颜色**: 丰富颜色 (`richColors`)
- **关闭按钮**: 启用
- **展开**: 默认不展开

### 样式定制

Toast 使用 Tailwind CSS 类，支持主题变量：

```css
/* 自定义样式可以通过修改这些类 */
.toaster { /* 容器样式 */ }
.toast { /* 单个通知样式 */ }
.toast-success { /* 成功样式 */ }
.toast-error { /* 错误样式 */ }
.toast-warning { /* 警告样式 */ }
.toast-info { /* 信息样式 */ }
```

## 迁移指南

### 从 react-hot-toast 迁移

1. **替换导入**：
   ```tsx
   // 旧
   import toast from "react-hot-toast";

   // 新
   import { toast } from "@/lib/toast";
   ```

2. **API 兼容性**：
   - `toast.success()` ✅ 完全兼容
   - `toast.error()` ✅ 完全兼容
   - `toast.info()` ✅ 完全兼容
   - `toast.loading()` ✅ 完全兼容
   - `toast.dismiss()` ✅ 完全兼容

3. **新功能**：
   - `toast.warning()` - 新增警告类型
   - `toast.promise()` - Promise 状态处理
   - `toast.custom()` - 自定义内容
   - 更丰富的配置选项

### 待迁移的文件

以下文件仍在使用 `react-hot-toast`，需要逐步迁移：

- `src/modules/auth/components/__tests__/` (测试文件)
- `src/modules/admin/providers/notification-provider.tsx`
- `src/modules/todos/components/add-category.tsx`

## 性能优化

1. **减少重渲染**: sonner 优化了内部状态管理
2. **更好的动画**: 使用 CSS 动画提升性能
3. **自动清理**: 自动清理过期通知，防止内存泄漏

## 最佳实践

1. **使用语义化方法**: 根据消息类型选择合适的方法
2. **提供用户反馈**: 重要操作后显示相应的通知
3. **避免过度使用**: 不要为每个小操作都显示通知
4. **合适的持续时间**: 默认设置已经优化，必要时可自定义

## 故障排除

### 常见问题

1. **Toast 不显示**: 检查根布局是否包含 `<Toast />` 组件
2. **样式问题**: 确保主题变量正确设置
3. **Z-index 问题**: Toast 使用了较高的 z-index，但仍可能被覆盖

### 调试技巧

```tsx
// 开启调试模式
import { toast } from "@/lib/toast";

// 添加控制台输出
console.log("Toast 显示:", message);
toast.success(message);
```

## 未来计划

1. **完成剩余文件迁移**: 清理所有 react-hot-toast 引用
2. **移除 react-hot-toast 依赖**: 减小包体积
3. **添加更多通知类型**: 如进度通知、更新通知等
4. **国际化支持**: 结合 next-intl 实现多语言通知

---

*更新时间: 2025-10-16*
*版本: 1.0*