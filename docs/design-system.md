# 设计系统文档

## 概述

本文档描述了基于 Next.js 15 + shadcn/ui + Tailwind CSS 的现代化设计系统，对标世界一流 SaaS 产品的视觉标准。

## 核心原则

### 1. 设计令牌优先
所有视觉元素都基于设计令牌系统，确保一致性和可维护性。

### 2. 可访问性优先
- 色彩对比度符合 WCAG AA 标准（4.5:1）
- 支持键盘导航和屏幕阅读器
- 清晰的焦点指示器

### 3. 响应式设计
基于 clamp() 函数的流畅响应式排版和间距。

### 4. 微交互增强
丰富的视觉反馈提升用户体验。

## 设计令牌系统

### 色彩系统

#### 品牌色彩
```css
--token-color-primary: #0f172a;    /* 深蓝黑色，增强对比度 */
--token-color-bg: #ffffff;          /* 白色背景 */
--token-color-accent: #3b82f6;      /* 现代蓝色强调色 */
```

#### 语义色彩
```css
/* 成功色 */
--color-success: #059669;           /* 翠翠绿 */
--color-success-foreground: #064e3b;
--color-success-subtle: #d1fae5;
--color-success-border: #34d399;

/* 警告色 */
--color-warning: #d97706;           /* 琥珀色 */
--color-warning-foreground: #92400e;
--color-warning-subtle: #fef3c7;
--color-warning-border: #fbbf24;

/* 信息色 */
--color-info: #2563eb;              /* 蓝色 */
--color-info-foreground: #1e3a8a;
--color-info-subtle: #dbeafe;
--color-info-border: #60a5fa;

/* 危险色 */
--color-danger: #dc2626;            /* 红色 */
--color-danger-foreground: #991b1b;
--color-danger-subtle: #fee2e2;
--color-danger-border: #f87171;
```

#### 中性色彩
基于 Tailwind CSS 的中性色系统，支持明暗主题。

### 字体系统

#### 字体族
```css
--token-font-family-sans: var(--font-inter);    /* 主字体 */
--token-font-family-mono: var(--font-geist-mono); /* 等宽字体 */
```

#### 字重层次
```css
--token-font-weight-light: 300;
--token-font-weight-normal: 400;
--token-font-weight-medium: 500;
--token-font-weight-semibold: 600;
--token-font-weight-bold: 700;
--token-font-weight-extrabold: 800;
```

#### 排版层次
```css
/* 显示字体 */
.text-display {
    font-size: clamp(3rem, 8vw + 1rem, 6rem);
    line-height: clamp(3.5rem, 8vw + 1.5rem, 6.5rem);
    font-weight: var(--token-font-weight-extrabold);
    letter-spacing: -0.02em;
}

/* 标题 */
.text-title {
    font-size: clamp(2rem, 5vw + 1rem, 3rem);
    line-height: clamp(2.5rem, 5vw + 1.5rem, 3.5rem);
    font-weight: var(--token-font-weight-bold);
    letter-spacing: -0.01em;
}

/* 副标题 */
.text-subtitle {
    font-size: 1.5rem;
    line-height: 2rem;
    font-weight: var(--token-font-weight-semibold);
}

/* 正文 */
.text-body {
    font-size: 1rem;
    line-height: 1.5rem;
    font-weight: var(--token-font-weight-normal);
}

/* 小正文 */
.text-body-sm {
    font-size: 0.875rem;
    line-height: 1.25rem;
    font-weight: var(--token-font-weight-normal);
}

/* 说明文字 */
.text-caption {
    font-size: 0.75rem;
    line-height: 1rem;
    font-weight: var(--token-font-weight-medium);
    color: var(--muted-foreground);
}
```

### 间距系统

基于 8px 网格的间距系统：
```css
--token-spacing-small: 0.5rem;   /* 8px */
--token-spacing-medium: 1rem;    /* 16px */
--token-spacing-large: 2rem;     /* 32px */
```

### 阴影系统

现代化的分层阴影系统：
```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
```

#### 上下文阴影
```css
--shadow-card: var(--shadow-lg);
--shadow-button: var(--shadow-md);
--shadow-dropdown: var(--shadow-xl);
--shadow-modal: var(--shadow-2xl);
```

### 动画系统

#### 时长标准
```css
--token-motion-duration-fast: 100ms;
--token-motion-duration-md: 200ms;
--token-motion-duration-slow: 300ms;
--token-motion-duration-slower: 500ms;
```

#### 缓动函数
```css
--token-motion-ease-standard: cubic-bezier(0.2, 0, 0, 1);
--token-motion-ease-emphasized: cubic-bezier(0.2, 0, 0, 1);
--token-motion-ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--token-motion-ease-back: cubic-bezier(0.175, 0.885, 0.32, 1.275);
```

## 组件库

### 按钮 (Button)

#### 变体
- `default`: 主要按钮
- `secondary`: 次要按钮
- `outline`: 轮廓按钮
- `destructive`: 危险按钮
- `ghost`: 幽灵按钮
- `link`: 链接按钮

#### 尺寸
- `sm`: 小尺寸 (32px 高)
- `default`: 默认尺寸 (36px 高)
- `lg`: 大尺寸 (40px 高)
- `icon`: 图标按钮 (36px 正方形)

#### 使用示例
```tsx
<Button variant="default" size="default">
  主要操作
</Button>

<Button variant="outline" size="sm" className="scale-hover">
  次要操作
</Button>
```

### 卡片 (Card)

#### 特性
- 现代化阴影效果
- hover 时提升动画
- 完全令牌化样式
- 响应式间距

#### 使用示例
```tsx
<Card className="lift-hover fade-in">
  <CardHeader>
    <CardTitle>卡片标题</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-body">卡片内容</p>
  </CardContent>
</Card>
```

### 表单组件

#### 输入框 (Input)
```tsx
<Input 
  placeholder="请输入内容" 
  className="glow-focus"
/>
```

#### 选择器 (Select)
```tsx
<Select>
  <SelectTrigger className="focus-ring">
    <SelectValue placeholder="选择选项" />
  </SelectTrigger>
  <SelectContent>
    {/* 选项 */}
  </SelectContent>
</Select>
```

#### 徽章 (Badge)
```tsx
<Badge variant="default" className="scale-hover">
  默认徽章
</Badge>

<Badge variant="destructive">
  危险徽章
</Badge>
```

## 微交互工具类

### 缩放动画
```css
.scale-active     /* 点击时缩放 */
.scale-hover      /* 悬停时缩放 */
```

### 提升动画
```css
.lift-hover       /* 卡片悬停提升 */
```

### 焦点效果
```css
.glow-focus       /* 发光焦点 */
.focus-ring        /* 增强焦点环 */
```

### 动画效果
```css
.fade-in          /* 淡入动画 */
.slide-in-left    /* 左侧滑入 */
.pulse-subtle     /* 微妙脉冲 */
.shimmer          /* 闪烁加载 */
```

### 交互增强
```css
.btn-interactive  /* 按钮波纹效果 */
.color-transition /* 颜色平滑过渡 */
```

## 使用指南

### 1. 色彩使用原则

- **主色彩**: 用于主要操作和重要元素
- **辅助色**: 用于次要操作和强调元素
- **语义色**: 用于状态指示（成功、警告、错误、信息）
- **中性色**: 用于文本、边框和背景

### 2. 字体使用指南

- **显示字体**: 页面主标题和英雄区域
- **标题字体**: 章节标题和卡片标题
- **正文字体**: 主要内容区域
- **小字体**: 辅助信息和元数据
- **说明文字**: 表单标签和注释

### 3. 间距使用标准

- **小间距**: 元素内部间距
- **中间距**: 相关元素间间距
- **大间距**: 独立区块间间距

### 4. 阴影使用原则

- **轻阴影**: 表单元素和轻量级组件
- **中阴影**: 按钮和交互元素
- **重阴影**: 卡片和浮动元素
- **最深阴影**: 模态框和下拉菜单

## 最佳实践

### 1. 组件组合
```tsx
// 推荐：使用语义化的类名组合
<div className="space-y-token fade-in">
  <Card className="lift-hover">
    <CardHeader>
      <CardTitle className="text-title">标题</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-body">内容</p>
      <Button className="btn-interactive">操作</Button>
    </CardContent>
  </Card>
</div>
```

### 2. 状态管理
```tsx
// 推荐：条件应用交互类
<Button 
  disabled={isLoading}
  className={cn(
    "btn-interactive scale-active",
    isLoading && "pulse-subtle"
  )}
>
  {isLoading ? '加载中...' : '提交'}
</Button>
```

### 3. 响应式设计
```tsx
// 推荐：使用 clamp() 实现流畅响应式
<h1 className="text-title">响应式标题</h1>
<div className="space-y-token-lg">
  {/* 内容 */}
</div>
```

## 维护指南

### 1. 添加新令牌
1. 在 `globals.css` 中定义新的 CSS 变量
2. 更新本文档
3. 在相关组件中应用新令牌

### 2. 组件定制
1. 优先使用设计令牌
2. 避免硬编码颜色和尺寸
3. 使用 class-variance-authority 创建变体

### 3. 性能优化
- 合理使用动画，避免过度动画
- 优化阴影渲染性能
- 使用 transform 而非 position 动画

## 质量标准

### 视觉一致性
- 组件令牌覆盖率 >95%
- 设计令牌使用率 >90%

### 可访问性
- 色彩对比度 100% 符合 WCAG AA 标准
- 焦点指示器清晰可见
- 支持键盘导航

### 性能指标
- 交互动画流畅度 >60fps
- 页面加载无布局偏移
- 组件渲染性能优化

## 更新记录

### v1.0.0 (当前版本)
- ✅ 建立完整的设计令牌系统
- ✅ 实现现代化的色彩体系
- ✅ 添加丰富的微交互效果
- ✅ 建立字体层次系统
- ✅ 优化阴影和视觉层次
- ✅ 实现响应式设计标准

---

*本文档随设计系统更新而维护，如有问题请提交 issue 或联系设计团队。*